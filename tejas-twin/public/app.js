// Tejas AI — application orchestrator.
// Runs the live twin physics, drives the 3D scene + HUD, and wires the
// context-aware chat / voice console to the digital twin.

import { Twin } from './sim.js';
import { Twin3D } from './twin3d.js';
import { Spark } from './charts.js';
import { askBrain } from './genui.js';
import { Tour } from './tour.js';
import * as comp from './components.js';
import { STATUS, statusColor, statusLabel } from './status.js';
import { RackDesign } from './rackdesign.js';
import * as schematic from './schematic.js';

const $ = (id) => document.getElementById(id);
const fmtINR = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
const fmtShort = (n) => {
  if (n >= 1e7) return '₹' + (n / 1e7).toFixed(2) + ' Cr';
  if (n >= 1e5) return '₹' + (n / 1e5).toFixed(1) + ' L';
  if (n >= 1e3) return '₹' + (n / 1e3).toFixed(1) + 'k';
  return '₹' + Math.round(n);
};
// inlet temp -> css colour (mirrors the 3D ramp)
function rampCss(t) {
  const stops = [[15, [30, 107, 255]], [20, [25, 198, 255]], [23, [46, 230, 166]],
    [26, [255, 211, 77]], [29, [255, 122, 51]], [34, [255, 51, 68]]];
  if (t <= stops[0][0]) return rgb(stops[0][1]);
  if (t >= stops[stops.length - 1][0]) return rgb(stops[stops.length - 1][1]);
  for (let i = 0; i < stops.length - 1; i++) {
    const [ta, ca] = stops[i], [tb, cb] = stops[i + 1];
    if (t >= ta && t <= tb) { const k = (t - ta) / (tb - ta); return rgb(ca.map((c, j) => c + (cb[j] - c) * k)); }
  }
  return rgb(stops[stops.length - 1][1]);
}
const rgb = (a) => `rgb(${a[0] | 0},${a[1] | 0},${a[2] | 0})`;

// NVIDIA accelerator platforms in this hall (by rack id) — shown in the
// inspector and the electrical single-line.
const NVIDIA = ['GB200 NVL72', 'HGX B200', 'HGX H200', 'DGX H100', 'HGX H100'];
const gpuModel = (id) => 'NVIDIA ' + NVIDIA[id % NVIDIA.length];

// ---------- core objects ----------------------------------------------------
const twin = new Twin();
const scene = new Twin3D($('twinCanvas'), { onPick: onPickRack });
scene.setRacks(twin.layout, twin.rows, twin.perRow);

const powerSpark = new Spark($('powerSpark'));
const pueSpark = new Spark($('pueSpark'));

let fleet = 10;
let lastSummary = null;

// ---------- component registry (inspect & fix) ------------------------------
const TWIN_ID = 'datacenter-A';

// Build one inspectable Component per rack. Only GPU-16 ships faulted, so the
// red→blue correction works out of the box (matches the seeded sim fault).
function buildComponent(r) {
  const gpu = r.isGpu;
  const model = gpu ? gpuModel(r.id) : 'Standard 42U rack';
  // aspect lenses this unit exposes — data-driven, NOT hard-coded to "circuit"
  const aspects = [
    { key: 'electrical', label: 'Electrical',       icon: '🔌', schematic: 'rack-power', view: 'both' },
    { key: 'cooling',    label: 'Cooling / Airflow', icon: '❄️', schematic: 'rack-air',  view: 'both' },
    { key: 'mechanical', label: 'Internals',        icon: '🧩', view: '3d' },
    { key: 'controls',   label: 'Controls / BMS',   icon: '🎛️', schematic: 'rack-ctl',  view: 'svg' },
  ];
  const parts = [
    { id: 'fan-tray',   label: 'Rear fan tray',           aspect: 'cooling' },
    { id: 'filter',     label: 'CRAC-2 intake filter (MERV-13)', aspect: 'cooling' },
    { id: 'gpu-tray-1', label: gpu ? 'GPU tray A' : 'Compute tray A', aspect: 'mechanical' },
    { id: 'psu',        label: 'PSU 3 kW ×6',             aspect: 'electrical' },
    { id: 'busbar',     label: '48V busbar',              aspect: 'electrical' },
  ];
  const faults = r.faulted ? [
    { partId: 'filter',   issue: 'clogged airflow', fix: 'Swap the CRAC-2 intake filter (MERV-13)', done: false },
    { partId: 'fan-tray', issue: 'bearing wear',    fix: 'Replace the rear fan tray (the ringed part)', done: false },
  ] : [];
  return comp.register({
    id: r.id, twinId: TWIN_ID, type: 'rack', name: r.name,
    status: r.faulted ? STATUS.FAULT : STATUS.HEALTHY,
    corrected: false,
    design: { model, parts, aspects },
    faults,
  });
}
function buildComponents() { comp.clear(); twin.aiRacks.forEach(buildComponent); }
buildComponents();

// keep the simulated physics in step with a unit's lifecycle status:
// correcting GPU-16 actually cools it (fault gone) so the work order clears;
// reverting re-injects the airflow fault for a repeat demo.
function syncPhysics(id) {
  const c = comp.get(id); if (!c) return;
  for (const arr of [twin.aiRacks, twin.baseRacks]) {
    const rk = arr.find(x => x.id === id); if (!rk) continue;
    if (c.status === STATUS.CORRECTED) { rk.faulted = false; rk.faultRise = 0; }
    else if (c.status === STATUS.FAULT) { rk.faulted = true; rk.faultRise = 3.4; }
  }
}

// ---------- live loop -------------------------------------------------------
let prev = performance.now();
let running = true;
function frame(now) {
  if (!running) return;
  const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
  const s = twin.tick(0.02);           // advance physics
  lastSummary = s;

  // feed the 3D scene the controlled hall (aiRacks = current control)
  scene.update({
    env: s.env, ai: s.ai, base: s.base,
    aiRacksData: twin.aiRacks, baseRacksData: twin.baseRacks,
  }, 'ai', dt);

  updateHUD(s);
  requestAnimationFrame(frame);
}

