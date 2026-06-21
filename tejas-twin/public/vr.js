// Tejas AI — VR walkthrough. Scan the QR on your phone and you stand INSIDE the
// live data-center twin: drag (or tilt the phone) to look, joystick to walk,
// side buttons to rise/duck, and a cardboard "VR mode" split view. Pure
// vendored Three.js, no addons beyond StereoCamera.

import * as THREE from './vendor/three.module.js';
import { buildPlant, animatePlant, makeSinks, PLANTS } from './plants.js';
import { askBrain } from './genui.js';

const $ = (id) => document.getElementById(id);
const rnd = (a, b) => a + Math.random() * (b - a);

// ---- temperature → colour ramp --------------------------------------------
const RAMP = [
  { t: 18, c: new THREE.Color('#1e6bff') },
  { t: 22, c: new THREE.Color('#19c6ff') },
  { t: 24, c: new THREE.Color('#2ee6a6') },
  { t: 27, c: new THREE.Color('#ffd34d') },
  { t: 30, c: new THREE.Color('#ff7a33') },
  { t: 34, c: new THREE.Color('#ff3344') },
];
function tempColor(t, out) {
  if (t <= RAMP[0].t) return out.copy(RAMP[0].c);
  if (t >= RAMP[RAMP.length - 1].t) return out.copy(RAMP[RAMP.length - 1].c);
  for (let i = 0; i < RAMP.length - 1; i++) {
    const a = RAMP[i], b = RAMP[i + 1];
    if (t >= a.t && t <= b.t) return out.copy(a.c).lerp(b.c, (t - a.t) / (b.t - a.t));
  }
  return out.copy(RAMP[RAMP.length - 1].c);
}

// ===========================================================================
//  RENDERER / SCENE
// ===========================================================================
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
$('stage').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#0a1020', 16, 60);

const camera = new THREE.PerspectiveCamera(74, innerWidth / innerHeight, 0.05, 200);

// player state
const pos = new THREE.Vector3(0, 1.6, 12);     // eye height ~1.6m, in the aisle mouth
let yaw = 0, pitch = 0;                           // look down -z, into the hall
const BOUND = { x: 9.2, zMin: -13, zMax: 17, yMin: 0.6, yMax: 6.5 };

// ---- sky dome whose colour we can shift -----------------------------------
const skyU = { top: { value: new THREE.Color('#0a1b3a') }, bottom: { value: new THREE.Color('#0a1020') } };
scene.add(new THREE.Mesh(
  new THREE.SphereGeometry(95, 32, 16),
  new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, uniforms: skyU,
    vertexShader: 'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'varying vec3 vP;uniform vec3 top;uniform vec3 bottom;void main(){float h=clamp(normalize(vP).y*0.5+0.5,0.0,1.0);gl_FragColor=vec4(mix(bottom,top,pow(h,0.8)),1.0);}',
  }),
));

// ---- lights ---------------------------------------------------------------
scene.add(new THREE.HemisphereLight('#bcd4ff', '#0a0f18', 0.6));
const sun = new THREE.DirectionalLight('#fff0d0', 1.0);
sun.position.set(14, 22, 8); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
{ const s = sun.shadow.camera, d = 20; s.left = -d; s.right = d; s.top = d; s.bottom = -d; s.near = 1; s.far = 70; }
scene.add(sun);

// ---- floor + grid + cold/hot aisle strips ---------------------------------
const floor = new THREE.Mesh(
  new THREE.BoxGeometry(22, 0.4, 34),
  new THREE.MeshStandardMaterial({ color: '#0e1424', roughness: 0.92, metalness: 0.08 }),
);
floor.position.set(0, -0.2, 2); floor.receiveShadow = true; scene.add(floor);
const grid = new THREE.GridHelper(34, 34, 0x2b3b66, 0x172033); grid.position.set(0, 0.01, 2); scene.add(grid);

