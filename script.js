const scriptversion = "0.2.b14";

document.addEventListener("DOMContentLoaded", () => {

  // Versionsanzeige
  const el = document.getElementById("versioninfo");
  if (el) el.textContent = "v" + scriptversion;

  // DOM-Elemente
  const input   = document.getElementById("spoolmanInput");
  const saveBtn = document.getElementById("saveUrl");
  const scanBtn = document.getElementById("scan");
  const card    = document.getElementById("card");
  const scaninfo = document.getElementById("scaninfo");

  const brandEl    = document.getElementById("brand");
  const typeEl     = document.getElementById("type");
  const protocolEl = document.getElementById("protocol");
  const versionEl  = document.getElementById("version");
  const smidEl     = document.getElementById("smid");
  const tempEl     = document.getElementById("temp");
  const colorBox   = document.getElementById("color");

  const diameterEl = document.getElementById("diameter");
  const weightEl   = document.getElementById("weight");
  const nozzleEl   = document.getElementById("nozzle");
  const bedEl      = document.getElementById("bed");
  const dryingEl   = document.getElementById("drying");
  const hygroEl    = document.getElementById("hygro");
  const safetyEl   = document.getElementById("safety");
  const lotEl      = document.getElementById("lot");
  const mdateEl    = document.getElementById("mdate");
  const linkEl     = document.getElementById("spoolmanLink");

  // Cookie beim Laden ins Feld
  const savedUrl = getCookie("SpoolmanURL");
  if (savedUrl && input) input.value = savedUrl;

  // URL speichern
  if (saveBtn) {
    saveBtn.onclick = () => {
      if (!input.value) return alert("Bitte eine Spoolman-URL eingeben");
      setCookie("SpoolmanURL", input.value.trim(), 365);
      alert("SpoolmanURL gespeichert");
    };
  }

  // NFC Scan
  if (scanBtn) {
    scanBtn.addEventListener("click", async () => {
      try {
        const ndef = new NDEFReader();
        await ndef.scan();

        ndef.onreading = event => {

          const serial = event.serialNumber || "nicht verfügbar";

          if (!event.message || !event.message.records.length) {
            alert("Kein NDEF-Datensatz auf dem NFC-Tag.");
            return;
          }

          const record = event.message.records[0];
          const jsonString = new TextDecoder().decode(record.data);

          let data;
          try {
            data = JSON.parse(jsonString);
          } catch {
            alert("Kein gültiges JSON auf dem NFC-Tag.");
            return;
          }

          brandEl.textContent    = val(data.brand);
          typeEl.textContent     = val(data.type);
          protocolEl.textContent = val(data.protocol);
          versionEl.textContent  = val(data.version);
          smidEl.textContent     = val(data.sm_id);

          diameterEl.textContent = val(data.diameter ? data.diameter + " mm" : null);
          weightEl.textContent   = val(data.weight_remaining ? data.weight_remaining + " g" : null);
          nozzleEl.textContent   = val(data.nozzle_min && data.nozzle_max ? `${data.nozzle_min}–${data.nozzle_max} °C` : null);
          bedEl.textContent      = val(data.bed_temp_min && data.bed_temp_max ? `${data.bed_temp_min}–${data.bed_temp_max} °C` : null);
          dryingEl.textContent   = val(data.drying_temp ? data.drying_temp + " °C" : null);
          hygroEl.textContent    = val(data.hygroscopic_level);
          safetyEl.textContent   = val(data.safety_class);
          lotEl.textContent      = val(data.lot_number);
          mdateEl.textContent    = val(data.manufacture_date);

          tempEl.textContent = (data.min_temp && data.max_temp)
            ? `${data.min_temp}°C – ${data.max_temp}°C`
            : "kein Eintrag gespeichert";

          colorBox.style.background = data.color_hex ? "#" + data.color_hex : "#ccc";

          // Seriennummer anzeigen
          let serialEl = document.getElementById("serial");
          if (!serialEl) {
            serialEl = document.createElement("div");
            serialEl.className = "value";
            serialEl.id = "serial";
            card.appendChild(serialEl);
          }
          serialEl.innerHTML = `<span class="label">Chip-Seriennummer</span><br>${serial}`;

          // Spoolman-Link erzeugen
          const baseUrl = getCookie("SpoolmanURL");
          if (baseUrl && data.sm_id && linkEl) {
            const fullUrl = baseUrl.replace(/\/$/, "") + "/spool/show/" + data.sm_id;
            linkEl.innerHTML = `<a href="${fullUrl}" target="_blank">${fullUrl}</a>`;
          } else {
        linkEl.textContent = "keine URL konfiguriert";
      }

          if (scaninfo) scaninfo.style.display = "none";
          card.style.display = "block";
        };

      } catch {
        alert("Web NFC wird von diesem Browser nicht unterstützt.");
      }
    });
  }
});

// Hilfsfunktionen
function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = name + "=" + encodeURIComponent(value) +
    ";expires=" + d.toUTCString() + ";path=/";
}

function getCookie(name) {
  const cookies = document.cookie.split("; ");
  for (let c of cookies) {
    const [key, val] = c.split("=");
    if (key === name) return decodeURIComponent(val);
  }
  return null;
}

function val(v) {
  return (v !== undefined && v !== null && v !== "") ? v : "kein Eintrag gespeichert";
}