// ---------- HUD -------------------------------------------------------------
let hudThrottle = 0;
function updateHUD(s) {
  // top kpi strip + control readout — throttled DOM writes
  if (++hudThrottle % 4 !== 0) return;

  $('kPueAI').textContent = s.aiPUE.toFixed(2);
  $('kPueBase').textContent = s.basePUE.toFixed(2);
  $('kCool').textContent = (s.coolPctNow >= 0 ? '−' : '+') + Math.abs(s.coolPctNow).toFixed(0) + '%';
  $('kCool').className = 'k-v ' + (s.coolPctNow > 4 ? 'good' : '');
  $('kRupees').textContent = fmtShort(s.rupeesDay) + '/d';
  $('kAmb').textContent = s.env.Tamb.toFixed(0) + '°C';
  const safe = s.safeAI;
  $('kSafe').textContent = safe ? '✓ ASHRAE' : '⚠ near limit';
  $('kSafe').className = 'k-v ' + (safe ? 'good' : 'bad');

  const c = s.aiCtl;
  $('ctlReadout').textContent =
    `Supply ${c.Tsup ? c.Tsup.toFixed(1) : s.ai.Tsup.toFixed(1)}°C · Fans ${(s.ai.fanFrac * 100).toFixed(0)}% · CHW ${s.ai.Tchw.toFixed(1)}°C`;

  // autonomous-control card
  $('autoPolicy').textContent = 'v' + s.policyVersion;
  $('autoSteps').textContent = Math.round(s.controlSteps).toLocaleString('en-IN');
  $('autoConf').textContent = (s.confidence * 100).toFixed(0) + '%';
  $('confFill').style.width = (s.confidence * 100).toFixed(0) + '%';
  $('autoBadge').textContent = s.aiOn ? '● LIVE' : '● PAUSED';
  document.querySelector('.autonomy-card').classList.toggle('off', !s.aiOn);
  $('autoWhy').textContent = s.aiOn
    ? (s.decisions[0] ? s.decisions[0].why : 'Holding every rack in the safe band at least energy.')
    : 'Paused — the baseline controller is running the hall.';

  // deck panels (only update what's visible)
  if (visible('savings')) {
    $('sPct').textContent = s.coolPctNow.toFixed(0) + '%';
    $('sDay').textContent = fmtShort(s.rupeesDay);
    $('sYear').textContent = fmtShort(s.rupeesYear);
    $('sCo2').textContent = s.co2Year.toFixed(1) + 't';
  }
  if (visible('power')) {
    const h = twin.history;
    powerSpark.draw([
      { values: h.map(x => x.baseP), color: '#ff7a59', fill: 'rgba(255,122,89,.10)' },
      { values: h.map(x => x.aiP), color: '#2ee6a6', fill: 'rgba(46,230,166,.12)' },
    ]);
    $('pAI').textContent = s.ai.Ptotal.toFixed(0) + ' kW';
    $('pBase').textContent = s.base.Ptotal.toFixed(0) + ' kW';
    $('pBreak').textContent = `IT ${s.ai.Pit.toFixed(0)} kW · cooling ${s.ai.Pcool.toFixed(0)} kW (chiller ${s.ai.Pchiller.toFixed(0)} · fans ${s.ai.Pfans.toFixed(0)})`;
  }
  if (visible('efficiency')) {
    const h = twin.history;
    pueSpark.draw([
      { values: h.map(x => x.basePUE), color: '#ff7a59', fill: 'rgba(255,122,89,.10)' },
      { values: h.map(x => x.aiPUE), color: '#2ee6a6', fill: 'rgba(46,230,166,.12)' },
    ]);
    $('ePueAI').textContent = s.aiPUE.toFixed(2);
    $('ePueBase').textContent = s.basePUE.toFixed(2);
  }
  if (visible('racks')) renderRackMap();
  if (visible('alerts')) renderAlerts();
  if (visible('autonomy')) renderDecLog(s);
  if (visible('service')) renderWorkOrder();
  if (visible('fleet')) renderFleet(s);
  if (visible('oneline')) renderOneLine(s);
  if (!$('inspector').hidden && inspId != null) refreshInspector();
}

function renderDecLog(s) {
  const box = $('declog');
  box.innerHTML = s.decisions.length ? '' : '<div class="ad">Optimising… decisions will appear as conditions change.</div>';
  for (const d of s.decisions) {
    const el = document.createElement('div');
    el.className = 'dec';
    el.innerHTML = `<div class="dh"><span>step ${d.step.toLocaleString('en-IN')}</span>` +
      `<span>supply ${d.Tsup.toFixed(1)}°C · fans ${(d.fan * 100).toFixed(0)}% · CHW ${d.Tchw.toFixed(1)}°C</span></div>` +
      `<div class="dw">${d.why}</div>`;
    box.appendChild(el);
  }
}

function renderWorkOrder() {
  const w = twin.workOrder();
  const box = $('wo');
  if (!w) { box.innerHTML = '<div class="ad">No machines flagged for service — all healthy.</div>'; return; }
  const e = w.email;
  box.innerHTML =
    `<div class="wo-head"><span class="wo-rack">${w.rack}</span><span class="wo-age">degrading ${w.degradingMonths} months</span></div>` +
    `<div class="wo-line"><b>Root cause:</b> ${w.rootCause}</div>` +
    `<div class="wo-line"><b>Impact:</b> ~${w.wasteKw} kW wasted · ≈ ₹${w.wasteYearRs.toLocaleString('en-IN')}/yr</div>` +
    `<div class="wo-line"><b>Fix (~25 min):</b> ${w.action}</div>` +
    `<div class="email"><span class="eh">To:</span> ${e.to}\n<span class="eh">Subject:</span> ${e.subject}\n\n${e.body}</div>` +
    `<div class="wo-cta">✓ Draft email ready — technician arrives knowing the exact rack, parts &amp; fix.</div>`;
}

const visible = (p) => !document.querySelector(`.d-card[data-panel="${p}"]`).hidden;

// ---------- rack map + alerts + fleet --------------------------------------
function renderRackMap() {
  const map = $('rackmap');
  if (!map._built) {
    twin.aiRacks.forEach((r) => {
      const cell = document.createElement('div');
      cell.className = 'rk' + (r.faulted ? ' fault' : '');
      cell.textContent = r.name.replace('GPU-', 'G').replace('R-', '');
      cell.title = r.name;
      cell.addEventListener('click', () => { scene.focusRack(r.id); openInspector(r.id); });
      map.appendChild(cell); r._cell = cell;
      const c = comp.get(r.id); if (c) c._cellEl = cell;
    });
    map._built = true;
  }
  twin.aiRacks.forEach((r) => {
    const c = comp.get(r.id);
    const corrected = c && c.status === STATUS.CORRECTED;
    r._cell.classList.toggle('corrected', !!corrected);
    r._cell.classList.toggle('fault', !!(c && c.status === STATUS.FAULT));
    r._cell.style.background = corrected ? statusColor(STATUS.CORRECTED) : rampCss(r.inlet);
  });
}

function renderAlerts() {
  const box = $('alerts');
  const items = twin.alerts();
  box.innerHTML = items.length ? '' : '<div class="ad">All clear — cooling optimal, no service flags.</div>';
  for (const a of items) {
    const el = document.createElement('div');
    el.className = 'alert ' + a.level;
    el.innerHTML = `<div class="at">${a.title}</div><div class="ad">${a.detail}</div>`;
    if (a.id != null) el.style.cursor = 'pointer', el.addEventListener('click', () => { scene.focusRack(a.id); openInspector(a.id); });
    box.appendChild(el);
  }
}

function renderFleet(s) {
  $('fleetCount').textContent = fleet;
  $('fRupees').textContent = fmtShort(s.rupeesYear * fleet);
  $('fMwh').textContent = (s.savedKw * 24 * 365 * fleet / 1000).toFixed(0) + ' MWh';
  $('fCo2').textContent = (s.co2Year * fleet).toFixed(0) + ' t';
}

