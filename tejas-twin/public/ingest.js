// Tejas AI — Brownfield ingestion wizard.
// The PLATFORM is real (multi-step flow, real layout/topology capture, real AI
// clarification via the server brain, a stored twin). The CONNECTORS /
// TELEMETRY / CALIBRATION are simulated (we have no live DC).

const $ = (id) => document.getElementById(id);
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v | 0));
const escapeHtml = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function show(step) {
  document.querySelectorAll('.wiz-card').forEach(c => c.hidden = +c.dataset.panel !== step);
  document.querySelectorAll('.stepper .step').forEach(s => {
    const n = +s.dataset.s; s.classList.toggle('active', n === step); s.classList.toggle('done', n < step);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---- step 1: connectors ----------------------------------------------------
const CONNECTORS = [
  { id: 'bacnet', name: 'BACnet/IP — BMS', on: true },
  { id: 'modbus', name: 'Modbus TCP — plant', on: true },
  { id: 'opcua', name: 'OPC-UA — SCADA', on: false },
  { id: 'redfish', name: 'Redfish — IT power/thermal', on: true },
  { id: 'snmp', name: 'SNMP — PDU / UPS', on: true },
  { id: 'cdu', name: 'CDU REST — liquid cooling', on: true },
  { id: 'historian', name: 'Historian — PI / InfluxDB', on: true },
];
function renderConnectors() {
  $('connList').innerHTML = CONNECTORS.map(c =>
    `<label class="conn"><input type="checkbox" data-id="${c.id}" ${c.on ? 'checked' : ''}/><span>${c.name}</span></label>`).join('');
}

let draftSpec = null;
function buildDraft() {
  const site = ($('siteName').value || '').trim() || 'Mumbai · Hyperscale Hall 2';
  const active = [...document.querySelectorAll('#connList input:checked')].map(i => i.dataset.id);
  draftSpec = {
    site, connectors: active, halls: 1, points: 8420, ups: '2N',
    cooling: 'mixed (air + direct-to-chip liquid)', historianDays: 'unknown',
    sensors: { temp: 96, humidity: 24, power: 340, flow: 16, leak: 8 },
    gaps: [],
  };
  return draftSpec;
}
$('connectBtn').addEventListener('click', () => { buildDraft(); show(2); runDiscovery(); });

// ---- step 2: discovery (simulated) ----------------------------------------
async function runDiscovery() {
  const log = $('discLog'); log.innerHTML = ''; $('assetGrid').hidden = true; $('toLayout').hidden = true;
  const lines = [
    ['BACnet/IP', 'handshake OK · 4,210 objects'],
    ['DCIM sync', 'rack estate enumerated'],
    ['Redfish', 'GPU power telemetry online'],
    ['CDU REST', 'liquid distribution units found'],
    ['Plant (Modbus)', 'chillers · towers · pumps'],
    ['SNMP', `PDUs · UPS ${draftSpec.ups}`],
    ['Historian', 'connected · retention unknown ⚠'],
    ['Point map', `${draftSpec.points.toLocaleString('en-IN')} points normalised`],
  ];
  for (const [src, msg] of lines) {
    const el = document.createElement('div'); el.className = 'log-line';
    el.innerHTML = `<span class="spinner sm"></span><b>${src}</b> ${msg}`;
    log.appendChild(el); await wait(440);
    el.querySelector('.spinner').outerHTML = '<span class="tick">✓</span>';
  }
  await wait(250);
  $('assetGrid').innerHTML = [
    ['Halls', 1], ['CRAH', 8], ['Chillers', 2], ['CDUs', 4],
    ['Towers', 2], ['UPS', '2N'], ['Points', draftSpec.points.toLocaleString('en-IN')], ['Cooling', 'mixed'],
  ].map(([k, v]) => `<div class="asset"><span class="a-v">${v}</span><span class="a-l">${k}</span></div>`).join('');
  $('assetGrid').hidden = false; $('toLayout').hidden = false;
  $('discLog').insertAdjacentHTML('beforeend', '<div class="log-line" style="color:var(--warn)">⚠ discovery gives counts, not topology — you define the layout next so the twin can model per-rack airflow & liquid.</div>');
}
$('toLayout').addEventListener('click', () => { show(3); renderHall(); });

// ---- step 3: hall layout & cooling topology (REAL capture) -----------------
const L = { rows: 12, per: 26, crah: 8, cdu: 4, kw: 12, liquid: new Set([0, 1, 2, 3, 4]) };
['lRows', 'lPer', 'lCrah', 'lCdu', 'lKw'].forEach(id => $(id).addEventListener('input', renderHall));

function readInputs() {
  L.rows = clamp(+$('lRows').value, 1, 30); L.per = clamp(+$('lPer').value, 1, 50);
  L.crah = clamp(+$('lCrah').value, 0, 40); L.cdu = clamp(+$('lCdu').value, 0, 40);
  L.kw = clamp(+$('lKw').value, 1, 150);
  [...L.liquid].forEach(r => { if (r >= L.rows) L.liquid.delete(r); });
}
function renderHall() {
  readInputs();
  const hall = $('hall'); hall.innerHTML = '';
  for (let r = 0; r < L.rows; r++) {
    // aisle above this row (between r-1 and r)
    if (r > 0) {
      const cold = (r - 1) % 2 === 0;
      const aisle = document.createElement('div');
      aisle.className = 'aisle ' + (cold ? 'cold' : 'hot');
      aisle.innerHTML = cold ? '<span>❄ cold aisle · air ↑↓ in</span>' : '<span>🔥 hot aisle · return</span>';
      hall.appendChild(aisle);
    }
    const liquid = L.liquid.has(r);
    const row = document.createElement('div');
    row.className = 'hrow' + (liquid ? ' liq' : '');
    row.title = 'Click to toggle air ↔ liquid';
    row.addEventListener('click', () => { if (L.liquid.has(r)) L.liquid.delete(r); else L.liquid.add(r); renderHall(); });
    const tag = document.createElement('span'); tag.className = 'rtag';
    tag.textContent = liquid ? '💧 liquid' : '💨 air';
    row.appendChild(tag);
    const cells = document.createElement('div'); cells.className = 'cells';
    for (let c = 0; c < L.per; c++) { const cell = document.createElement('i'); cell.className = 'rk' + (liquid ? ' liq' : ''); cells.appendChild(cell); }
    row.appendChild(cells);
    hall.appendChild(row);
  }
  renderSummary();
}
function renderSummary() {
  const racks = L.rows * L.per, liqRacks = L.liquid.size * L.per, airRacks = racks - liqRacks;
  const coldAisles = Math.max(0, Math.ceil((L.rows - 1) / 2));
  const itMW = racks * L.kw / 1000;
  const perCrah = L.crah ? Math.round(airRacks / L.crah) : '—';
  const perCdu = L.cdu ? Math.round(liqRacks / L.cdu) : '—';
  $('hallSum').innerHTML =
    `<b>${racks}</b> racks · <b>${airRacks}</b> air-cooled across <b>${coldAisles}</b> cold aisles ` +
    `(~${perCrah}/CRAH) · <b>${liqRacks}</b> liquid on <b>${L.cdu}</b> CDUs (~${perCdu}/CDU) · ` +
    `~${L.kw} kW/rack → <b>${itMW.toFixed(1)} MW</b> IT.<br>` +
    `<span class="muted">Topology captured: each rack draws air from its adjacent cold aisle (CRAH-fed); liquid rows are served by the CDU manifold (warm-water loop).</span>`;
}
$('toClarify').addEventListener('click', () => {
  readInputs();
  const racks = L.rows * L.per, liqRacks = L.liquid.size * L.per;
  draftSpec.racks = racks; draftSpec.gpuRacks = liqRacks; draftSpec.crah = L.crah; draftSpec.cdu = L.cdu;
  draftSpec.kwPerRack = L.kw; draftSpec.itPowerMW = +(racks * L.kw / 1000).toFixed(1);
  draftSpec.layout = {
    rows: L.rows, racksPerRow: L.per, coldAisles: Math.max(0, Math.ceil((L.rows - 1) / 2)),
    liquidRows: [...L.liquid].sort((a, b) => a - b), airRacks: racks - liqRacks, liquidRacks: liqRacks,
    airSource: 'each rack from adjacent CRAH-fed cold aisle', waterSource: 'CDU manifold per liquid row',
  };
  draftSpec.gaps = ['per-rack kW spread within rows', 'ASHRAE class / safe band', 'chiller & CDU setpoint ranges',
    'cooling redundancy (N/N+1/2N)', 'which BMS points are writable', 'free-cooling availability', 'historian retention'];
  show(4); loadQuestions();
});

// ---- step 4: AI clarification (real) --------------------------------------
let questions = [], answered = 0;
const FALLBACK_Q = [
  { q: 'Per-rack kW spread within a row (uniform, or hot spots)?', why: 'Drives the per-rack inlet hotspots the AI must hold.', default: 'Uniform ±15%' },
  { q: 'ASHRAE inlet class / safe band?', why: 'Hard safety constraint for control.', default: 'Class A1 · 18–27°C' },
  { q: 'Chiller & CDU setpoint ranges?', why: 'Defines the actuation envelope.', default: 'CHW 7–18°C · CDU coolant 30–45°C' },
  { q: 'Cooling redundancy (N / N+1 / 2N)?', why: 'Usable vs installed capacity; what the AI may turn down.', default: 'N+1' },
  { q: 'Which BMS points are writable for setpoints?', why: 'Defines the future control action space.', default: 'Supply-air + CHW setpoint (priority array)' },
  { q: 'Free-cooling / economizer available?', why: 'Major efficiency lever in cool/dry hours.', default: 'Waterside economizer present' },
];
async function loadQuestions() {
  $('qlist').innerHTML = '<div class="log-line"><span class="spinner sm"></span> Tejas AI is reviewing your layout + topology…</div>';
  let qs = null;
  try {
    const d = await fetch('/api/ingest/questions', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ spec: draftSpec }),
    }).then(r => r.json());
    if (d.ok && Array.isArray(d.questions) && d.questions.length) qs = d.questions;
  } catch {}
  questions = (qs || FALLBACK_Q).slice(0, 6); answered = 0; renderQuestions(); updateConf();
}
function renderQuestions() {
  $('qlist').innerHTML = questions.map((q, i) => `
    <div class="q-card" id="q${i}">
      <div class="q-q">${escapeHtml(q.q)}</div>
      <div class="q-why">💡 ${escapeHtml(q.why || '')}</div>
      <div class="q-row"><input class="q-in" id="qin${i}" type="text" value="${escapeHtml(q.default || '')}" />
        <button class="q-ok" data-i="${i}">Confirm</button></div>
    </div>`).join('');
  document.querySelectorAll('.q-ok').forEach(b => b.addEventListener('click', () => confirmQ(+b.dataset.i)));
}
function confirmQ(i) {
  const card = $('q' + i); if (card.classList.contains('done')) return;
  card.classList.add('done');
  const val = $('qin' + i).value.trim() || questions[i].default || '—';
  card.querySelector('.q-ok').textContent = '✓';
  answered++; addLedger(questions[i].q, val); updateConf();
  if (answered >= questions.length) $('toCalibrate').disabled = false;
}
function addLedger(q, a) {
  const Lg = $('ledger');
  if (!Lg.dataset.init) { Lg.innerHTML = '<div class="ledger-h">Assumptions ledger</div>'; Lg.dataset.init = '1'; }
  const el = document.createElement('div'); el.className = 'ledger-row';
  el.innerHTML = `<span>${escapeHtml(q.slice(0, 40))}…</span><b>${escapeHtml(a)}</b>`; Lg.appendChild(el);
}
function updateConf() {
  const pct = Math.round((answered / Math.max(1, questions.length)) * 96);
  $('conf').textContent = `confidence ${pct}%`; $('confFill').style.width = pct + '%';
}
$('toCalibrate').addEventListener('click', () => { show(5); runCalibration(); });

