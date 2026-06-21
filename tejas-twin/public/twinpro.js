// Tejas AI — Data Center Digital Twin console (glass UI over the live 3D hall).
// Reuses the engine: Twin (physics) + Twin3D (scene) + askBrain (AI chat).

import { Twin } from './sim.js';
import { Twin3D } from './twin3d.js';
import { askBrain } from './genui.js';

const $ = (id) => document.getElementById(id);
const fmtINR = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
const fmtShort = (n) => n >= 1e7 ? '₹' + (n / 1e7).toFixed(2) + 'Cr' : n >= 1e5 ? '₹' + (n / 1e5).toFixed(1) + 'L' : n >= 1e3 ? '₹' + (n / 1e3).toFixed(1) + 'k' : '₹' + Math.round(n);

const twin = new Twin();
const scene = new Twin3D($('stage'), { onPick: onPick });
scene.setRacks(twin.layout, twin.rows, twin.perRow);

let last = null, playing = false, playT = 0;

// ---------- panels / rail / tabs -------------------------------------------
function openPane(name) {
  document.querySelectorAll('.panelwrap').forEach(p => p.classList.toggle('on', p.dataset.pane === name));
  document.querySelectorAll('.vtab').forEach(t => t.classList.toggle('on', t.dataset.pane === name));
  document.querySelectorAll('.rail .ico[data-go]').forEach(i => i.classList.toggle('on', i.dataset.go === name));
}
document.querySelectorAll('.vtab').forEach(t => t.addEventListener('click', () => openPane(t.dataset.pane)));
document.querySelectorAll('.rail .ico[data-go]').forEach(i => i.addEventListener('click', () => openPane(i.dataset.go)));
document.querySelectorAll('.rail .ico[data-act]').forEach(i => i.addEventListener('click', () => {
  const a = i.dataset.act;
  if (a === 'cam') { scene.orbit.radius = 19; scene.orbit.theta = Math.PI * 0.18; scene.orbit.phi = Math.PI * 0.36; scene._applyCamera(); }
  if (a === 'chat') $('ask').focus();
  if (a === 'rack') { openPane('analytics'); seg($('anSeg'), 'kpi'); }
}));

