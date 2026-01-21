const scriptversion = "0.1.16b8";

document.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("versioninfo");
  if (el) {
    el.textContent = "v" + scriptversion;
  }
});


const scanBtn = document.getElementById("scan");
const card = document.getElementById("card");

const brandEl = document.getElementById("brand");
const typeEl = document.getElementById("type");
const protocolEl = document.getElementById("protocol");
const versionEl = document.getElementById("version");
const smidEl = document.getElementById("smid");
const tempEl = document.getElementById("temp");
const colorBox = document.getElementById("color");

const diameterEl = document.getElementById("diameter");
const weightEl   = document.getElementById("weight");
const nozzleEl   = document.getElementById("nozzle");
const bedEl      = document.getElementById("bed");
const dryingEl   = document.getElementById("drying");
const hygroEl    = document.getElementById("hygro");
const safetyEl   = document.getElementById("safety");
const lotEl      = document.getElementById("lot");
const mdateEl    = document.getElementById("mdate");

function val(v) {
  return (v !== undefined && v !== null && v !== "") ? v : "kein Eintrag gespeichert";
}

scanBtn.addEventListener("click", async () => {
  try {
    const ndef = new NDEFReader();
    await ndef.scan();

    ndef.onreading = event => {

      // Seriennummer / UID (falls vom Browser geliefert)
      const serial = event.serialNumber || "nicht verfügbar";

      if (!event.message || !event.message.records.length) {
        alert("Kein NDEF-Datensatz auf dem NFC-Tag gespeichert.");
        return;
      }

      const record = event.message.records[0];
      const jsonString = new TextDecoder().decode(record.data);

      let data;
      try {
        data = JSON.parse(jsonString);
      } catch (e) {
        alert("Auf dem NFC-Tag ist kein gültiges JSON gespeichert.");
        return;
      }

      brandEl.textContent    = val(data.brand);
      typeEl.textContent     = val(data.type);
      protocolEl.textContent = val(data.protocol);
      versionEl.textContent  = val(data.version);
      smidEl.textContent     = val(data.sm_id);
      
      
      diameterEl.textContent = val(data.diameter ? data.diameter + " mm" : null);
weightEl.textContent   = val(data.weight_remaining ? data.weight_remaining + " g" : null);
nozzleEl.textContent   = val(data.nozzle_min && data.nozzle_max ? data.nozzle_min + "–" + data.nozzle_max + " °C" : null);
bedEl.textContent      = val(data.bed_temp_min && data.bed_temp_max ? data.bed_temp_min + "–" + data.bed_temp_max + " °C" : null);
dryingEl.textContent   = val(data.drying_temp ? data.drying_temp + " °C" : null);
hygroEl.textContent    = val(data.hygroscopic_level);
safetyEl.textContent   = val(data.safety_class);
lotEl.textContent      = val(data.lot_number);
mdateEl.textContent    = val(data.manufacture_date);

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

      // Seriennummer sichtbar machen
      if (!document.getElementById("serial")) {
        const sn = document.createElement("div");
        sn.className = "value";
        sn.id = "serial";
        sn.innerHTML = `<span class="label">Chip-Seriennummer</span><br>${serial}`;
        card.appendChild(sn);
      } else {
        document.getElementById("serial").innerHTML =
          `<span class="label">Chip-Seriennummer</span><br>${serial}`;
      }
      
      scaninfo.style.display = "none";
      card.style.display = "block";
    };

  } catch (error) {
    alert("NFC nicht verfügbar oder Zugriff nicht erlaubt.");
  }
});


