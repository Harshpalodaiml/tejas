// Tejas AI — Factory twin viewer.
// Loads the twin's stored DESIGN, renders the real 3D structure, and then lets
// the AI derive the right instrumentation FROM that design — a data-center gets
// PUE / supply-air / rack-inlet sensors, a cold store gets room-temp /
// compressor sensors, a machine line gets vibration / RPM, etc. Plus controls,
// health, and an on-topic assistant.

import { Factory3D } from './factory3d.js';
import { PLANTS } from './plants.js';

const $ = (id) => document.getElementById(id);
const rnd = (a, b) => a + Math.random() * (b - a);
const params = new URLSearchParams(location.search);
const TYPE = params.get('type');                       // factory|nuclear|geothermal|solar
const PLANT = PLANTS[TYPE] || null;
const TWIN_NAME = params.get('name') || (PLANT ? PLANT.name : 'Factory Twin');
$('facName').textContent = TWIN_NAME;
const sub = document.querySelector('.brand-sub'); if (sub && PLANT) sub.textContent = PLANT.name + ' · Digital Twin';
// immersive links (VR walkthrough of THIS plant type, + field AR)
const vrLink = $('facVr'); if (vrLink) vrLink.href = '/vr?type=' + (TYPE && PLANT ? TYPE : 'factory');

const scene = new Factory3D($('facCanvas'));
const machine = { power: true, speed: 60 };
let SENSORS = [];
let kind = 'machine';

// ---- sensor presets the AI picks from, based on the design -----------------
function presetFor(comps) {
  const types = new Set((comps || []).map(c => c.t));
  if (types.has('rack') || types.has('crac') || types.has('chiller')) {
    kind = 'data center';
    return [
      { label: 'PUE', unit: '', warn: 1.8, calc: (p, s) => p ? +(1.55 - (s / 100) * 0.28 + rnd(-0.02, 0.02)).toFixed(2) : 1.0 },
      { label: 'Supply air', unit: '°C', warn: 27, calc: (p, s) => p ? +(18 + (s / 100) * 4 + rnd(-0.5, 0.5)).toFixed(1) : 24 },
      { label: 'Rack inlet', unit: '°C', warn: 27, calc: (p, s) => p ? +(22 + (s / 100) * 4.5 + rnd(-0.6, 0.6)).toFixed(1) : 25 },
      { label: 'Return air', unit: '°C', warn: 40, calc: (p, s) => p ? +(30 + (s / 100) * 6 + rnd(-0.6, 0.6)).toFixed(1) : 26 },
      { label: 'Humidity', unit: '%RH', warn: 60, calc: () => Math.round(45 + rnd(-2, 2)) },
      { label: 'Total power', unit: 'kW', warn: 9e9, calc: (p, s) => p ? Math.round(140 * (0.5 + s / 100 * 0.6) + rnd(-4, 4)) : 8 },
    ];
  }
  if (types.has('compressor') || types.has('cooler')) {
    kind = 'cold storage';
    return [
      { label: 'Room temp', unit: '°C', warn: 8, calc: (p, s) => p ? +(2 + (1 - s / 100) * 5 + rnd(-0.3, 0.3)).toFixed(1) : 14 },
      { label: 'Compressor', unit: '%', warn: 95, calc: (p, s) => p ? Math.round(s + rnd(-3, 3)) : 0 },
      { label: 'Humidity', unit: '%RH', warn: 90, calc: () => Math.round(82 + rnd(-3, 3)) },
      { label: 'Suction', unit: 'bar', warn: 9e9, calc: (p) => p ? +(1.8 + rnd(-0.1, 0.1)).toFixed(1) : 0 },
      { label: 'Power', unit: 'kW', warn: 9e9, calc: (p, s) => p ? Math.round(40 * (0.4 + s / 100 * 0.8) + rnd(-2, 2)) : 3 },
    ];
  }
  kind = 'machine';
  return [
    { label: 'Temperature', unit: '°C', warn: 70, calc: (p, s) => p ? +(28 + 46 * (0.4 + s / 100 * 0.9) * 0.55 + rnd(-1, 1)).toFixed(1) : 27 },
    { label: 'Vibration', unit: 'mm/s', warn: 4.5, calc: (p, s) => p ? +(2.2 * (0.4 + s / 100 * 0.9) + rnd(-0.3, 0.3)).toFixed(1) : 0 },
    { label: 'Speed', unit: 'rpm', warn: 9e9, calc: (p, s) => p ? Math.round(1480 * (s / 100) + rnd(-25, 25)) : 0 },
    { label: 'Load', unit: '%', warn: 92, calc: (p, s) => p ? Math.round(s + rnd(-3, 3)) : 0 },
    { label: 'Current', unit: 'A', warn: 60, calc: (p, s) => p ? Math.round(38 * (0.4 + s / 100 * 0.9) + rnd(-2, 2)) : 0 },
    { label: 'Power', unit: 'kW', warn: 9e9, calc: (p, s) => p ? +(9.2 * (0.4 + s / 100 * 0.9) + rnd(-0.4, 0.4)).toFixed(1) : 0 },
  ];
}

