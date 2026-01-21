const scanBtn = document.getElementById("scan");
const card = document.getElementById("card");

const brandEl = document.getElementById("brand");
const typeEl = document.getElementById("type");
const protocolEl = document.getElementById("protocol");
const versionEl = document.getElementById("version");
const smidEl = document.getElementById("smid");
const tempEl = document.getElementById("temp");
const colorBox = document.getElementById("color");

function val(v) {
  return (v !== undefined && v !== null && v !== "") ? v : "kein Eintrag gespeichert";
}

scanBtn.addEventListener("click", async () => {
  try {
    const ndef = new NDEFReader();
    await ndef.scan();

    ndef.onreading = event => {
      const record = event.message.records[0];
      const jsonString = new TextDecoder().decode(record.data);

      try {
        const data = JSON.parse(jsonString);

        brandEl.textContent    = val(data.brand);
        typeEl.textContent     = val(data.type);
        protocolEl.textContent = val(data.protocol);
        versionEl.textContent  = val(data.version);
        smidEl.textContent     = val(data.sm_id);

        if (data.min_temp && data.max_temp) {
          tempEl.textContent = `${data.min_temp}°C – ${data.max_temp}°C`;
        } else {
          tempEl.textContent = "kein Eintrag gespeichert";
        }

        if (data.color_hex) {
          colorBox.style.background = "#" + data.color_hex;
        } else {
          colorBox.style.background = "#ccc";
        }

        scaninfo.style.display = "none";
        card.style.display = "block";
      } catch (e) {
        alert("Kein gültiges JSON auf dem NFC-Tag");
      }
    };
  } catch (error) {
    alert("NFC nicht verfügbar oder Zugriff verweigert.");
  }
});