// ---------- electrical single-line diagram (live) --------------------------
function renderOneLine(s) {
  const box = $('oneline'); if (!box) return;
  const it = s.ai.Pit, cool = s.ai.Pcool, tot = s.ai.Ptotal;
  const A = (kw) => Math.round(kw * 1000 / (1.732 * 415 * 0.95));   // 3-phase amps @415V
  const Y = 58, H = 40, cy = Y + H / 2;
  const N = [
    { x: 8, w: 92, t: 'GRID 11kV', v: tot.toFixed(0) + ' kW' },
    { x: 116, w: 96, t: 'MAIN TX', v: '11kV/415V' },
    { x: 230, w: 104, t: 'LV SWGR', v: A(tot) + ' A' },
    { x: 354, w: 92, t: 'UPS + BATT', v: 'online' },
    { x: 462, w: 80, t: 'PDU', v: A(it) + ' A' },
    { x: 558, w: 130, t: 'GPU RACKS', v: it.toFixed(0) + ' kW', cls: 'rack' },
  ];
  const sw = N[2], ccx = 498, gx = sw.x + sw.w / 2;
  let svg = '<svg viewBox="0 0 700 200" preserveAspectRatio="xMidYMid meet">';
  for (let i = 0; i < N.length - 1; i++) {
    const a = N[i], b = N[i + 1];
    svg += `<line class="ol-line" x1="${a.x + a.w}" y1="${cy}" x2="${b.x}" y2="${cy}"/>`;
    svg += `<line class="ol-flow" x1="${a.x + a.w}" y1="${cy}" x2="${b.x}" y2="${cy}"/>`;
  }
  // generator branch (standby) below the switchgear
  svg += `<path class="ol-line" d="M${gx} ${Y + H} L${gx} 150"/>`;
  svg += `<path class="ol-flow gen" d="M${gx} 150 L${gx} ${Y + H}"/>`;
  svg += `<g transform="translate(${gx - 58},150)"><rect class="ol-box gen" width="116" height="36" rx="7"/><text class="ol-t" x="58" y="15" text-anchor="middle">GENERATOR N+1</text><text class="ol-v" x="58" y="30" text-anchor="middle">standby</text></g>`;
  // cooling branch (non-UPS) from the switchgear
  svg += `<path class="ol-line" d="M${sw.x + sw.w} ${Y + H} L${sw.x + sw.w} 130 L${ccx} 130 L${ccx} 150"/>`;
  svg += `<path class="ol-flow cool" d="M${sw.x + sw.w} ${Y + H} L${sw.x + sw.w} 130 L${ccx} 130 L${ccx} 150"/>`;
  svg += `<g transform="translate(${ccx - 72},150)"><rect class="ol-box cool" width="144" height="36" rx="7"/><text class="ol-t" x="72" y="15" text-anchor="middle">COOLING / CRAC</text><text class="ol-v" x="72" y="30" text-anchor="middle">${cool.toFixed(0)} kW · ${A(cool)} A</text></g>`;
  // node boxes
  for (const n of N) {
    svg += `<g transform="translate(${n.x},${Y})"><rect class="ol-box ${n.cls || ''}" width="${n.w}" height="${H}" rx="7"/>` +
      `<text class="ol-t" x="${n.w / 2}" y="16" text-anchor="middle">${n.t}</text>` +
      `<text class="ol-v" x="${n.w / 2}" y="32" text-anchor="middle">${n.v}</text></g>`;
  }
  svg += '</svg>';
  box.innerHTML = svg;

  // NVIDIA accelerators + live temperatures
  const hot = twin.hottestRack('ai');
  const fault = twin.aiRacks.find(r => r.faulted);
  const gpuRacks = twin.aiRacks.filter(r => r.isGpu);
  const skus = [...new Set(gpuRacks.slice(0, 4).map(r => gpuModel(r.id)))].join(' · ');
  $('onelineMeta').innerHTML =
    `<div>Accelerators: <b>${skus}</b> · ${gpuRacks.length} GPU racks</div>` +
    `<div>Hottest inlet <span class="hot">${hot.name} ${hot.inlet.toFixed(1)}°C</span> · IT <b>${it.toFixed(0)} kW</b> · cooling <b>${cool.toFixed(0)} kW</b> · total <b>${tot.toFixed(0)} kW</b> · PUE <b>${s.aiPUE.toFixed(2)}</b></div>` +
    (fault ? `<div class="hot">⚠ ${fault.name} flagged — restricted airflow; service drafted.</div>` : '');
}

// ---------- inspector -------------------------------------------------------
let inspId = null;
function onPickRack(rack, xy) {
  if (!rack) { closeCtxMenu(); return; }
  // a click in the 3D twin opens the context menu (Overview · lenses · Correct)
  openCtxMenu(rack.id, xy);
}
function openInspector(id) { closeCtxMenu(); inspId = id; $('inspector').hidden = false; refreshInspector(); }
function refreshInspector() {
  const r = twin.aiRacks.find(x => x.id === inspId);
  if (!r) return;
  $('inspName').textContent = r.name + (r.isGpu ? ' · ' + gpuModel(r.id) : '');
  $('inspInlet').textContent = r.inlet.toFixed(1) + '°C';
  $('inspInlet').style.color = rampCss(r.inlet);
  $('inspLoad').textContent = r.load.toFixed(1) + ' kW';
  // a few live "sensors" (modelled from the twin state)
  const fan = (lastSummary ? lastSummary.ai.fanFrac : 0.6);
  $('inspAir').textContent = Math.round(fan * (r.isGpu ? 920 : 520) * (r.faulted ? 0.55 : 1)) + ' CFM';
  $('inspAir').style.color = r.faulted ? 'var(--bad)' : '';
  $('inspHum').textContent = (44 + (r.inlet - 22) * 0.6).toFixed(0) + ' %RH';
  const vib = r.faulted ? 4.9 : (1.0 + r.load * 0.04);
  $('inspVib').textContent = vib.toFixed(1) + ' mm/s';
  $('inspVib').style.color = vib > 4.5 ? 'var(--bad)' : '';
  const c = comp.get(inspId);
  const over = r.inlet > 27;
  if (c && c.status === STATUS.CORRECTED) {
    $('inspStatus').textContent = 'Corrected'; $('inspStatus').style.color = statusColor(STATUS.CORRECTED);
  } else if (c && c.status === STATUS.FIXING) {
    $('inspStatus').textContent = 'Correcting'; $('inspStatus').style.color = statusColor(STATUS.FIXING);
  } else {
    $('inspStatus').textContent = r.faulted ? 'Service' : over ? 'Hot' : 'Healthy';
    $('inspStatus').style.color = r.faulted || over ? 'var(--bad)' : 'var(--ai)';
  }
  $('inspMsg').textContent = (c && c.status === STATUS.CORRECTED)
    ? '✓ Corrected by operator — airflow restored, running in the safe band.'
    : r.faulted
      ? `⚠ Running ~${r.faultRise.toFixed(1)}°C above what its load predicts — likely restricted airflow (clogged filter / failing fan). Tejas recommends service.`
      : over ? 'Inlet above ASHRAE recommended — AI is compensating.' : '';
  // the fix button reflects whether there's anything to correct / revert
  const ob = $('inspOpen');
  ob.textContent = (c && c.status === STATUS.CORRECTED) ? '🔍 Re-inspect (blue) →'
    : comp.hasFaults(inspId) ? '🔍 Inspect & fix →' : '🔍 Inspect design →';
}
$('inspClose').addEventListener('click', () => { $('inspector').hidden = true; inspId = null; scene.clearSelection(); });
$('inspOpen').addEventListener('click', () => { if (inspId != null) openDetail(inspId); });

