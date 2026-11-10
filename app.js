// Calculadora de Prestación por Desempleo ANSES (Ley 24.013)

function formatARS(val) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(val);
}

function calculate() {
  const netSalary = Math.max(0, parseFloat(document.getElementById("netSalaryInput").value) || 0);
  const smvm = Math.max(100000, parseFloat(document.getElementById("smvmInput").value) || 290000);
  const tenureMonths = parseInt(document.getElementById("antiguedadSelect").value, 10) || 36;
  const isOver45 = document.getElementById("edad45Check").checked;

  // 1. Base legal: 75% del mejor sueldo neto habitual del último semestre
  const raw75 = netSalary * 0.75;

  // 2. Piso y Tope legal basados en el Salario Mínimo Vital y Móvil (SMVM)
  const minFloor = smvm * 0.50; // 50% del SMVM
  const maxCap = smvm * 1.00;   // 100% del SMVM

  let initialQuota = raw75;
  let statusNote = "";

  if (raw75 > maxCap) {
    initialQuota = maxCap;
    statusNote = `Tope máximo legal alcanzado (100% del SMVM: ${formatARS(maxCap)})`;
  } else if (raw75 < minFloor) {
    initialQuota = minFloor;
    statusNote = `Piso mínimo legal garantizado (50% del SMVM: ${formatARS(minFloor)})`;
  } else {
    statusNote = `Calculado al 75% de tu sueldo neto (${formatARS(raw75)})`;
  }

  // 3. Cantidad de cuotas según antigüedad
  let baseQuotasCount = 0;
  if (tenureMonths >= 36) baseQuotasCount = 12;
  else if (tenureMonths >= 24) baseQuotasCount = 8;
  else if (tenureMonths >= 12) baseQuotasCount = 4;
  else baseQuotasCount = 2;

  const extraQuotasCount = isOver45 ? 6 : 0;
  const totalQuotasCount = baseQuotasCount + extraQuotasCount;

  // 4. Esquema decreciente reglamentario de ANSES:
  // Meses 1 a 4: 100%
  // Meses 5 a 8: 85%
  // Meses 9 a 12: 70%
  // Meses 13 a 18 (Mayores de 45 años): 70%
  const schedule = [];
  let totalAccumulated = 0;

  for (let i = 1; i <= totalQuotasCount; i++) {
    let factor = 1.0;
    let label = "100% inicial";

    if (i <= 4) {
      factor = 1.0;
      label = "100% inicial";
    } else if (i <= 8) {
      factor = 0.85;
      label = "85% reducción";
    } else if (i <= 12) {
      factor = 0.70;
      label = "70% reducción";
    } else {
      factor = 0.70;
      label = "70% prórroga +45 años";
    }

    // Cada cuota no puede estar por debajo del piso legal proporcional
    const quotaVal = Math.round(initialQuota * factor);
    schedule.push({ month: i, factor: label, val: quotaVal });
    totalAccumulated += quotaVal;
  }

  // 5. Update UI elements
  document.getElementById("resFirstQuota").textContent = formatARS(initialQuota);
  document.getElementById("resQuotasCount").textContent = `${totalQuotasCount} cuotas mensuales`;
  document.getElementById("resStatusNote").textContent = statusNote;

  document.getElementById("kpiTotal").textContent = formatARS(totalAccumulated);
  document.getElementById("kpiDuration").textContent = `${totalQuotasCount} meses (${(totalQuotasCount/12).toFixed(1)} años)`;
  document.getElementById("kpiCap").textContent = formatARS(maxCap);

  // Render monthly breakdown
  const schedEl = document.getElementById("scheduleList");
  schedEl.innerHTML = "";
  schedule.forEach(item => {
    const row = document.createElement("div");
    row.className = "schedule-row";
    row.innerHTML = `
      <div>
        <span class="month">Cuota ${item.month}</span>
        <span class="pct">(${item.factor})</span>
      </div>
      <span class="val">${formatARS(item.val)}</span>
    `;
    schedEl.appendChild(row);
  });
}

function applyPreset(netVal) {
  document.getElementById("netSalaryInput").value = netVal;
  calculate();
}

function copyResult() {
  const sal = document.getElementById("netSalaryInput").value;
  const q1 = document.getElementById("resFirstQuota").textContent;
  const count = document.getElementById("resQuotasCount").textContent;
  const tot = document.getElementById("kpiTotal").textContent;

  const txt = `🛡️ Fondo de Desempleo ANSES (Ley 24.013):\nSueldo neto previo: $${Number(sal).toLocaleString('es-AR')}\nPrimera cuota mensual: ${q1}\nDuración: ${count}\nTotal acumulado estimado: ${tot}\nCalculá tu prestación en: https://sebiglesias.com.ar/fondo-desempleo/`;

  navigator.clipboard.writeText(txt).then(() => {
    const btn = document.getElementById("btnCopy");
    const orig = btn.textContent;
    btn.textContent = "✅ ¡Copiado al portapapeles!";
    setTimeout(() => { btn.textContent = orig; }, 2000);
  });
}

function shareWa() {
  const sal = document.getElementById("netSalaryInput").value;
  const q1 = document.getElementById("resFirstQuota").textContent;
  const count = document.getElementById("resQuotasCount").textContent;
  const tot = document.getElementById("kpiTotal").textContent;

  const txt = `🛡️ Fondo de Desempleo ANSES:\nSueldo neto: $${Number(sal).toLocaleString('es-AR')} ➔ 1ra cuota: ${q1} (${count}). Total: ${tot}\nhttps://sebiglesias.com.ar/fondo-desempleo/`;
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(txt)}`, '_blank');
}

document.addEventListener("DOMContentLoaded", () => {
  calculate();

  document.getElementById("netSalaryInput").addEventListener("input", calculate);
  document.getElementById("antiguedadSelect").addEventListener("change", calculate);
  document.getElementById("smvmInput").addEventListener("input", calculate);
  document.getElementById("edad45Check").addEventListener("change", calculate);

  document.getElementById("btnCopy").addEventListener("click", copyResult);
  document.getElementById("btnWa").addEventListener("click", shareWa);
});