// overhead truss + light bars (gives the "inside a building" feeling)
const trussMat = new THREE.MeshStandardMaterial({ color: '#0c1320', metalness: 0.6, roughness: 0.5 });
for (let i = 0; i < 6; i++) {
  const beam = new THREE.Mesh(new THREE.BoxGeometry(20, 0.18, 0.18), trussMat);
  beam.position.set(0, 6.4, -10 + i * 5); scene.add(beam);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(7, 0.12, 0.5),
    new THREE.MeshStandardMaterial({ color: '#0a0f18', emissive: '#bcd4ff', emissiveIntensity: 0.7 }));
  bar.position.set(0, 6.3, -10 + i * 5); scene.add(bar);
}

// side walls (so you feel enclosed)
const wallMat = new THREE.MeshStandardMaterial({ color: '#0b1322', roughness: 0.95, metalness: 0.05 });
for (const sx of [-1, 1]) {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 6.8, 34), wallMat);
  wall.position.set(sx * 10.8, 3.2, 2); scene.add(wall);
}
const backWall = new THREE.Mesh(new THREE.BoxGeometry(22, 6.8, 0.3), wallMat);
backWall.position.set(0, 3.2, -14.8); scene.add(backWall);

// ===========================================================================
//  SCENE CONTENTS — a data-center hall, OR a busy factory floor (?type=factory)
// ===========================================================================
const PLANT_TYPES = ['factory', 'nuclear', 'geothermal', 'solar'];
const qType = new URLSearchParams(location.search).get('type');
const TYPE = PLANT_TYPES.includes(qType) ? qType : 'datacenter';
const racks = [];        // pickable units (racks or machines) — userData.rack
const tmpC = new THREE.Color();
let airGeo = null, PN = 0;
let sinks = null;        // populated for plant types (machines, workers, agvs, steam…)

if (TYPE === 'datacenter') buildDataCenter();
else { sinks = makeSinks(); buildPlant(scene, TYPE, sinks); for (const g of sinks.racks) racks.push(g); rethemeFor(TYPE); }

function rethemeFor(type) {
  const meta = PLANTS[type]; if (!meta) return;
  document.title = 'Tejas VR · ' + meta.name;
  const h1 = document.querySelector('#intro h1'); if (h1) h1.textContent = 'Walk inside the ' + meta.name.toLowerCase();
  const ip = document.querySelector('#intro p'); if (ip) ip.innerHTML = "You're inside the live <b>" + meta.name + "</b> twin. Drag to look, joystick to walk the site, side buttons to rise or duck. Tap 🥽 for cardboard VR.";
  const tb = document.querySelector('.tb-txt span'); if (tb) tb.textContent = 'inside the ' + meta.name.toLowerCase();
  const labels = ['Temp', 'Load', 'Output', 'Status'];
  document.querySelectorAll('#info .cl').forEach((el, i) => { if (labels[i]) el.textContent = labels[i]; });
}