// ===========================================================================
// CONTEXT MENU  →  click a unit, pick a lens (Overview · aspects · Everything ·
// Move & Correct). Aspect buttons are generated from the component, never
// hard-coded to "circuit".
// ===========================================================================
function openCtxMenu(id, xy) {
  const c = comp.get(id); if (!c) return;
  scene.select(id);
  const menu = $('ctxMenu'), items = $('ctxItems');
  $('ctxHead').innerHTML = `${c.name} <span class="ctx-badge" style="color:${statusColor(c.status)}">● ${statusLabel(c.status)}</span>`;
  items.innerHTML = '';
  const add = (label, fn, cls = '') => {
    const b = document.createElement('button');
    b.className = 'ctx-item ' + cls; b.innerHTML = label;
    b.onclick = () => { closeCtxMenu(); fn(); };
    items.appendChild(b);
  };
  add('◦ Overview', () => openInspector(id));
  for (const a of c.design.aspects) add(`${a.icon} ${a.label}`, () => openDetail(id, { lens: a.key }));
  add('▦ Everything', () => openDetail(id, { lens: 'everything' }));
  const fixable = comp.hasFaults(id);
  if (c.status === STATUS.CORRECTED) add('↺ Revert to fault', () => openDetail(id, { edit: true }), 'warn');
  else if (fixable) add('🛠 Move &amp; Correct', () => openDetail(id, { edit: true }), 'fix');

  // position near the click; clamp into the viewport
  menu.hidden = false;
  const mw = menu.offsetWidth, mh = menu.offsetHeight;
  let x = xy ? xy.x + 12 : innerWidth / 2 - mw / 2;
  let y = xy ? xy.y + 12 : innerHeight / 2 - mh / 2;
  x = Math.max(8, Math.min(innerWidth - mw - 8, x));
  y = Math.max(70, Math.min(innerHeight - mh - 8, y));
  menu.style.left = x + 'px'; menu.style.top = y + 'px';
}
function closeCtxMenu() { $('ctxMenu').hidden = true; }
document.addEventListener('pointerdown', (e) => {
  if (!$('ctxMenu').hidden && !e.target.closest('#ctxMenu') && !e.target.closest('#twinCanvas canvas'))
    closeCtxMenu();
});

// ===========================================================================
// DETAIL SCREEN — the "proper design" of the unit, with aspect lenses, the
// exploded 3D model, the circuit schematic, the fix checklist, and a clear
// Back button. Always reachable, even on a blue (corrected) unit.
// ===========================================================================
let detailId = null;
let detailLens = 'overview';
let detailEdit = false;
let rackView = null;          // active RackDesign mini-viewer (disposed on leave)
let aspect3dToggle = {};      // per-aspect 3D/2D toggle state

function openDetail(id, { lens, edit = false } = {}) {
  const c = comp.get(id); if (!c) return;
  closeCtxMenu();
  $('inspector').hidden = true;
  detailId = id; detailEdit = edit; aspect3dToggle = {};
  scene.select(id);
  detailLens = lens || (edit ? 'mechanical' : 'overview');
  $('detail').hidden = false;
  resetDetailChat();
  renderDetail();
}
function closeDetail() {
  disposeRackView();
  detailId = null; detailEdit = false;
  $('detail').hidden = true;
}
function disposeRackView() { if (rackView) { rackView.dispose(); rackView = null; } }

function renderDetail() {
  const c = comp.get(detailId); if (!c) return;
  $('detailName').textContent = c.name;
  $('detailModel').textContent = c.design.model;
  const badge = $('detailStatus');
  badge.textContent = statusLabel(c.status);
  badge.style.color = statusColor(c.status);
  badge.style.borderColor = statusColor(c.status);

  // correct / revert button
  const cb = $('detailCorrect');
  if (c.status === STATUS.CORRECTED) {
    cb.textContent = '↺ Revert to fault'; cb.className = 'detail-correct warn'; cb.hidden = false;
  } else if (comp.hasFaults(detailId)) {
    cb.textContent = detailEdit ? '🛠 In correction mode' : '🛠 Move & Correct';
    cb.className = 'detail-correct fix'; cb.hidden = false; cb.disabled = false;
  } else {
    cb.hidden = true;
  }

  // tab rail: Overview · (one per aspect) · Everything
  const tabs = $('detailTabs'); tabs.innerHTML = '';
  const mkTab = (key, label) => {
    const b = document.createElement('button');
    b.className = 'detail-tab' + (detailLens === key ? ' active' : '');
    b.innerHTML = label;
    b.onclick = () => { detailLens = key; detailEdit = (key === 'mechanical') && detailEdit; renderDetail(); };
    tabs.appendChild(b);
  };
  mkTab('overview', '◦ Overview');
  for (const a of c.design.aspects) mkTab(a.key, `${a.icon} ${a.label}`);
  mkTab('everything', '▦ Everything');

  // main content + side panel
  disposeRackView();
  $('detailMain').innerHTML = '';
  renderLens(c);
  renderSide(c);
}

function renderLens(c) {
  const main = $('detailMain');
  if (detailLens === 'overview') { main.appendChild(overviewEl(c)); return; }
  if (detailLens === 'everything') {
    // one exploded 3D model only (the Internals lens); every other aspect
    // renders as a schematic — avoids spawning many WebGL contexts.
    main.appendChild(overviewEl(c));
    for (const a of c.design.aspects) main.appendChild(aspectEl(c, a, { compact: true }));
    main.appendChild(everythingExtrasEl(c));
    return;
  }
  const a = c.design.aspects.find(x => x.key === detailLens);
  if (a) main.appendChild(aspectEl(c, a, { compact: false }));
}

// --- Overview lens: live telemetry (mirrors the quick inspector) -----------
function overviewEl(c) {
  const r = twin.aiRacks.find(x => x.id === c.id) || {};
  const fan = lastSummary ? lastSummary.ai.fanFrac : 0.6;
  const air = Math.round(fan * (r.isGpu ? 920 : 520) * (r.faulted ? 0.55 : 1));
  const vib = r.faulted ? 4.9 : (1.0 + (r.load || 0) * 0.04);
  const wrap = document.createElement('div');
  wrap.className = 'lens lens-overview';
  wrap.innerHTML = `<div class="lens-title">Overview · live telemetry</div>
    <div class="ov-grid">
      ${ovCell('Inlet temp', (r.inlet ?? 0).toFixed(1) + '°C', rampCss(r.inlet || 22))}
      ${ovCell('IT load', (r.load ?? 0).toFixed(1) + ' kW')}
      ${ovCell('Airflow', air + ' CFM', r.faulted ? 'var(--bad)' : '')}
      ${ovCell('Humidity', (44 + ((r.inlet || 22) - 22) * 0.6).toFixed(0) + ' %RH')}
      ${ovCell('Vibration', vib.toFixed(1) + ' mm/s', vib > 4.5 ? 'var(--bad)' : '')}
      ${ovCell('Status', statusLabel(c.status), statusColor(c.status))}
    </div>
    ${c.status === STATUS.CORRECTED
      ? '<div class="lens-msg ok">✓ Corrected — airflow restored; running in the ASHRAE safe band.</div>'
      : (c.faults || []).length
        ? `<div class="lens-msg bad">⚠ ${c.faults.length} open fault${c.faults.length > 1 ? 's' : ''} — open <b>Internals</b> or <b>Move &amp; Correct</b> to fix.</div>`
        : '<div class="lens-msg">Nominal — no service flags.</div>'}`;
  return wrap;
}
function ovCell(l, v, color = '') {
  return `<div class="ov-cell"><span class="ov-l">${l}</span><span class="ov-v" style="color:${color || 'var(--ink)'}">${v}</span></div>`;
}