function buildSensorCards() {
  SENSORS.forEach((s, i) => s.id = 'sn' + i);
  $('sensorGrid').innerHTML = SENSORS.map(s =>
    `<div class="sensor-card" id="sc-${s.id}"><span class="sc-l">${s.label}</span>
      <span class="sc-v">—<small> ${s.unit}</small></span></div>`).join('');
}
function tickSensors() {
  if (!SENSORS.length) return;
  for (const s of SENSORS) {
    s.v = s.calc(machine.power, machine.speed);
    const card = $('sc-' + s.id); if (!card) continue;
    card.querySelector('.sc-v').innerHTML = `${s.v}<small> ${s.unit}</small>`;
    card.classList.toggle('warn', s.v > s.warn);
  }
  scene.setState({ power: machine.power, speed: machine.speed / 100, heat: machine.power ? machine.speed / 100 * 0.8 : 0.08 });
  renderHealth();
}
const sFind = (re) => SENSORS.find(s => re.test(s.label.toLowerCase()));

function renderHealth() {
  const box = $('facAlerts');
  if (!machine.power) { box.innerHTML = '<div class="alert"><div class="at">Stopped</div><div class="ad">The twin is powered down.</div></div>'; return; }
  const issues = SENSORS.filter(s => s.v > s.warn);
  if (!issues.length) { box.innerHTML = `<div class="alert optimise"><div class="at">✓ Healthy</div><div class="ad">All ${SENSORS.length} sensors within normal range.</div></div>`; return; }
  box.innerHTML = issues.map(s =>
    `<div class="alert warning"><div class="at">${s.label} high</div><div class="ad">${s.v} ${s.unit} — above ${s.warn} ${s.unit}. Tejas recommends checking it.</div></div>`).join('');
}

// ---- controls --------------------------------------------------------------
document.querySelectorAll('#powerSwitch button').forEach(b => b.addEventListener('click', () => {
  machine.power = b.dataset.p === 'on';
  document.querySelectorAll('#powerSwitch button').forEach(x => x.classList.toggle('active', x === b));
  $('stateValue').textContent = machine.power ? 'Running' : 'Stopped';
  $('statePill').dataset.mode = machine.power ? 'ai' : 'baseline';
  tickSensors();
}));
$('spdSlider').addEventListener('input', e => { machine.speed = +e.target.value; $('spdVal').textContent = machine.speed + '%'; tickSensors(); });

// ---- assistant -------------------------------------------------------------
function addMsg(who, text) {
  const el = document.createElement('div');
  el.className = 'msg ' + (who === 'You' ? 'you' : 'ai');
  el.innerHTML = `<span class="who">${who}</span>${text}`;
  $('chat').appendChild(el); $('chat').scrollTop = $('chat').scrollHeight; return el;
}
const valOf = (s) => s ? `${s.v} ${s.unit}`.trim() : '—';
function localAnswer(t) {
  t = t.toLowerCase();
  if (/health|status|ok|fine|how|going|happening/.test(t)) {
    if (!machine.power) return 'The twin is currently stopped.';
    const bad = SENSORS.filter(s => s.v > s.warn);
    return bad.length ? `Watch ${bad.map(s => s.label.toLowerCase()).join(' & ')} — running high.`
      : `Healthy. ${SENSORS.slice(0, 3).map(s => `${s.label} ${valOf(s)}`).join(', ')} — all nominal.`;
  }
  if (/temp|heat|hot|cool|cold|air/.test(t)) { const s = sFind(/temp|air|inlet|room/); return s ? `${s.label} is ${valOf(s)}.` : 'No temperature sensor on this twin.'; }
  if (/power|electric|kw|consum|energy|pue/.test(t)) { const s = sFind(/power|pue/); return s ? `${s.label} is ${valOf(s)}.` : 'No power sensor on this twin.'; }
  if (/vibrat|shak|bearing/.test(t)) { const s = sFind(/vibrat/); return s ? `Vibration is ${valOf(s)}${s.v > s.warn ? ' — above alarm.' : ' — normal.'}` : 'No vibration sensor here.'; }
  if (/speed|rpm|fast|slow|load/.test(t)) return `Running at ${machine.speed}% load.`;
  if (/stop|shut|turn off/.test(t)) { document.querySelector('#powerSwitch [data-p=off]').click(); return 'Stopping the twin.'; }
  if (/run|start|turn on/.test(t)) { document.querySelector('#powerSwitch [data-p=on]').click(); return 'Running the twin.'; }
  if (/what|this|about|structure|design/.test(t)) return `${TWIN_NAME} — a ${kind} twin Tejas built from your design, with ${SENSORS.length} live sensors. Ask about health, temperature or power.`;
  return `${SENSORS.slice(0, 4).map(s => `${s.label} ${valOf(s)}`).join(' · ')}. Ask about health, temperature, or power.`;
}
function ask(text) { if (!text) return; $('cmdInput').value = ''; addMsg('You', text); addMsg('Tejas', localAnswer(text)); }
$('sendBtn').addEventListener('click', () => ask($('cmdInput').value.trim()));
$('cmdInput').addEventListener('keydown', e => { if (e.key === 'Enter') ask($('cmdInput').value.trim()); });
['How is it doing?', "What's the temperature?", 'How much power?', 'Anything wrong?'].forEach(c => {
  const b = document.createElement('button'); b.textContent = c; b.onclick = () => ask(c); $('chips').appendChild(b);
});