// ----------------------- DATA CENTER ---------------------------------------
function buildDataCenter() {
  const rackGeo = new THREE.BoxGeometry(0.95, 2.1, 1.15);
  const faceGeo = new THREE.PlaneGeometry(0.8, 1.8);
  function makeRack(name, x, z, faceTowardPlusZ, base, faulted) {
    const grp = new THREE.Group();
    grp.position.set(x, 1.05, z);
    const body = new THREE.Mesh(rackGeo, new THREE.MeshStandardMaterial({
      color: name.startsWith('GPU') ? '#161f33' : '#10182a', roughness: 0.55, metalness: 0.5,
    }));
    body.castShadow = true; body.receiveShadow = true; grp.add(body);
    const faceMat = new THREE.MeshStandardMaterial({
      color: '#0c1322', emissive: '#19c6ff', emissiveIntensity: 0.9, roughness: 0.4, metalness: 0.2,
    });
    const face = new THREE.Mesh(faceGeo, faceMat);
    face.position.z = faceTowardPlusZ ? 0.59 : -0.59;
    if (faceTowardPlusZ) face.rotation.y = Math.PI;
    grp.add(face);
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshBasicMaterial({ color: '#2ee6a6' }));
    led.position.set(0.32, 1.12, faceTowardPlusZ ? 0.5 : -0.5); grp.add(led);
    grp.userData.rack = { name, base, faulted: !!faulted, load: faulted ? 9.4 : rnd(5, 9), faceMat, led };
    scene.add(grp); racks.push(grp);
  }
  let n = 1;
  for (let r = 0; r < 7; r++) {
    const z = -9 + r * 3.0;
    makeRack('R-' + (n++), -2.0, z, true, rnd(21, 24), false);
    makeRack('R-' + (n++), -3.2, z, true, rnd(21, 24), false);
    const fault = (r === 4);
    makeRack(fault ? 'GPU-16' : 'GPU-' + (r + 9), 2.0, z, false, fault ? 28.5 : rnd(22, 25), fault);
    makeRack('GPU-' + (r + 1), 3.2, z, false, rnd(22, 25), false);
  }
  const cracMat = new THREE.MeshStandardMaterial({ color: '#16223c', metalness: 0.5, roughness: 0.5 });
  for (const sx of [-6.5, 6.5]) {
    const crac = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.6, 1.4), cracMat);
    crac.position.set(sx, 1.3, -12); crac.castShadow = true; scene.add(crac);
  }
  const chiller = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.6, 2.2),
    new THREE.MeshStandardMaterial({ color: '#1a2742', metalness: 0.4, roughness: 0.6 }));
  chiller.position.set(0, 1.3, -13.4); chiller.castShadow = true; scene.add(chiller);
  // cold-air particles rising in the aisle
  PN = 600;
  const pp = new Float32Array(PN * 3);
  for (let i = 0; i < PN; i++) { pp[i * 3] = rnd(-4.5, 4.5); pp[i * 3 + 1] = rnd(0, 3.4); pp[i * 3 + 2] = rnd(-10, 15); }
  airGeo = new THREE.BufferGeometry();
  airGeo.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  scene.add(new THREE.Points(airGeo, new THREE.PointsMaterial({
    color: '#7fdfff', size: 0.06, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false,
  })));
}

// ===========================================================================
//  CONTROLS — look (drag/gyro), move (joystick), rise/duck, inspect
// ===========================================================================
const joy = { active: false, id: null, x: 0, y: 0, cx: 0, cy: 0 };
const look = { id: null, lx: 0, ly: 0 };
let vy = 0;                       // vertical velocity from up/down buttons
let gyroOn = false, gyroBase = null;

// pointer routing: left-third bottom area = joystick; elsewhere = look-drag
const joyEl = $('joy'), knob = $('joyKnob');
function joyStart(e, rect) {
  joy.active = true; joy.id = e.pointerId; joy.cx = rect.left + rect.width / 2; joy.cy = rect.top + rect.height / 2;
  joyMove(e);
}
function joyMove(e) {
  let dx = e.clientX - joy.cx, dy = e.clientY - joy.cy;
  const max = 46, d = Math.hypot(dx, dy);
  if (d > max) { dx *= max / d; dy *= max / d; }
  knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  joy.x = dx / max; joy.y = dy / max;
}
function joyEnd() { joy.active = false; joy.id = null; joy.x = joy.y = 0; knob.style.transform = 'translate(-50%,-50%)'; }
joyEl.addEventListener('pointerdown', (e) => { e.preventDefault(); joyStart(e, joyEl.getBoundingClientRect()); });

window.addEventListener('pointerdown', (e) => {
  if (joy.active && e.pointerId === joy.id) return;
  if (e.target.closest('#joy,.rbtns,.chips,#info,.topbar,#intro,#assistant')) return;
  look.id = e.pointerId; look.lx = e.clientX; look.ly = e.clientY;
});
window.addEventListener('pointermove', (e) => {
  if (joy.active && e.pointerId === joy.id) { joyMove(e); return; }
  if (look.id === e.pointerId) {
    const dx = e.clientX - look.lx, dy = e.clientY - look.ly; look.lx = e.clientX; look.ly = e.clientY;
    yaw -= dx * 0.0042;
    pitch = Math.max(-1.2, Math.min(1.2, pitch - dy * 0.0042));
  }
});
window.addEventListener('pointerup', (e) => {
  if (joy.active && e.pointerId === joy.id) joyEnd();
  if (look.id === e.pointerId) look.id = null;
});