// --- Aspect lens: 3D exploded model and/or SVG schematic -------------------
// In compact (Everything) mode only the Internals aspect renders its 3D model;
// the others fall back to their schematic so we never open many GL contexts.
function aspectEl(c, a, { compact = false } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'lens lens-aspect';
  const allow3d = !compact || a.key === 'mechanical';
  const want3d = (a.view === '3d' || a.view === 'both') && allow3d;
  const wantSvg = (a.view === 'svg' || a.view === 'both') ||
    (compact && !allow3d && a.schematic);            // fall back to schematic when 3D is suppressed
  const showId = aspect3dToggle[a.key] ?? (a.view === 'svg' ? '2d' : '3d');

  const head = document.createElement('div');
  head.className = 'lens-title';
  head.innerHTML = `${a.icon} ${a.label}`;
  if (a.view === 'both' && !compact) {
    const tog = document.createElement('div');
    tog.className = 'lens-toggle';
    tog.innerHTML = `<button class="${showId === '3d' ? 'on' : ''}" data-v="3d">3D</button>` +
      `<button class="${showId === '2d' ? 'on' : ''}" data-v="2d">Circuit</button>`;
    tog.querySelectorAll('button').forEach(b => b.onclick = () => { aspect3dToggle[a.key] = b.dataset.v; renderDetail(); });
    head.appendChild(tog);
  }
  wrap.appendChild(head);

  const show3d = want3d && (a.view !== 'both' || showId === '3d');
  const show2d = wantSvg && !show3d;

  if (show3d) {
    const holder = document.createElement('div');
    holder.className = 'lens-3d';
    wrap.appendChild(holder);
    const editable = detailEdit && comp.hasFaults(c.id);
    // build the mini exploded viewer once it's actually in the DOM (needs size)
    requestAnimationFrame(() => {
      if (!holder.isConnected) return;          // tab changed before paint
      disposeRackView();
      rackView = new RackDesign(holder, c, {
        aspectKey: a.key, editable,
        onFixed: (partId) => onPartFixed(c.id, partId),
      });
    });
    if (editable)
      wrap.insertAdjacentHTML('beforeend',
        '<div class="lens-hint">🛠 Drag the <b>red</b> part into the glowing blue slot to correct it.</div>');
  }
  if (show2d) {
    const svg = document.createElement('div');
    svg.className = 'lens-svg';
    svg.innerHTML = schematic.draw(c, a.schematic, a.label);
    wrap.appendChild(svg);
  }
  return wrap;
}

function everythingExtrasEl(c) {
  const wrap = document.createElement('div');
  wrap.className = 'lens lens-extras';
  const w = twin.workOrder();
  const woClosed = c.status === STATUS.CORRECTED || !comp.hasFaults(c.id);
  wrap.innerHTML = `<div class="lens-title">Service work order</div>` +
    (w && !woClosed
      ? `<div class="ex-wo"><b>${w.rack}</b> — ${w.rootCause}<br>Fix (~25 min): ${w.action}</div>`
      : `<div class="ex-wo ok">✓ No open work order — unit healthy / corrected.</div>`) +
    `<div class="lens-title" style="margin-top:14px">AI explanation</div>` +
    `<div class="ex-ai" id="exAI"><button class="ex-ask" id="exAsk">Ask Tejas to explain this unit ↗</button></div>`;
  // wire the AI explain button after insertion
  requestAnimationFrame(() => {
    const btn = document.getElementById('exAsk');
    if (btn) btn.onclick = async () => {
      const box = document.getElementById('exAI');
      box.innerHTML = '<span class="ex-think">Tejas is analysing…</span>';
      try {
        const q = `Explain ${c.name}'s status and the exact correction in two sentences.`;
        const { reply } = await askBrain(q, ctxForBrain(lastSummary));
        box.textContent = reply || 'Restricted airflow from a clogged filter and worn fan tray; replace both to restore the safe band.';
      } catch {
        box.textContent = 'Restricted airflow from a clogged filter and worn fan tray; replace both to restore the safe band.';
      }
    };
  });
  return wrap;
}

// --- Side panel: the fix checklist (faults[] as tickable steps) ------------
function renderSide(c) {
  const side = $('detailSide');
  if (!comp.hasFaults(c.id) && c.status !== STATUS.CORRECTED) {
    side.innerHTML = `<div class="side-title">Health</div>
      <div class="side-ok">✓ No faults on record.<br>This unit is running nominally.</div>`;
    return;
  }
  const done = (c.faults || []).filter(f => f.done).length;
  const total = (c.faults || []).length;
  let html = `<div class="side-title">Correction checklist <span class="side-prog">${done}/${total}</span></div>`;
  html += '<div class="side-list">';
  for (const f of c.faults || []) {
    html += `<label class="fix-item ${f.done ? 'done' : ''}">
      <input type="checkbox" data-part="${f.partId}" ${f.done ? 'checked' : ''} ${detailEdit ? '' : 'disabled'}/>
      <span class="fix-text"><b>${f.fix}</b><i>${f.issue}</i></span></label>`;
  }
  html += '</div>';
  if (c.status === STATUS.CORRECTED) {
    html += '<div class="side-corrected">✓ Corrected — unit is blue and persisted. Click it again any time to re-inspect or revert.</div>';
  } else if (detailEdit) {
    html += '<div class="side-note">Tick a step, or drag the red part into its slot in the 3D Internals view. When all steps are done the unit turns <b style="color:#19c6ff">blue</b>.</div>';
  } else {
    html += '<div class="side-note">Open <b>Move &amp; Correct</b> to action these steps.</div>';
  }
  side.innerHTML = html;
  side.querySelectorAll('input[type=checkbox]').forEach(cb => {
    cb.onchange = () => { if (cb.checked) onPartFixed(c.id, cb.dataset.part); };
  });
}

// a single fault resolved (via 3D drag or checklist) → maybe flips to blue
function onPartFixed(id, partId) {
  const becameCorrected = comp.resolveFault(id, partId);
  if (becameCorrected) toast(`${comp.get(id).name} corrected ✓ — now blue`);
  // onChange handler re-renders the detail screen + scene + work order
}

// detail-screen wiring
$('detailBack').addEventListener('click', closeDetail);
$('detailCorrect').addEventListener('click', () => {
  const c = comp.get(detailId); if (!c) return;
  if (c.status === STATUS.CORRECTED) { comp.revert(detailId); detailEdit = true; detailLens = 'mechanical'; }
  else { detailEdit = true; detailLens = 'mechanical'; }
  renderDetail();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('detail').hidden) closeDetail(); });

// react to ANY component change (local edit OR phone↔desktop sync)
comp.onChange((id) => {
  syncPhysics(id);
  // recolour the rack-map cell immediately
  const c = comp.get(id);
  if (c && c._cellEl) c._cellEl.classList.toggle('corrected', c.status === STATUS.CORRECTED);
  if (detailId === id && !$('detail').hidden) renderDetail();
  if (inspId === id && !$('inspector').hidden) refreshInspector();
});

// lightweight toast for the red→blue moment
let toastT = null;
function toast(msg) {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2600);
}

// keep statuses in sync across devices (phone fix → laptop turns blue)
comp.startSync(TWIN_ID, 5000);

// ---------- chat / actions --------------------------------------------------
function ctxForBrain(s) {
  const hot = twin.hottestRack('ai');
  const fault = twin.aiRacks.find(r => r.faulted);
  return {
    mode: s.aiOn ? 'Tejas AI in control' : 'baseline controller',
    Tamb: s.env.Tamb.toFixed(0), loadPct: (s.env.loadFrac * 100).toFixed(0),
    aiPUE: s.aiPUE.toFixed(2), basePUE: s.basePUE.toFixed(2),
    aiTotal: s.ai.Ptotal.toFixed(0), baseTotal: s.base.Ptotal.toFixed(0),
    aiCool: s.ai.Pcool.toFixed(0), baseCool: s.base.Pcool.toFixed(0), coolPct: s.coolPctNow.toFixed(0),
    rupeesDay: Math.round(s.rupeesDay), rupeesYear: Math.round(s.rupeesYear), co2Year: s.co2Year.toFixed(1),
    hottest: hot.name, hottestTemp: hot.inlet.toFixed(1),
    faultRack: fault ? fault.name : null,
    autonomy: `policy v${s.policyVersion}, learned from ${Math.round(s.controlSteps).toLocaleString('en-IN')} steps, confidence ${(s.confidence * 100).toFixed(0)}%`,
    alerts: twin.alerts().map(a => a.title),
  };
}