// segmented toggles
function seg(el, v) {
  el.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === v || b.dataset.m === v));
}
$('anSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; seg($('anSeg'), b.dataset.v); $('specView').hidden = b.dataset.v !== 'spec'; $('kpiView').hidden = b.dataset.v !== 'kpi'; });
$('cfgSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) seg($('cfgSeg'), b.dataset.v); });
$('modeSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; seg($('modeSeg'), b.dataset.m); twin.setAI(b.dataset.m === 'ai'); });

// simulation subtabs
document.querySelectorAll('#simTabs .subtab').forEach(t => t.addEventListener('click', () => {
  document.querySelectorAll('#simTabs .subtab').forEach(x => x.classList.toggle('on', x === t));
  $('simThermal').hidden = t.dataset.s !== 'thermal';
  $('simElectrical').hidden = t.dataset.s !== 'electrical';
  $('simPiping').hidden = t.dataset.s !== 'piping';
  if (t.dataset.s === 'electrical') drawElectrical();
}));

// ---------- controls --------------------------------------------------------
$('loadR').addEventListener('input', e => { twin.setLoad(+e.target.value / 100); $('loadV').textContent = e.target.value + '%'; });
$('ambR').addEventListener('input', e => { twin.setAmbient(+e.target.value); $('ambV').textContent = e.target.value + '°C'; playing = false; $('playBtn').textContent = '▶'; });
$('playBtn').addEventListener('click', () => { playing = !playing; $('playBtn').textContent = playing ? '❚❚' : '▶'; $('playT').textContent = playing ? 'Running 24-hour cycle…' : 'Play a 24-hour day cycle'; });

// ---------- static spec content --------------------------------------------
const SPEC = [
  ['Configuration', '72 GPU · 36 CPU / rack'], ['Fast memory', '≈ 13 TB / rack'],
  ['NVLink bandwidth', '130 TB/s'], ['GPU memory', 'HBM3e'], ['GPU memory bw', '≈ 576 TB/s'],
  ['FP4 tensor', '~1.4 EFLOPS'], ['FP8 tensor', '~720 PFLOPS'], ['INT8 tensor', '~720 POPS'],
  ['BF16 tensor', '~360 PFLOPS'], ['TF32 tensor', '~180 PFLOPS'], ['Rack power', '~120 kW'],
  ['Cooling', 'direct-to-chip liquid'],
];
function renderSpec() { $('specList').innerHTML = SPEC.map(([l, v]) => `<div class="srow"><span class="sl">${l}</span><span class="sv">${v}</span></div>`).join(''); }
function renderSite() {
  const racks = twin.layout.length, itMW = (racks * 9 / 1000);
  $('siteList').innerHTML = [
    ['Region', 'Virginia, USA'], ['Power capacity', '614 MW'], ['Buildable area', '296 acres'],
    ['IT power (modelled)', itMW.toFixed(1) + ' MW'], ['Cooling', 'mixed · air + liquid'],
    ['Redundancy', 'N+1 cooling · 2N power'],
  ].map(([l, v]) => `<div class="srow"><span class="sl">${l}</span><span class="sv">${v}</span></div>`).join('');
}

// ---------- electrical one-line (SVG) --------------------------------------
function drawElectrical() {
  const N = (x, y, ok = true) => `<circle cx="${x}" cy="${y}" r="4" fill="${ok ? '#54e0a6' : '#ff6b6b'}"/>`;
  const L = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ff6b6b" stroke-width="1.4"/>`;
  $('elecDiagram').innerHTML = `<svg width="100%" viewBox="0 0 300 200">
    ${L(150, 14, 150, 40)}${N(150, 14)}
    <rect x="118" y="40" width="64" height="16" rx="3" fill="none" stroke="#9aa7bd" stroke-width="1"/>
    <text x="150" y="52" fill="#cfd8e6" font-size="8" text-anchor="middle">345kV substation</text>
    ${L(150, 56, 80, 86)}${L(150, 56, 220, 86)}
    ${L(80, 86, 80, 150)}${L(220, 86, 220, 150)}
    ${N(80, 86)}${N(220, 86)}
    ${[60, 100, 180, 240].map(x => L(x < 150 ? 80 : 220, 110, x, 150)).join('')}
    ${[60, 100, 180, 240].map(x => N(x, 150, Math.random() > 0.12)).join('')}
    ${[60, 100, 180, 240].map(x => `<rect x="${x - 12}" y="156" width="24" height="14" rx="2" fill="rgba(255,255,255,.05)" stroke="#9aa7bd" stroke-width="0.7"/><text x="${x}" y="166" fill="#93a2b8" font-size="6" text-anchor="middle">UPS</text>`).join('')}
    <text x="150" y="194" fill="#6b7a90" font-size="7" text-anchor="middle">distribution · green = energised</text>
  </svg>`;
}

// ---------- chat ------------------------------------------------------------
function addMsg(who, text, cls = '') {
  const el = document.createElement('div'); el.className = 'msg ' + (who === 'You' ? 'you' : 'ai') + (cls ? ' ' + cls : '');
  el.textContent = text; $('chat').appendChild(el); $('chat').scrollTop = $('chat').scrollHeight; return el;
}
function ctx() {
  const s = last || twin.summary(); const hot = twin.hottestRack('ai');
  return {
    mode: s.aiOn ? 'Tejas AI' : 'baseline', Tamb: s.env.Tamb.toFixed(0), loadPct: (s.env.loadFrac * 100).toFixed(0),
    aiPUE: s.aiPUE.toFixed(2), basePUE: s.basePUE.toFixed(2), aiTotal: s.ai.Ptotal.toFixed(0), baseTotal: s.base.Ptotal.toFixed(0),
    aiCool: s.ai.Pcool.toFixed(0), baseCool: s.base.Pcool.toFixed(0), coolPct: s.coolPctNow.toFixed(0),
    rupeesDay: Math.round(s.rupeesDay), rupeesYear: Math.round(s.rupeesYear), co2Year: s.co2Year.toFixed(1),
    hottest: hot.name, hottestTemp: hot.inlet.toFixed(1), autonomy: `policy v${s.policyVersion}`, alerts: twin.alerts().map(a => a.title),
  };
}
async function runAsk(t) {
  if (!t) return; $('ask').value = ''; addMsg('You', t);
  const think = addMsg('Tejas', '…', 'think');
  const { reply, actions } = await askBrain(t, ctx());
  think.remove();
  for (const a of (actions || [])) {
    if (a.type === 'setWeather') { twin.setAmbient(a.tempC); $('ambR').value = a.tempC; $('ambV').textContent = a.tempC + '°C'; openPane('simulations'); }
    else if (a.type === 'setLoad') { twin.setLoad(a.pct / 100); $('loadR').value = a.pct; $('loadV').textContent = a.pct + '%'; }
    else if (a.type === 'setMode') { twin.setAI(a.mode === 'ai'); seg($('modeSeg'), a.mode === 'ai' ? 'ai' : 'base'); openPane('configurator'); }
    else if (a.type === 'focusRack') { const r = twin.aiRacks.find(x => x.name.toUpperCase() === String(a.name).toUpperCase()); if (r) scene.focusRack(r.id); }
    else if (a.type === 'show' && a.panels) { if (a.panels.includes('savings') || a.panels.includes('efficiency')) { openPane('analytics'); seg($('anSeg'), 'kpi'); $('specView').hidden = true; $('kpiView').hidden = false; } }
  }
  addMsg('Tejas', reply || 'Done.');
}
$('askBtn').addEventListener('click', () => runAsk($('ask').value.trim()));
$('ask').addEventListener('keydown', e => { if (e.key === 'Enter') runAsk($('ask').value.trim()); });
['How is the hall doing?', "It's a heat wave — push to 47°C", 'How much are we saving?', 'Anything need service?'].forEach(c => { const b = document.createElement('button'); b.textContent = c; b.onclick = () => runAsk(c); $('chips').appendChild(b); });

function onPick(rack) {
  if (!rack) { $('bannerText').textContent = 'Shadow mode · drag to orbit · click a rack to inspect'; return; }
  $('bannerText').textContent = `${rack.name} · inlet ${rack.inlet.toFixed(1)}°C · ${rack.load.toFixed(0)} kW${rack.faulted ? ' · ⚠ service flagged' : ''}`;
}

// ---------- KPIs ------------------------------------------------------------
function badge(v, good, warn) { return v <= good ? 'g' : v <= warn ? 'y' : 'o'; }
function renderKPIs(s) {
  const pueB = badge(s.aiPUE, 1.35, 1.5);
  $('kpiGrid').innerHTML = `
    <div class="kpi good"><div class="kv">${s.aiPUE.toFixed(2)}</div><div class="kl">PUE · Tejas</div><div class="badge ${pueB}">${pueB === 'g' ? 'A' : pueB === 'y' ? 'B' : 'C'}</div></div>
    <div class="kpi"><div class="kv">${s.basePUE.toFixed(2)}</div><div class="kl">PUE · baseline</div></div>
    <div class="kpi good"><div class="kv">${s.coolPctNow.toFixed(0)}%</div><div class="kl">leaner cooling</div></div>
    <div class="kpi"><div class="kv">${fmtShort(s.rupeesDay)}</div><div class="kl">saved / day</div></div>
    <div class="kpi"><div class="kv">${s.env.Tamb.toFixed(0)}°C</div><div class="kl">outside</div></div>
    <div class="kpi ${s.safeAI ? 'good' : ''}"><div class="kv">${s.safeAI ? '✓' : '⚠'}</div><div class="kl">ASHRAE band</div></div>`;
  const parts = [['IT', s.ai.Pit], ['Chiller', s.ai.Pchiller], ['Fans', s.ai.Pfans], ['Aux', s.ai.Paux]];
  const mx = Math.max(...parts.map(p => p[1]));
  $('assetBars').innerHTML = parts.map(([k, v]) =>
    `<div class="srl"><div class="lab"><span>${k}</span><b>${v.toFixed(0)} kW</b></div><div style="height:6px;border-radius:6px;background:rgba(255,255,255,.08)"><div style="height:100%;width:${(v / mx * 100).toFixed(0)}%;border-radius:6px;background:linear-gradient(90deg,#34d39a,#5aa8ff)"></div></div></div>`).join('');
}

// ---------- loop ------------------------------------------------------------
let prev = performance.now(), hud = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
  if (playing) { playT += dt * 0.06; const amb = 38 + 9 * Math.sin(playT * 2 * Math.PI); twin.setAmbient(amb); $('ambR').value = amb.toFixed(0); $('ambV').textContent = amb.toFixed(0) + '°C'; }
  const s = twin.tick(0.02); last = s;
  scene.update({ env: s.env, ai: s.ai, base: s.base, aiRacksData: twin.aiRacks, baseRacksData: twin.baseRacks }, 'ai', dt);
  if (++hud % 5 === 0) {
    $('ctlReadout').textContent = `supply ${s.ai.Tsup.toFixed(0)}°C · fans ${(s.ai.fanFrac * 100).toFixed(0)}% · CHW ${s.ai.Tchw.toFixed(0)}°C`;
    if (!$('kpiView').hidden) renderKPIs(s);
  }
  requestAnimationFrame(frame);
}

// ---------- brain pill + boot ----------------------------------------------
fetch('/api/health').then(r => r.json()).then(h => {
  const dot = $('brainDot'), txt = $('brainText');
  if (h.brain === 'openai') { dot.style.background = '#54e0a6'; txt.textContent = 'OpenAI'; }
  else { txt.textContent = h.brain === 'ollama' ? 'Ollama' : 'local'; }
}).catch(() => { $('brainText').textContent = 'local'; });

renderSpec(); renderSite(); drawElectrical();
addMsg('Tejas', "I'm running this hall's digital twin in shadow mode. Ask me anything, push a heat wave in Simulations, or open KPIs.");
requestAnimationFrame(frame);