// rise / duck (hold)
function holdBtn(id, dir) {
  const el = $(id); let t = null;
  const start = (e) => { e.preventDefault(); vy = dir * 2.6; };
  const stop = () => { vy = 0; };
  el.addEventListener('pointerdown', start);
  el.addEventListener('pointerup', stop); el.addEventListener('pointerleave', stop); el.addEventListener('pointercancel', stop);
}
holdBtn('btnUp', 1); holdBtn('btnDown', -1);

// ---- gyro look (magic window) ---------------------------------------------
function applyGyro(e) {
  if (!gyroOn || e.alpha == null) return;
  const a = THREE.MathUtils.degToRad(e.alpha);
  const b = THREE.MathUtils.degToRad(e.beta);
  if (gyroBase == null) gyroBase = a + yaw;     // align forward with current facing
  yaw = gyroBase - a;
  pitch = Math.max(-1.2, Math.min(1.2, b - Math.PI / 2));
}
window.addEventListener('deviceorientation', applyGyro, true);

$('gyroToggle').addEventListener('click', async () => {
  if (!gyroOn) {
    // iOS requires an explicit permission gesture
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
        const p = await DeviceOrientationEvent.requestPermission();
        if (p !== 'granted') { hud('motion denied'); return; }
      }
    } catch {}
    gyroOn = true; gyroBase = null; $('gyroToggle').classList.add('on');
  } else {
    gyroOn = false; $('gyroToggle').classList.remove('on');
  }
});

// ---- VR (cardboard) split-screen ------------------------------------------
const stereo = new THREE.StereoCamera(); stereo.eyeSep = 0.064;
let vrMode = false;
$('vrToggle').addEventListener('click', () => {
  vrMode = !vrMode;
  $('vrToggle').classList.toggle('on', vrMode);
  // the single centre reticle/label would sit on the stereo seam — hide them
  $('reticle').style.display = vrMode ? 'none' : 'block';
  if (vrMode) $('look').style.display = 'none';
  // in VR mode auto-enable gyro so it feels headset-like
  if (vrMode && !gyroOn) $('gyroToggle').click();
});

// ===========================================================================
//  RETICLE PICK — what are you looking at?
// ===========================================================================
const ray = new THREE.Raycaster();
const center = new THREE.Vector2(0, 0);
let hovered = null;
function pickCenter() {
  ray.setFromCamera(center, camera);
  const hits = ray.intersectObjects(racks, true);
  let g = null;
  if (hits.length && hits[0].distance < 14) {
    g = hits[0].object; while (g && !g.userData.rack) g = g.parent;
  }
  hovered = g;
  const lk = $('look');
  if (vrMode) { lk.style.display = 'none'; return; }
  if (g) {
    const rk = g.userData.rack;
    lk.style.display = 'block';
    lk.innerHTML = `<b>${rk.name}</b> · ${rk.temp.toFixed(1)}°C${rk.faulted ? ' ⚠' : ''}`;
  } else lk.style.display = 'none';
}

let lastInfoG = null;          // the rack whose #info card is open (for "Ask about this rack")
function openInfo(g) {
  if (!g) return;
  lastInfoG = g;
  const rk = g.userData.rack;
  $('info').style.display = 'block';
  $('iName').textContent = rk.name;
  $('iPill').className = 'pill ' + (rk.faulted ? 'bad' : 'ok');
  $('iPill').textContent = rk.faulted ? 'SERVICE NEEDED' : (rk.isMachine ? 'RUNNING' : 'HEALTHY');
  $('iTemp').textContent = rk.temp.toFixed(1) + '°C';
  $('iLoad').textContent = (rk.load || 0).toFixed(1) + (rk.isMachine ? ' MW' : ' kW');
  if (rk.isMachine) {
    $('iAir').textContent = (rk.faulted ? Math.round(rnd(40, 60)) : Math.round(rnd(95, 120))) + ' u/min';
    const warm = rk.temp > 58;
    $('iStat').textContent = rk.faulted ? 'Service due' : (warm ? 'Warm' : 'Nominal');
    $('iStat').style.color = rk.faulted || warm ? 'var(--bad)' : 'var(--ai)';
  } else {
    $('iAir').textContent = Math.round((rk.faulted ? 0.55 : 1) * (rk.name.startsWith('GPU') ? 900 : 520)) + ' CFM';
    $('iStat').textContent = rk.faulted ? 'Airflow fault' : (rk.temp > 27 ? 'Warm' : 'Nominal');
    $('iStat').style.color = rk.faulted || rk.temp > 27 ? 'var(--bad)' : 'var(--ai)';
  }
}
$('btnInspect').addEventListener('click', () => openInfo(hovered));
$('infoClose').addEventListener('click', () => { $('info').style.display = 'none'; });