function addMsg(who, text, cls = '') {
  const el = document.createElement('div');
  el.className = 'msg ' + (who === 'You' ? 'you' : 'ai') + (cls ? ' ' + cls : '');
  el.innerHTML = `<span class="who">${who}</span>${text}`;
  $('chat').appendChild(el);
  $('chat').scrollTop = $('chat').scrollHeight;
  return el;
}

async function runCommand(text) {
  if (!text) return;
  const aloud = answerAloud; answerAloud = false;   // speak only when the question came by voice
  $('cmdInput').value = '';
  addMsg('You', text);
  const thinking = addMsg('Tejas', '…', 'thinking');
  const { reply, actions, source } = await askBrain(text, chatContext());
  thinking.remove();
  applyActions(actions);
  addMsg(source === 'openai' ? 'Tejas · GPT' : source === 'ollama' ? 'Tejas · local' : 'Tejas', reply || 'Done.');
  if (aloud) speak(reply || 'Done.');
}

function applyActions(actions = []) {
  for (const a of actions) {
    if (a.type === 'setWeather') { twin.setAmbient(a.tempC); $('ambSlider').value = a.tempC; $('ambVal').textContent = a.tempC + '°C'; }
    else if (a.type === 'setLoad') { twin.setLoad(a.pct / 100); $('loadSlider').value = a.pct; $('loadVal').textContent = a.pct + '%'; }
    else if (a.type === 'setMode') { setMode(a.mode); }
    else if (a.type === 'show') { for (const p of a.panels) showPanel(p); }
    else if (a.type === 'focusRack') {
      const r = twin.aiRacks.find(x => x.name.toUpperCase() === String(a.name).toUpperCase());
      if (r) { scene.focusRack(r.id); openInspector(r.id); showPanel('racks'); }
    } else if (a.type === 'setFleet') { fleet = a.count; showPanel('fleet'); }
  }
}

function showPanel(p) {
  const el = document.querySelector(`.d-card[data-panel="${p}"]`);
  if (el) { el.hidden = false; el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; }
}

// ---------- make gen-UI panels closeable (✕) and draggable ------------------
function makeMovable(card, { closeable = true } = {}) {
  if (!card || card.dataset.movable) return;
  card.dataset.movable = '1';
  const handle = card.querySelector('.card-title') || card;
  handle.classList.add('drag-handle');

  if (closeable && !card.querySelector('.panel-x')) {
    card.classList.add('has-x');
    const x = document.createElement('button');
    x.className = 'panel-x'; x.type = 'button'; x.textContent = '✕'; x.title = 'Close panel';
    x.addEventListener('pointerdown', e => e.stopPropagation());
    x.addEventListener('click', e => { e.stopPropagation(); card.hidden = true; });
    card.appendChild(x);
  }

  let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;
  handle.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button, input, a, canvas, select, textarea')) return;
    const r = card.getBoundingClientRect();
    // pin to a fixed position at its current spot, then follow the pointer
    card.style.position = 'fixed'; card.style.margin = '0'; card.style.transform = 'none';
    card.style.left = r.left + 'px'; card.style.top = r.top + 'px';
    card.style.bottom = 'auto'; card.style.width = r.width + 'px'; card.style.height = r.height + 'px';
    card.style.zIndex = 70; card.classList.add('dragging');
    dragging = true; sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top;
    try { handle.setPointerCapture(e.pointerId); } catch {}
    e.preventDefault();
  });
  handle.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    let nx = ox + (e.clientX - sx), ny = oy + (e.clientY - sy);
    nx = Math.max(4, Math.min(innerWidth - card.offsetWidth - 4, nx));
    ny = Math.max(4, Math.min(innerHeight - 44, ny));
    card.style.left = nx + 'px'; card.style.top = ny + 'px';
  });
  const end = (e) => { if (!dragging) return; dragging = false; card.classList.remove('dragging'); try { handle.releasePointerCapture(e.pointerId); } catch {} };
  handle.addEventListener('pointerup', end);
  handle.addEventListener('pointercancel', end);
}

document.querySelectorAll('.d-card').forEach(c => makeMovable(c));     // AI panels: ✕ + drag
makeMovable($('inspector'), { closeable: false });                    // already has its own ✕
document.querySelector('.console') && makeMovable(document.querySelector('.console'), { closeable: false });

function setMode(mode) {            // mode: 'ai' | 'baseline'
  twin.setAI(mode === 'ai');
  $('modeValue').textContent = mode === 'ai' ? 'Tejas AI' : 'Baseline';
  $('modePill').dataset.mode = mode;
  document.querySelectorAll('#modeSwitch button').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
}

// ---------- wiring ----------------------------------------------------------
$('ambSlider').addEventListener('input', e => { twin.setAmbient(+e.target.value); $('ambVal').textContent = e.target.value + '°C'; });
$('loadSlider').addEventListener('input', e => { twin.setLoad(+e.target.value / 100); $('loadVal').textContent = e.target.value + '%'; });
$('sendBtn').addEventListener('click', () => runCommand($('cmdInput').value.trim()));
$('cmdInput').addEventListener('keydown', e => { if (e.key === 'Enter') runCommand($('cmdInput').value.trim()); });
document.querySelectorAll('#modeSwitch button').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));

// suggested questions
const CHIPS = [
  "What's happening right now?",
  'How much electricity are we using?',
  'Is any machine going down?',
  "It's a heat wave — push outside to 47°C",
  'How much are we saving?',
  'Show me the autonomous decisions',
  'Show the electrical single-line diagram',
  'Project savings across 50 sites',
];
CHIPS.forEach(c => { const b = document.createElement('button'); b.textContent = c; b.onclick = () => runCommand(c); $('chips').appendChild(b); });

// brain health
fetch('/api/health').then(r => r.json()).then(h => {
  const dot = $('brainDot'), txt = $('brainText');
  if (h.brain === 'openai') { dot.className = 'dot good'; txt.textContent = 'OpenAI · ' + h.model; }
  else if (h.brain === 'ollama') { dot.className = h.present ? 'dot good' : 'dot bad'; txt.textContent = h.present ? 'Ollama · ' + h.model : 'Ollama (model missing)'; }
  else { dot.className = 'dot'; txt.textContent = 'local brain'; }
}).catch(() => { $('brainText').textContent = 'local brain'; });

// ---------- field-AR QR modal ----------------------------------------------
async function openAR() {
  $('arModal').classList.add('open');
  let base = location.origin;
  try {
    const info = await fetch('/api/info').then(r => r.json());
    const ip = (info.ips || []).find(x => /^(192\.168|10\.|172\.)/.test(x)) || info.ips?.[0];
    if (ip) base = `${location.protocol}//${ip}:${info.port}`;
  } catch {}
  const url = base + '/ar';
  $('qrUrl').textContent = url;
  $('arOpenHere').href = '/ar';
  renderQR($('qrBox'), url);
}
$('arBtn').addEventListener('click', openAR);
$('arClose').addEventListener('click', () => $('arModal').classList.remove('open'));
$('arModal').addEventListener('click', (e) => { if (e.target === $('arModal')) $('arModal').classList.remove('open'); });