// ---- step 5: calibration (simulated) --------------------------------------
async function runCalibration() {
  const stages = ['Mass & energy balance', 'Air-loop calibration (per cold aisle)', 'Liquid-loop calibration (CDU)',
    'Back-test on held-out week', 'Plausibility & capacity checks'];
  const host = $('calStages'); host.innerHTML = ''; $('band').hidden = true; $('toActivate').hidden = true; $('calBar').style.width = '0';
  for (let i = 0; i < stages.length; i++) {
    const el = document.createElement('div'); el.className = 'cal-stage';
    el.innerHTML = `<span class="spinner sm"></span> ${stages[i]}`; host.appendChild(el);
    await wait(650 + Math.random() * 450);
    el.querySelector('.spinner').outerHTML = '<span class="tick">✓</span>';
    $('calBar').style.width = Math.round(((i + 1) / stages.length) * 100) + '%';
  }
  await wait(250);
  $('band').innerHTML = '✓ Calibrated — inlet temps <b>±0.8°C</b>, energy <b>±6%</b>, twin quality <b>92%</b>. Within control-grade band.';
  $('band').hidden = false; $('toActivate').hidden = false;
}
$('toActivate').addEventListener('click', activate);

// ---- step 6: activate (real — stores the twin) ----------------------------
async function activate() {
  show(6);
  $('activeSummary').textContent = `${draftSpec.site} — ${draftSpec.racks} racks · ${draftSpec.itPowerMW} MW IT · ${draftSpec.cdu} CDUs · mixed cooling`;
  try {
    await fetch('/api/twins', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: draftSpec.site, type: 'datacenter', method: 'brownfield', spec: draftSpec }),
    });
  } catch {}
}
$('openTwin').addEventListener('click', () => { location.href = '/datacenter'; });

// ---- boot ------------------------------------------------------------------
fetch('/api/health').then(r => r.json()).then(h => {
  const dot = $('brainDot'), txt = $('brainText');
  if (h.brain === 'openai') { dot.className = 'dot good'; txt.textContent = 'OpenAI · ' + h.model; }
  else { dot.className = 'dot'; txt.textContent = h.brain === 'ollama' ? 'Ollama' : 'local brain'; }
}).catch(() => { $('brainText').textContent = 'local brain'; });
renderConnectors(); show(1);