function hud(t) { $('hud').textContent = t; }

// ===========================================================================
//  AI VOICE ASSISTANT  (OpenAI via /api/chat) — knows the whole twin, and goes
//  deeper on the rack you're inspecting. Push-to-talk: tap to talk, tap to send.
// ===========================================================================
const GPU_MODELS = ['NVIDIA GB200 NVL72', 'NVIDIA HGX B200', 'NVIDIA HGX H200', 'NVIDIA DGX H100', 'NVIDIA HGX H100'];
const gpuModelFor = (name) => GPU_MODELS[(parseInt(String(name).replace(/\D/g, ''), 10) || 0) % GPU_MODELS.length];

// Live, concrete facts about the hall so OpenAI can answer size/spec questions.
function siteContext() {
  const dcRacks = racks.filter(g => g.userData.rack && !g.userData.rack.isMachine);
  const list = (dcRacks.length ? dcRacks : racks).map(g => g.userData.rack).filter(Boolean);
  const gpu = list.filter(r => String(r.name).startsWith('GPU'));
  const std = list.filter(r => !String(r.name).startsWith('GPU'));
  const faulted = list.find(r => r.faulted);
  const hottest = list.reduce((a, r) => (r.temp ?? r.base) > (a.temp ?? a.base) ? r : a, list[0] || {});
  const itNameplate = gpu.length * 14 + std.length * 6;          // kW nameplate
  const loadPct = 80;
  const itNow = Math.round(itNameplate * loadPct / 100);
  const aiPUE = 1.30, basePUE = 1.60;
  const aiTotal = Math.round(itNow * aiPUE), baseTotal = Math.round(itNow * basePUE);
  const aiCool = aiTotal - itNow, baseCool = baseTotal - itNow;
  const coolPct = Math.round((1 - aiCool / baseCool) * 100);
  const rupeesDay = Math.round((baseTotal - aiTotal) * 24 * 9);  // ~₹9/kWh
  const rupeesYear = rupeesDay * 365;
  const co2Year = +((baseTotal - aiTotal) * 24 * 365 * 0.71 / 1000).toFixed(0); // ~0.71 kg/kWh
  const spec =
`Tejas AI — Hall A, Chennai AI data center (live digital twin you can walk inside in VR).
Layout: ${list.length} server racks in 7 rows, hot-aisle/cold-aisle, raised-floor cold-air supply.
Compute: ${gpu.length} NVIDIA GPU racks (GB200 NVL72, HGX B200/H200, DGX H100 — ~14 kW each) + ${std.length} standard 42U racks (~6 kW each). Nameplate IT ≈ ${itNameplate} kW; at ${loadPct}% load ≈ ${itNow} kW.
Cooling: 2× CRAC units + chiller plant + chilled-water loop; Tejas runs supply air warm with minimal airflow inside limits.
Efficiency: PUE ${aiPUE} (Tejas) vs ${basePUE} (baseline BMS) → ~${coolPct}% leaner cooling. Total draw now ≈ ${aiTotal} kW (baseline ≈ ${baseTotal} kW).
Environment: outside ~38°C (heat-wave tested to 50°C). ASHRAE recommended inlet ≤ 27°C; every rack held inside the safe band.
Autonomy: policy v3, ~93% confidence, ~12,840 learned control steps.
Predictive maintenance: ${faulted ? faulted.name : 'GPU-16'} flagged — restricted airflow from a clogged CRAC-2 MERV-13 intake filter and a worn rear fan tray, running ~3°C above what its load predicts. Drafted work order, ~25 min fix. Rack internals: 48V busbar, PSU 3 kW ×6, GPU trays, rear fan tray, MERV-13 intake filter.
Savings: ≈ ₹${rupeesDay.toLocaleString('en-IN')}/day, ₹${rupeesYear.toLocaleString('en-IN')}/yr, ~${co2Year} t CO₂/yr avoided.`;
  return {
    mode: 'Tejas AI (autonomous)', Tamb: 38, loadPct,
    aiPUE, basePUE, aiTotal, baseTotal, aiCool, baseCool, coolPct,
    autonomy: 'policy v3, ~93% confidence, holding every rack in the ASHRAE band at least energy',
    rupeesDay, rupeesYear, co2Year,
    hottest: hottest && hottest.name, hottestTemp: hottest && +(hottest.temp ?? hottest.base ?? 0).toFixed(1),
    faultRack: faulted && faulted.name,
    alerts: faulted ? [`${faulted.name} — restricted airflow, service drafted`] : [],
    spec,
  };
}