// ---------- VR walkthrough QR modal ----------------------------------------
async function lanUrl(path) {
  let base = location.origin;
  try {
    const info = await fetch('/api/info').then(r => r.json());
    const ip = (info.ips || []).find(x => /^(192\.168|10\.|172\.)/.test(x)) || info.ips?.[0];
    if (ip) base = `${location.protocol}//${ip}:${info.port}`;
  } catch {}
  return base + path;
}
async function openVR() {
  $('vrModal').classList.add('open');
  const url = await lanUrl('/vr');
  $('vrQrUrl').textContent = url;
  $('vrOpenHere').href = '/vr';
  renderQR($('vrQrBox'), url);
}
$('vrBtn').addEventListener('click', openVR);
$('vrClose').addEventListener('click', () => $('vrModal').classList.remove('open'));
$('vrModal').addEventListener('click', (e) => { if (e.target === $('vrModal')) $('vrModal').classList.remove('open'); });

// robust QR: data-URL <img> via the vendored generator, with text fallback
function renderQR(box, url) {
  box.innerHTML = '';
  try {
    const qr = window.qrcode(0, 'M'); qr.addData(url); qr.make();
    const img = new Image();
    img.src = qr.createDataURL(6, 2);
    box.appendChild(img);
  } catch {
    box.textContent = url;
  }
}

// ---------- guided voice tour ----------------------------------------------
let currentSpot = null;
function highlight(sel) {
  if (currentSpot) { currentSpot.classList.remove('spot'); currentSpot = null; }
  if (!sel) { $('tourVeil').hidden = true; return; }
  const el = document.querySelector(sel);
  if (!el) { $('tourVeil').hidden = true; return; }
  $('tourVeil').hidden = false;
  el.classList.add('spot'); currentSpot = el;
  try { el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); } catch {}
}

function buildSteps() {
  const s = lastSummary || twin.summary();
  return [
    { say: "Hi Harsh! Welcome to Tejas AI. Let me walk you through the complete platform, step by step.",
      target: null, postDelay: 300 },
    { say: "This is a live digital twin of an A I data centre. Every server rack is simulated with real cooling physics. The colours are live inlet temperatures — blue is cool, red is hot. You can orbit it and click any rack.",
      target: null, actions: [] },
    { say: `Tejas is running this hall on its own, right now. Policy version three, learned from thousands of control steps, ${(s.confidence * 100).toFixed(0)} percent confidence. And every decision it makes is explained, in plain language.`,
      target: '.autonomy-card', actions: [{ type: 'show', panels: ['autonomy'] }] },
    { say: `Here is the payoff. It holds P U E around ${s.aiPUE.toFixed(2)}, versus ${s.basePUE.toFixed(2)} for the old rule-based controller — that's over thirty percent less cooling energy, for the same safety.`,
      target: '.d-card[data-panel="savings"]', actions: [{ type: 'show', panels: ['savings', 'efficiency'] }] },
    { say: "Now watch a heat wave. I'm pushing the outside temperature to forty-seven degrees. See the baseline burn power — while Tejas runs the supply air warmer and holds the savings gap open.",
      target: '.d-card[data-panel="power"]', actions: [{ type: 'setWeather', tempC: 47 }, { type: 'show', panels: ['power', 'efficiency'] }], postDelay: 900 },
    { say: "Even at forty-seven degrees outside, every single rack stays inside the A S H R A E safe band. Same safety — far less power.",
      target: '.kpi-strip', actions: [{ type: 'show', panels: ['racks'] }] },
    { say: "But Tejas goes beyond cooling. It noticed G P U sixteen has been degrading for fourteen months — a restricted airflow fault — and it has already drafted the service email, with the exact parts. The technician arrives knowing precisely what to fix.",
      target: '.d-card[data-panel="service"]', actions: [{ type: 'show', panels: ['service', 'alerts'] }, { type: 'focusRack', name: 'GPU-16' }], postDelay: 700 },
    { say: "And this is one hall. Across fifty sites, the same brain saves crores every year — energy, rupees, and carbon.",
      target: '.d-card[data-panel="fleet"]', actions: [{ type: 'show', panels: ['fleet'] }, { type: 'setFleet', count: 50 }] },
    { say: "Today, the A I data centre. Next, every factory and cold store in India. One AI brain — that you simply talk to — taming heat and energy. That's Tejas AI. Thank you!",
      target: '.roadmap', actions: [] },
  ];
}

let tour = null;
function startTour() {
  if (tour && tour.active) return;
  closeCtxMenu(); closeDetail();
  $('inspector').hidden = true; inspId = null; scene.selected = null;
  tour = new Tour(buildSteps(), {
    onStart: () => { $('tourBtn').classList.add('running'); $('tourBtn').textContent = '■ Touring…'; $('tourBar').hidden = false; },
    onStop: () => {
      $('tourBtn').classList.remove('running'); $('tourBtn').textContent = '▶ Explain the platform';
      $('tourBar').hidden = true; $('tourVeil').hidden = true;
      if (currentSpot) { currentSpot.classList.remove('spot'); currentSpot = null; }
      // restore calm conditions, keep AI in control
      applyActions([{ type: 'setWeather', tempC: 38 }, { type: 'setMode', mode: 'ai' }]);
    },
    onStep: (i, n) => { $('tourStep').textContent = `${i + 1} / ${n}`; },
    onAction: (acts) => applyActions(acts),
    onHighlight: (sel) => highlight(sel),
    onCaption: (txt) => { $('tourCaption').textContent = txt; },
    onSpeakState: (on) => $('presAvatar').classList.toggle('speaking', on),
  });
  tour.start();
}
$('tourBtn').addEventListener('click', () => { if (tour && tour.active) tour.stop(); else startTour(); });
$('tourSkip').addEventListener('click', () => tour && tour.skip());
$('tourExit').addEventListener('click', () => tour && tour.stop());

// ---------- boot ------------------------------------------------------------
addMsg('Tejas', "I'm autonomously running this hall's digital twin. Ask me what's happening, how much power we're using, or if any machine is going down — and drag the weather/load sliders to stress me. Or hit ▶ Explain the platform for a guided tour.");
applyActions([{ type: 'show', panels: ['autonomy', 'savings', 'alerts'] }]);
requestAnimationFrame(frame);

// pause the render loop when the tab is hidden (saves CPU/GPU), resume cleanly
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { running = false; }
  else if (!running) { running = true; prev = performance.now(); requestAnimationFrame(frame); }
});

// ===========================================================================
// TEJ — the named AI voice copilot. Same brain as the chat console, but a
// full-screen persona you talk to: press T to speak, ask anything, and from a
// rack's detail screen it goes deep on "how to fix it" (root cause, steps, PUE).
// ===========================================================================
const USER_NAME = 'Harsh';

// general data-center context (live state + a concrete facility spec)
function tejSiteCtx() {
  const ctx = lastSummary ? ctxForBrain(lastSummary) : { aiPUE: '1.30', basePUE: '1.60' };
  const gpus = twin.aiRacks.filter(r => r.isGpu);
  const std = twin.aiRacks.filter(r => !r.isGpu);
  const fault = twin.aiRacks.find(r => r.faulted);
  const skus = [...new Set(gpus.slice(0, 5).map(r => gpuModel(r.id)))].join(', ');
  const itNameplate = gpus.length * 14 + std.length * 6;
  ctx.spec =
`Tejas AI — Hall A, Chennai AI data center (live digital twin).
Layout: ${twin.aiRacks.length} server racks, hot-aisle/cold-aisle, raised-floor cold-air supply.
Compute: ${gpus.length} NVIDIA GPU racks (${skus} — ~14 kW each) + ${std.length} standard 42U racks (~6 kW each). Nameplate IT ≈ ${itNameplate} kW.
Cooling: CRAC units + chiller plant + chilled-water loop; Tejas runs supply air warm with minimal airflow inside ASHRAE limits.
Efficiency: PUE ${ctx.aiPUE} (Tejas) vs ${ctx.basePUE} (baseline BMS); ~${ctx.coolPct || '35'}% leaner cooling. Total draw now ≈ ${ctx.aiTotal || '—'} kW (baseline ≈ ${ctx.baseTotal || '—'} kW).
Environment: ASHRAE recommended inlet ≤ 27°C; every rack held inside the safe band. Heat-wave tested to 50°C outside.
Autonomy: ${ctx.autonomy || 'policy v3, ~93% confidence'}.
Predictive maintenance: ${fault ? fault.name : 'GPU-16'} flagged — restricted airflow from a clogged CRAC-2 MERV-13 intake filter + a worn rear fan tray; running ~3°C above what its load predicts. Drafted work order, ~25 min fix.
Savings: ≈ ₹${ctx.rupeesDay || '—'}/day, ₹${ctx.rupeesYear || '—'}/yr, ${ctx.co2Year || '—'} t CO₂/yr avoided.`;
  return ctx;
}

