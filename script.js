const scriptversion = "0.4.3g";
const EXPERIMENTAL_KEY = "experimentalEnabled";
const THEME_KEY = "themeMode";

/* =========================
   Helper
========================= */

function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + days * 864e5);
  document.cookie =
    name + "=" + encodeURIComponent(value) +
    ";expires=" + d.toUTCString() + ";path=/";
}

function getCookie(name) {
  const entry = document.cookie
    .split("; ")
    .find(c => c.startsWith(name + "="));
  return entry
    ? decodeURIComponent(entry.split("=").slice(1).join("="))
    : null;
}

function val(v) {
  return (v !== undefined && v !== null && v !== "")
    ? v
    : "kein Eintrag gespeichert";
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = val(value);
}

function experimentalEnabled() {
  return localStorage.getItem(EXPERIMENTAL_KEY) === "true";
}

/* =========================
   DOM INIT
========================= */

document.addEventListener("DOMContentLoaded", () => {

  /* ---------- Version ---------- */

  const el = document.getElementById("versioninfo");
  if (el) el.textContent = "v" + scriptversion;

/* =========================
   THEME – stabiler 3-Modus
========================= */

const themeSelect = document.getElementById("themeSelect");
const THEME_KEY = "themeMode";

const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

function applyTheme(mode) {

  // HARTE RESET-LOGIK
  document.body.classList.remove("dark");

  switch (mode) {

    case "dark":
      document.body.classList.add("dark");
      break;

    case "system":
      if (mediaQuery.matches) {
        document.body.classList.add("dark");
      }
      break;

    case "light":
    default:
      // bleibt hell
      break;
  }
}

// Initial laden
const savedTheme = localStorage.getItem(THEME_KEY) || "system";
applyTheme(savedTheme);

if (themeSelect) {
  themeSelect.value = savedTheme;

  themeSelect.addEventListener("change", () => {
    const mode = themeSelect.value;

    localStorage.setItem(THEME_KEY, mode);

    applyTheme(mode);
  });
}

// Systemwechsel nur beachten wenn Systemmodus aktiv
mediaQuery.addEventListener("change", () => {
  const current = localStorage.getItem(THEME_KEY) || "system";

  if (current === "system") {
    applyTheme("system");
  }
});
  /* =========================
     Experimental Toggle
  ========================= */

  const toggle = document.getElementById("toggleExperimental");
  const expBlock = document.getElementById("experimentalBlock");

  if (toggle && expBlock) {
    const enabled = experimentalEnabled();
    toggle.checked = enabled;
    expBlock.style.display = enabled ? "block" : "none";

    toggle.addEventListener("change", () => {
      const state = toggle.checked;
      localStorage.setItem(EXPERIMENTAL_KEY, state);
      expBlock.style.display = state ? "block" : "none";
    });
  }

  /* =========================
     Spoolman URL Save
  ========================= */

  const input = document.getElementById("spoolmanInput");
  const saveBtn = document.getElementById("saveUrl");

  const savedUrl = getCookie("SpoolmanURL");
  if (savedUrl && input) input.value = savedUrl;

  if (saveBtn) {
    saveBtn.onclick = () => {
      if (!input.value.trim()) {
        alert("Bitte eine Spoolman-Basis-URL eingeben");
        return;
      }
      setCookie("SpoolmanURL", input.value.trim(), 365);
      alert("SpoolmanURL gespeichert");
    };
  }

  /* =========================
     NFC Scan
  ========================= */

  const scanBtn = document.getElementById("scan");
  const scaninfo = document.getElementById("scaninfo");
  const card = document.getElementById("card");
  const spoolmanWeightEl = document.getElementById("spoolmanWeight");

  if (!scanBtn) return;

  scanBtn.addEventListener("click", async () => {

    try {
      const ndef = new NDEFReader();
      await ndef.scan();

      ndef.onreading = event => {

        if (!event.message?.records?.length) {
          alert("Kein NDEF-Datensatz auf dem NFC-Tag");
          return;
        }

        let data;

        try {
          const record = event.message.records[0];
          data = JSON.parse(new TextDecoder().decode(record.data));
        } catch {
          alert("Kein gültiges JSON auf dem NFC-Tag");
          return;
        }

        setText("brand", data.brand);
        setText("type", data.type);
        setText("protocol", data.protocol);
        setText("version", data.version);
        setText("smid", data.sm_id);

        setText(
          "temp",
          data.min_temp && data.max_temp
            ? `${data.min_temp}–${data.max_temp} °C`
            : null
        );

        const color = document.getElementById("color");
        if (color) {
          color.style.background =
            data.color_hex ? "#" + data.color_hex : "#ccc";
        }

        const base = getCookie("SpoolmanURL");
        const link = document.getElementById("spoolmanLink");

        if (base && data.sm_id && link) {
          link.innerHTML =
            `<a href="${base.replace(/\/$/, "")}/spool/show/${data.sm_id}" target="_blank">öffnen</a>`;
        }

        if (experimentalEnabled() && data.sm_id) {
          loadSpoolmanWeight(data.sm_id, spoolmanWeightEl);
        } else if (spoolmanWeightEl) {
          spoolmanWeightEl.textContent = "—";
        }

        scaninfo.style.display = "none";
        card.style.display = "block";
      };

    } catch {
      alert("Web NFC wird von diesem Browser nicht unterstützt");
    }

  });

});

/* =========================
   Spoolman API
========================= */

async function loadSpoolmanWeight(sm_id, targetEl) {

  const base = getCookie("SpoolmanURL");

  if (!base) {
    targetEl.textContent = "SpoolmanURL fehlt";
    return;
  }

  try {
    const res = await fetch(
      base.replace(/\/$/, "") + "/api/v1/spool/" + sm_id
    );

    if (!res.ok) throw new Error(res.status);

    const data = await res.json();

    targetEl.textContent =
      data.remaining_weight !== undefined
        ? data.remaining_weight + " g"
        : "kein Gewicht verfügbar";

  } catch (e) {
    targetEl.textContent = "Spoolman nicht erreichbar";
    console.error(e);
  }

}