// Add deep, rack-specific detail when the user opened the assistant from a rack.
function assistantContext(g) {
  const ctx = siteContext();
  if (!g || !g.userData.rack) return ctx;
  const rk = g.userData.rack;
  const isGpu = String(rk.name).startsWith('GPU');
  const air = Math.round((rk.faulted ? 0.55 : 1) * (isGpu ? 920 : 520));
  const status = rk.faulted ? 'SERVICE NEEDED (restricted airflow)' : ((rk.temp ?? rk.base) > 27 ? 'warm' : 'healthy, in the safe band');
  ctx.spec += `

USER IS INSPECTING RACK ${rk.name} — answer in depth about THIS rack:
- type: ${isGpu ? gpuModelFor(rk.name) + ' GPU rack' : 'standard 42U rack'}
- inlet temp ≈ ${(rk.temp ?? rk.base ?? 0).toFixed(1)}°C ; IT load ≈ ${(rk.load ?? 0).toFixed(1)} kW ; airflow ≈ ${air} CFM ; vibration ${rk.faulted ? '4.9 (high)' : '~1.5'} mm/s
- status: ${status}
- internals: 48V busbar, PSU 3 kW ×6, ${isGpu ? 'GPU trays' : 'compute trays'}, rear fan tray, CRAC-2 MERV-13 intake filter
- ${rk.faulted
    ? 'ROOT CAUSE: clogged MERV-13 intake filter + worn rear fan tray → ~45% airflow loss. EXACT FIX (~25 min): swap the CRAC-2 intake filter and replace the rear fan tray; the rack then returns to the safe band (turns blue / corrected).'
    : 'no open faults; running nominally.'}
Cover its specs, the issue, the root cause, the exact correction steps, and the impact of fixing it.`;
  ctx.hottest = rk.name;
  ctx.hottestTemp = +(rk.temp ?? rk.base ?? 0).toFixed(1);
  return ctx;
}

// ---- speech: recognition (push-to-talk) + synthesis (spoken replies) -------
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let recog = null, listening = false, sendOnEnd = false;
function ensureRecog() {
  if (recog || !SR) return recog;
  recog = new SR();
  recog.lang = 'en-IN'; recog.interimResults = true; recog.continuous = false; recog.maxAlternatives = 1;
  recog.onresult = (e) => {
    let txt = '';
    for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript;
    $('asInput').value = txt;
  };
  recog.onerror = (e) => { listening = false; sendOnEnd = false; micUI(); setState(e.error === 'not-allowed' ? 'mic permission denied — type instead' : 'voice error — type instead'); };
  recog.onend = () => {
    const wasSending = sendOnEnd; listening = false; sendOnEnd = false; micUI();
    const txt = $('asInput').value.trim();
    if (wasSending && txt) askSend(txt); else if (!txt) setState('');
  };
  return recog;
}
function startListening() {
  const r = ensureRecog(); if (!r) { setState('voice not supported here — type your question'); return; }
  if (window.speechSynthesis) window.speechSynthesis.cancel();   // don't transcribe our own voice
  $('asInput').value = '';
  try { r.start(); listening = true; sendOnEnd = false; micUI(); setState('● Listening… tap mic again to send'); }
  catch { /* already started */ }
}
function stopListening(send) { sendOnEnd = !!send; try { recog && recog.stop(); } catch {} }
function micUI() {
  const m = $('asMic'); m.classList.toggle('live', listening); m.textContent = listening ? '■' : '🎙️';
  $('asState').classList.toggle('live', listening);
}