// deep, rack-specific context for the detail-screen "how to fix it"
function tejRackCtx(id) {
  const ctx = tejSiteCtx();
  const c = comp.get(id); const r = twin.aiRacks.find(x => x.id === id);
  if (!c || !r) return ctx;
  const fan = lastSummary ? lastSummary.ai.fanFrac : 0.6;
  const air = Math.round(fan * (r.isGpu ? 920 : 520) * (r.faulted ? 0.55 : 1));
  const steps = (c.faults || []).filter(f => !f.done).map(f => `• ${f.fix} — ${f.issue}`).join('\n');
  ctx.spec +=
`\n\nUSER IS INSPECTING ${r.name} (${r.isGpu ? gpuModel(r.id) : 'standard 42U rack'}) — answer in depth about THIS rack and exactly how to fix it:
- inlet ≈ ${r.inlet.toFixed(1)}°C ; IT load ≈ ${r.load.toFixed(1)} kW ; airflow ≈ ${air} CFM ; vibration ${r.faulted ? '4.9 mm/s (high)' : '~1.5 mm/s'} ; status ${statusLabel(c.status)}
- internals: 48V busbar, PSU 3 kW ×6, ${r.isGpu ? 'GPU trays' : 'compute trays'}, rear fan tray, CRAC-2 MERV-13 intake filter
${steps ? '- open faults & the exact correction steps:\n' + steps : '- no open faults; running nominally'}
- impact of the fix: airflow restored → inlet back under 27°C, vibration normal, the rack turns blue (corrected), the work order auto-closes, and hall PUE improves toward ${ctx.aiPUE}.
Explain the root cause, the precise step-by-step correction, the expected temperature/PUE impact, and answer any follow-up about this rack.`;
  ctx.hottest = r.name; ctx.hottestTemp = r.inlet.toFixed(1);
  return ctx;
}

// Which context the chat uses right now — deep on a rack while its detail is open.
function chatContext() {
  return detailOpen() ? tejRackCtx(detailId) : tejSiteCtx();
}
// While a rack's detail screen is open, voice + chat target THAT screen's dock.
function detailOpen() { return detailId != null && !$('detail').hidden; }
function activeInput() { return detailOpen() ? $('dcInput') : $('cmdInput'); }
function submitVoice(text) { if (detailOpen()) runDetailChat(text, true); else { answerAloud = true; runCommand(text); } }

// ---- speech: press T (or tap the logo) to talk; replies are spoken ---------
// No separate page — the voice just drives the existing chat console: your
// words fill the chat box, the answer shows in the console AND is read aloud.
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let recog = null, listening = false, sendOnEnd = false, speaking = false, answerAloud = false;
function ensureRecog() {
  if (recog || !SR) return recog;
  recog = new SR();
  recog.lang = 'en-IN'; recog.interimResults = true; recog.continuous = false; recog.maxAlternatives = 1;
  recog.onresult = (e) => { let t = ''; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; activeInput().value = t; };
  recog.onerror = () => { listening = false; sendOnEnd = false; voiceUI(); };
  recog.onend = () => {
    const send = sendOnEnd; listening = false; sendOnEnd = false; voiceUI();
    const t = activeInput().value.trim();
    if (send && t) submitVoice(t);   // voice in → reply is spoken
  };
  return recog;
}
function startListening() {
  const r = ensureRecog();
  if (!r) { toast('Voice needs Chrome/Edge on localhost or HTTPS'); return; }
  stopSpeaking();                       // talking over Tej cuts it off
  activeInput().value = '';
  try { r.start(); listening = true; sendOnEnd = false; voiceUI(); } catch {}
}
function stopListening(send) { sendOnEnd = !!send; try { recog && recog.stop(); } catch {} }

// One control for the logo + the T key:
//  • listening → stop & send   • speaking → mute   • idle → start listening
function voiceTap() {
  if (listening) stopListening(true);
  else if (speaking) stopSpeaking();
  else startListening();
}
function voiceUI() {
  for (const b of [$('voiceBtn'), $('dcVoice')]) {
    if (!b) continue;
    b.classList.toggle('live', listening);
    b.classList.toggle('speaking', speaking);
    b.title = listening ? 'Listening… press T / tap to send'
      : speaking ? 'Speaking… press T / tap to mute' : 'Press T or tap to talk to Tej';
  }
}
function setSpeaking(on) { speaking = on; voiceUI(); }
function stopSpeaking() { if (window.speechSynthesis) window.speechSynthesis.cancel(); setSpeaking(false); }
function speak(text) {
  if (!('speechSynthesis' in window) || !text) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-IN'; u.rate = 1.02;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    speechSynthesis.speak(u);
  } catch {}
}

// wiring: the floating logo + the detail-screen mic + the T key
$('voiceBtn').addEventListener('click', voiceTap);
$('dcVoice').addEventListener('click', voiceTap);
if (!SR) { $('voiceBtn').classList.add('off'); $('dcVoice').classList.add('off'); }
// Press "T" anywhere to talk (or mute Tej while it speaks). Ignored while typing.
document.addEventListener('keydown', (e) => {
  if (e.repeat || (e.key !== 't' && e.key !== 'T')) return;
  const el = e.target;
  if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
  e.preventDefault();
  voiceTap();
});

// ---- chat dock on the rack-detail screen (scoped to the inspected rack) ----
function dcMsg(kind, text) {
  const el = document.createElement('div'); el.className = 'dc-msg ' + kind; el.textContent = text;
  $('dcLog').appendChild(el); $('dcLog').scrollTop = $('dcLog').scrollHeight; return el;
}
function resetDetailChat() {
  const r = twin.aiRacks.find(x => x.id === detailId);
  $('dcLog').innerHTML = '';
  dcMsg('ai', `Hi ${USER_NAME} — ask me anything about ${r ? r.name : 'this rack'}: how to fix it, the root cause, or the PUE impact. Press T to talk.`);
}
let dcBusy = false;
async function runDetailChat(text, aloud) {
  text = (text || '').trim(); if (!text || dcBusy) return;
  dcBusy = true; $('dcInput').value = ''; dcMsg('you', text);
  const think = dcMsg('ai think', '…');
  let res; try { res = await askBrain(text, tejRackCtx(detailId)); } catch { res = { reply: '', source: 'local' }; }
  think.remove();
  const reply = res.reply || 'I could not reach the brain. Check the OpenAI key / network, then ask again.';
  dcMsg('ai', reply); if (aloud) speak(reply); dcBusy = false;
}
$('dcSend').addEventListener('click', () => runDetailChat($('dcInput').value, false));
$('dcInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') runDetailChat($('dcInput').value, false); });