// ---- brain pill ------------------------------------------------------------
fetch('/api/health').then(r => r.json()).then(h => {
  const dot = $('brainDot'), txt = $('brainText');
  if (h.brain === 'openai') { dot.className = 'dot good'; txt.textContent = 'OpenAI · ' + h.model; }
  else { dot.className = 'dot'; txt.textContent = h.brain === 'ollama' ? 'Ollama' : 'local brain'; }
}).catch(() => { $('brainText').textContent = 'local brain'; });

// ---- init: load design -> render structure -> derive instrumentation ------
(async function initTwin() {
  const id = params.get('id');
  let comps = null, bounds = null;
  try {
    const twins = (await fetch('/api/twins').then(r => r.json())).twins || [];
    const t = twins.find(x => String(x.id) === String(id));
    if (t) { comps = t.components; bounds = t.bounds; }
  } catch {}

  if (comps && comps.length) {
    scene.buildLayout(comps, bounds);
    SENSORS = presetFor(comps);
    const counts = {};
    comps.forEach(c => { if (c.t !== 'land') counts[c.t] = (counts[c.t] || 0) + 1; });
    const summary = Object.entries(counts).map(([k, v]) => `${v}× ${k}`).join(', ');
    $('facReadout').textContent = `${kind} · ${summary}`;
    buildSensorCards();
    addMsg('Tejas', `I read your design (${summary}) and set it up as a ${kind} twin with ${SENSORS.length} sensors. Monitoring live — ask me how it's doing.`);
  } else if (PLANT && TYPE !== 'factory') {
    // a typed power plant: nuclear / geothermal / solar
    scene.buildPlantScene(TYPE);
    SENSORS = PLANT.sensors;
    kind = PLANT.name;
    $('facReadout').textContent = PLANT.name + ' · autonomous';
    buildSensorCards();
    addMsg('Tejas', `Live ${PLANT.name} twin — ${PLANT.blurb} I'm reading ${SENSORS.length} live sensors. Ask how it's doing, or run/stop & throttle it on the left.`);
  } else {
    scene.buildMachine();             // rich factory floor (default + ?type=factory)
    SENSORS = PLANT ? PLANT.sensors : presetFor([]);
    kind = PLANT ? PLANT.name : 'machine';
    $('facReadout').textContent = kind + ' · live';
    buildSensorCards();
    addMsg('Tejas', PLANT
      ? `Live ${PLANT.name} twin — ${PLANT.blurb} Reading ${SENSORS.length} sensors; ask how it's doing or control it on the left.`
      : `Live digital twin of ${TWIN_NAME}. I'm reading ${SENSORS.length} sensors — ask how it's doing or control it on the left.`);
  }
  tickSensors();
  setInterval(tickSensors, 700);
})();

// ---- render loop -----------------------------------------------------------
let prev = performance.now();
let running = true;
function loop(now) {
  if (!running) return;
  const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
  scene.frame(dt); requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { running = false; }
  else if (!running) { running = true; prev = performance.now(); requestAnimationFrame(loop); }
});