let ttsOn = true;
function speak(text) {
  if (!ttsOn || !('speechSynthesis' in window) || !text) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-IN'; u.rate = 1.02; u.pitch = 1.0;
    speechSynthesis.speak(u);
  } catch {}
}

// ---- transcript + send -----------------------------------------------------
function setState(t) { $('asState').textContent = t || ''; }
function addMsg(kind, text) {
  const el = document.createElement('div');
  el.className = 'as-msg ' + kind;
  el.textContent = text;
  $('asLog').appendChild(el);
  $('asLog').scrollTop = $('asLog').scrollHeight;
  return el;
}
function setBrain(source) {
  const b = $('asBrain');
  b.textContent = source === 'openai' ? 'OpenAI' : source === 'ollama' ? 'Ollama' : 'local brain';
  b.classList.toggle('bad', source === 'local');
}
let asRackG = null;            // rack the assistant is focused on (deep context)
let sending = false;
async function askSend(text) {
  text = (text || '').trim();
  if (!text || sending) return;
  sending = true;
  addMsg('me', text);
  $('asInput').value = '';
  setState('Tejas is thinking…');
  const think = addMsg('ai think', '…');
  let res;
  try { res = await askBrain(text, assistantContext(asRackG)); }
  catch { res = { reply: '', source: 'local' }; }
  think.remove();
  const reply = res.reply || 'I could not reach the brain. Check the OpenAI key / network, or ask me again.';
  addMsg('ai', reply);
  setBrain(res.source);
  setState('');
  speak(reply);
  sending = false;
}

// ---- open / close the assistant screen -------------------------------------
const AS_CHIPS = [
  'How big is this data center?',
  'How much power are we using?',
  'Which rack needs service and why?',
  'What is the PUE and how much are we saving?',
  'How do I fix GPU-16?',
];
function fillChips() {
  const box = $('asChips'); box.innerHTML = '';
  for (const c of AS_CHIPS) {
    const b = document.createElement('button');
    b.className = 'as-chip'; b.textContent = c;
    b.onclick = () => askSend(c);
    box.appendChild(b);
  }
}
function openAssistant(g = null) {
  asRackG = g;
  const rk = g && g.userData.rack;
  $('asTitle').textContent = rk ? `Ask about ${rk.name}` : 'Tejas Assistant';
  $('asSub').textContent = rk ? 'deep detail on this rack · voice or text' : 'knows the whole twin · voice or text';
  $('assistant').classList.add('open');
  $('askToggle').classList.add('on');
  $('info').style.display = 'none';
  if (!$('asLog').children.length) {
    addMsg('ai', rk
      ? `Ask me anything about ${rk.name} — its specs, the fault, or the exact fix.`
      : "Hi! I'm Tejas. Ask me about this data center — its size, power, efficiency, or the rack that needs service. Tap the mic to talk.");
  }
  setState(SR ? '' : 'voice not supported on this browser — type your question');
}
function closeAssistant() {
  if (listening) stopListening(false);
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  $('assistant').classList.remove('open');
  $('askToggle').classList.remove('on');
}

// wiring
$('askToggle').addEventListener('click', () => $('assistant').classList.contains('open') ? closeAssistant() : openAssistant(null));
$('asBack').addEventListener('click', closeAssistant);
$('iAsk').addEventListener('click', () => openAssistant(lastInfoG));
$('asSend').addEventListener('click', () => { if (listening) stopListening(true); else askSend($('asInput').value); });
$('asInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') askSend($('asInput').value); });
$('asMic').addEventListener('click', () => { if (listening) stopListening(true); else startListening(); });
if (!SR) $('asMic').setAttribute('disabled', '');
// Press "T" anywhere to talk: opens the assistant if needed, then toggles
// listening (tap once to talk, again to send). Ignored while typing.
document.addEventListener('keydown', (e) => {
  if (e.repeat || (e.key !== 't' && e.key !== 'T')) return;
  const el = e.target;
  if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
  e.preventDefault();
  if (!$('assistant').classList.contains('open')) openAssistant(null);
  if (listening) stopListening(true); else startListening();
});
fillChips();
// reflect the live brain on load (OpenAI key present?)
fetch('/api/health').then(r => r.json()).then(h => setBrain(h.brain)).catch(() => setBrain('local'));

// ===========================================================================
//  MAIN LOOP
// ===========================================================================
const fwd = new THREE.Vector3(), right = new THREE.Vector3(), tmpQ = new THREE.Euler();
let prev = performance.now(), pickT = 0, running = false;

function frame(now) {
  if (!running) return;
  const dt = Math.min(0.05, (now - prev) / 1000); prev = now;

  // orientation
  camera.quaternion.setFromEuler(tmpQ.set(pitch, yaw, 0, 'YXZ'));

  // movement relative to facing (flatten forward to the floor plane)
  camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize();
  right.set(fwd.z, 0, -fwd.x);            // perpendicular, on the floor
  const speed = 4.2;
  pos.addScaledVector(fwd, -joy.y * speed * dt);
  pos.addScaledVector(right, joy.x * speed * dt);
  pos.y += vy * dt;

  // keep the player inside the hall
  pos.x = Math.max(-BOUND.x, Math.min(BOUND.x, pos.x));
  pos.z = Math.max(BOUND.zMin, Math.min(BOUND.zMax, pos.z));
  pos.y = Math.max(BOUND.yMin, Math.min(BOUND.yMax, pos.y));
  camera.position.copy(pos);

  const t = now / 1000;
  if (TYPE === 'datacenter') {
    // racks: temperature drift + faulted pulse + LED
    for (const g of racks) {
      const rk = g.userData.rack;
      rk.temp = rk.base + Math.sin(t * 0.6 + g.position.z) * 0.5 + (rk.faulted ? 3.2 : 0);
      tempColor(rk.temp, tmpC);
      rk.faceMat.emissive.copy(tmpC);
      const hot = Math.max(0, Math.min(1, (rk.temp - 22) / 12));
      rk.faceMat.emissiveIntensity = (0.55 + hot * 1.2) * (rk.faulted ? 1 + 0.5 * Math.sin(t * 6) : 1);
      rk.led.material.color.copy(tmpC);
    }
    if (airGeo) {
      const pa = airGeo.attributes.position.array;
      for (let i = 0; i < PN; i++) { pa[i * 3 + 1] += dt * 0.9; if (pa[i * 3 + 1] > 3.6) pa[i * 3 + 1] = 0; }
      airGeo.attributes.position.needsUpdate = true;
    }
  } else if (sinks) {
    // factory / nuclear / geothermal / solar: machines, workers, AGVs, steam…
    animatePlant(sinks, dt, t, true);
  }

  // reticle pick (throttled)
  if ((pickT += dt) > 0.12) { pickT = 0; pickCenter(); }

  render();
  requestAnimationFrame(frame);
}

function render() {
  if (!vrMode) { renderer.render(scene, camera); return; }
  // cardboard split-screen
  camera.updateMatrixWorld();
  stereo.update(camera);
  const w = renderer.getSize(new THREE.Vector2()).x, h = renderer.getSize(new THREE.Vector2()).y;
  renderer.setScissorTest(true);
  renderer.setScissor(0, 0, w / 2, h); renderer.setViewport(0, 0, w / 2, h);
  renderer.render(scene, stereo.cameraL);
  renderer.setScissor(w / 2, 0, w / 2, h); renderer.setViewport(w / 2, 0, w / 2, h);
  renderer.render(scene, stereo.cameraR);
  renderer.setScissorTest(false);
  renderer.setViewport(0, 0, w, h);
}

// pause when tab hidden (perf) and resume cleanly
function start() { if (!running) { running = true; prev = performance.now(); requestAnimationFrame(frame); } }
document.addEventListener('visibilitychange', () => { if (document.hidden) running = false; else start(); });

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ---- enter ----------------------------------------------------------------
function enterTwin() {
  $('intro').style.display = 'none';
  hud('● live · walk in');
  start();
}
$('enter').addEventListener('click', enterTwin);
// deep-link straight into the walkthrough: /vr?enter=1 (skips the intro)
if (new URLSearchParams(location.search).has('enter')) enterTwin();
// render one calm frame behind the intro
render();
