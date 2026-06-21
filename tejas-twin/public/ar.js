// Tejas AI — Field AR assistant (phone).
// Two modes, both over the live camera (with a simulated-room fallback):
//   1) FIX   — navigate to the flagged machine (GPU-16) and guide the repair.
//   2) BUILD — point at ANY machine, the AI "scans the video", draws a blueprint
//              digital twin, drops sensors on it, and lets you control it live.
// The build flow is a convincing mock — no real CV — for demoing the vision.

const $ = (id) => document.getElementById(id);
const rnd = (a, b) => a + Math.random() * (b - a);

// ---- FIX scenario (the twin already flagged this) --------------------------
const WO = {
  rack: 'GPU-16', where: 'Hall A · Row 2',
  fault: 'Restricted airflow — clogged CRAC-2 filter + worn rear fan-tray bearing',
  degradingMonths: 14, extraTemp: 3.4, wasteYearRs: 827820,
  parts: ['CRAC-2 air filter (MERV-13) ×1', 'Rear fan tray (4-fan, 120 mm) ×1', 'Blanking panels 6U ×6'],
  steps: [
    'Power-isolate the rear fan tray on GPU-16',
    'Swap the CRAC-2 intake filter',
    'Replace the rear fan tray (the ringed part)',
    'Fit blanking panels over the 6U gap',
  ],
};

let stage = 'intro', locked = false, autoLockTimer = null, doneSteps = 0;
let camReady = false;

// ---- camera (or simulated room) -------------------------------------------
async function initCamera() {
  if (camReady) return;
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw 0;
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    $('video').srcObject = stream; await $('video').play(); camReady = true;
  } catch {
    $('video').style.display = 'none';
    $('simRoom').style.display = 'block';
    const wrap = $('simRacks');
    if (!wrap.childElementCount) for (let i = 0; i < 9; i++) {
      const d = document.createElement('div'); d.className = 'rk' + (i === 5 ? ' hot' : ''); wrap.appendChild(d);
    }
    camReady = true;
  }
}

// ---- stage visibility ------------------------------------------------------
function setStage(s) {
  stage = s;
  const scanModes = (s === 'scan' || s === 'buildscan');
  $('reticle').style.display = scanModes ? 'block' : 'none';
  $('scan').style.display = scanModes ? 'block' : 'none';
  $('nav').style.display = (s === 'nav') ? 'block' : 'none';
  $('hint').textContent =
    s === 'scan' ? 'Point at the machine and tap it (a bottle works too) — Tejas will lock on.'
    : s === 'buildscan' ? 'Point at any machine and tap it — the AI will build its twin.'
    : '';
}

// =========================================================================
//  INTRO — choose a mode
// =========================================================================
function showIntro() {
  setStage('intro');
  const card = $('card'); card.className = 'card';
  setPill('ok', '📱 TEJAS FIELD AR');
  $('cTitle').textContent = 'What do you want to do?';
  $('cSub').textContent = 'Fix the machine Tejas flagged — or point your camera at ANY object and watch the AI build its live twin.';
  $('cBody').innerHTML = `<div class="mode-btns">
      <button class="btn" id="mFix">🔧 Fix the flagged machine · GPU-16</button>
      <button class="btn ghost" id="mBuild">✨ Build a twin from the camera</button>
    </div>`;
  $('cBtn').style.display = 'none';
  $('mFix').onclick = async () => { await initCamera(); goNav(); };
  $('mBuild').onclick = async () => { await initCamera(); goBuildScan(); };
}

// =========================================================================
//  MODE 1 — FIX (navigate + guided repair)
// =========================================================================
function goNav() {
  setStage('nav');
  $('tbTarget').textContent = '● navigating';
  cardPlain('🧭 NAVIGATION', 'Walking you to ' + WO.rack, WO.where + ' — follow the arrow.');
  let d = 18;
  const t = setInterval(() => { d -= 1; $('navDist').textContent = Math.max(0, d) + ' m'; if (d <= 0) { clearInterval(t); goScan(); } }, 200);
}
function goScan() {
  setStage('scan');
  $('tbTarget').textContent = '● searching';
  cardPlain('🔍 LOCATE', 'Find ' + WO.rack, 'Tap the machine to lock on. (Auto-locks shortly.)');
  clearTimeout(autoLockTimer);
  autoLockTimer = setTimeout(() => { if (!locked) doLock(innerWidth / 2, innerHeight * 0.45); }, 4200);
}
function doLock(x, y) {
  if (locked) { placeLock(x, y); return; }
  locked = true; clearTimeout(autoLockTimer); setStage('locked'); placeLock(x, y);
  $('tbTarget').textContent = '● ' + WO.rack + ' LOCKED';
  navigator.vibrate && navigator.vibrate(60);
  const card = $('card'); card.className = 'card bad';
  setPill('bad', '⚠ FAULT IDENTIFIED');
  $('cTitle').textContent = WO.rack + ' · airflow fault';
  $('cSub').innerHTML = `Degrading <b>${WO.degradingMonths} months</b> — inlet ~${WO.extraTemp}°C above what its load explains. ${WO.fault}.`;
  $('cBody').innerHTML = `<div class="parts">Est. waste if ignored: <b>₹${WO.wasteYearRs.toLocaleString('en-IN')}/yr</b></div>`;
  showBtn('Show me the fix →', goFix);
}
function placeLock(x, y) {
  let el = $('lockEl');
  if (!el) {
    el = document.createElement('div'); el.id = 'lockEl'; el.className = 'lock bad';
    el.innerHTML = `<div class="ring r3"></div><div class="ring r2"></div><div class="ring r1"></div>
      <div class="cross"></div><div class="cross h"></div><div class="tag">${WO.rack} · LOCKED</div>`;
    $('overlay').appendChild(el);
  }
  el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.display = 'block';
}
function goFix() {
  setStage('fix');
  const lock = $('lockEl');
  if (lock && !$('partRing')) {
    const lx = parseFloat(lock.style.left), ly = parseFloat(lock.style.top);
    const p = document.createElement('div'); p.id = 'partRing'; p.className = 'lock';
    p.style.left = lx + 'px'; p.style.top = (ly + 92) + 'px';
    p.innerHTML = `<div class="ring r2"></div><div class="ring r1"></div><div class="tag">Replace this — rear fan tray</div>`;
    $('overlay').appendChild(p);
  }
  renderSteps(); showBtn('Mark next step done', nextStep);
}
function renderSteps() {
  setPill('ok', '🔧 GUIDED FIX · ~25 min');
  $('cTitle').textContent = WO.rack + ' · how to correct it';
  $('cSub').textContent = 'Follow the steps. The ringed part is the rear fan tray.';
  $('cBody').innerHTML = '<ul class="steps">' + WO.steps.map((s, i) =>
    `<li class="${i < doneSteps ? 'done' : ''}"><span class="n">${i < doneSteps ? '✓' : i + 1}</span><span class="t">${s}</span></li>`).join('') +
    '</ul><div class="parts">Bring: <b>' + WO.parts.join('</b>, <b>') + '</b></div>';
}
function nextStep() {
  doneSteps++;
  if (doneSteps >= WO.steps.length) showBtn('Verify & close ticket ✓', () => { $('success').style.display = 'flex'; navigator.vibrate && navigator.vibrate([40, 60, 120]); });
  renderSteps();
}

// =========================================================================
//  MODE 2 — BUILD A TWIN FROM CAMERA
// =========================================================================
const MACHINES = [
  { name: 'Induction Motor', model: 'BL-280', sensors: [['Temp', '°C', 46, 95], ['Vibration', 'mm/s', 2.1, 75], ['RPM', '', 1480, 20], ['Load', '%', 62, 55], ['Current', 'A', 38, 80]] },
  { name: 'Centrifugal Pump', model: 'CP-160', sensors: [['Temp', '°C', 52, 92], ['Vibration', 'mm/s', 3.0, 72], ['Pressure', 'bar', 4.2, 25], ['Flow', 'L/s', 18, 55], ['RPM', '', 2950, 18]] },
  { name: 'CNC Spindle', model: 'CNC-V7', sensors: [['Temp', '°C', 41, 96], ['Vibration', 'mm/s', 1.4, 70], ['RPM', '', 8200, 22], ['Load', '%', 48, 55], ['Power', 'kW', 9.5, 80]] },
];
let twin = null;      // { machine, power, speed, sensors:[{el,...}] , timer }

function goBuildScan() {
  setStage('buildscan');
  $('tbTarget').textContent = '● scan a machine';
  cardPlain('✨ BUILD A TWIN', 'Create a digital twin', 'Point at any machine and tap it. The AI reconstructs it from the video — no install, no schematic.');
}

const BLUEPRINT_SVG = `<svg width="200" height="150" viewBox="0 0 200 150">
  <rect class="bp-fill" x="34" y="34" width="132" height="78" rx="8"/>
  <rect class="bp-line" x="150" y="54" width="34" height="40" rx="4"/>
  <circle class="bp-line" cx="92" cy="73" r="34"/>
  <circle class="bp-line" cx="92" cy="73" r="15"/>
  <circle class="bp-line" cx="92" cy="73" r="4"/>
  <line class="bp-line" x1="92" y1="39" x2="92" y2="49"/><line class="bp-line" x1="92" y1="97" x2="92" y2="107"/>
  <line class="bp-line" x1="58" y1="73" x2="68" y2="73"/><line class="bp-line" x1="116" y1="73" x2="126" y2="73"/>
  <rect class="bp-line" x="44" y="112" width="112" height="14" rx="3"/>
  <circle class="bp-line" cx="44" cy="44" r="3.5"/><circle class="bp-line" cx="156" cy="44" r="3.5"/>
  <circle class="bp-line" cx="44" cy="102" r="3.5"/><circle class="bp-line" cx="156" cy="102" r="3.5"/>
  <line class="bp-dim" x1="34" y1="20" x2="166" y2="20"/>
  <line class="bp-dim" x1="34" y1="16" x2="34" y2="24"/><line class="bp-dim" x1="166" y1="16" x2="166" y2="24"/>
  <text x="100" y="14" fill="#2ee6a6" font-size="9" text-anchor="middle" font-family="monospace">1.20 m</text>
</svg>`;

let building = false;

// Grab a real frame from the live camera (null when on the simulated view).
function captureFrame() {
  const v = $('video');
  if (!camReady || v.style.display === 'none' || !v.videoWidth) return null;
  const cw = 640, ch = Math.round(cw * (v.videoHeight / v.videoWidth)) || 480;
  const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
  cv.getContext('2d').drawImage(v, 0, 0, cw, ch);
  try { return cv.toDataURL('image/jpeg', 0.7); } catch { return null; }
}

// Ask the server brain (OpenAI / Ollama vision) what the object is.
async function identify(dataUrl) {
  try {
    const res = await fetch('/api/vision', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ image: dataUrl }),
    });
    const d = await res.json();
    if (d && d.ok && d.name) return d;
  } catch {}
  return null;
}

// Turn a sensor label into a believable live-value model.
function sensorSpec(label, unit) {
  const L = (label || '').toLowerCase();
  let base = 50, sens = 55;
  if (/temp|heat/.test(L)) { base = 46; sens = 70; }
  else if (/vib|shak/.test(L)) { base = 2.2; sens = 4.5; }
  else if (/rpm|speed/.test(L)) { base = 1480; sens = 9e9; }
  else if (/load|util/.test(L)) { base = 62; sens = 92; }
  else if (/current|amp/.test(L)) { base = 38; sens = 60; }
  else if (/power|watt|kw/.test(L)) { base = 9.5; sens = 9e9; }
  else if (/press/.test(L)) { base = 4.2; sens = 9e9; }
  else if (/flow/.test(L)) { base = 18; sens = 9e9; }
  else if (/level|fill|volume/.test(L)) { base = 72; sens = 9e9; }
  else if (/weight|mass/.test(L)) { base = 480; sens = 9e9; }
  else if (/charge|batt/.test(L)) { base = 86; sens = 9e9; }
  else if (/humid/.test(L)) { base = 46; sens = 60; }
  return { label, unit: unit || '', base, sens };
}

// Unify the AI result (or a mock) into one twin descriptor.
function normalize(ai) {
  if (ai && ai.name) {
    let sensors = (ai.sensors || []).slice(0, 5).map(s => sensorSpec(s.label, s.unit));
    if (!sensors.length) sensors = MACHINES[0].sensors.slice(0, 4).map(s => sensorSpec(s[0], s[1]));
    return {
      name: ai.name, model: ai.model || 'AI-01', summary: ai.summary || '',
      parts: ai.parts || [], steps: ai.steps || [], sensors,
      confidence: typeof ai.confidence === 'number' ? ai.confidence : 0.9,
      brain: ai.brain || 'ai', source: 'ai',
    };
  }
  const m = MACHINES[Math.floor(rnd(0, MACHINES.length))];
  return {
    name: m.name, model: m.model, summary: 'Reconstructed from the camera video.',
    parts: [], steps: [], sensors: m.sensors.map(s => sensorSpec(s[0], s[1])),
    confidence: 0.86, brain: 'local', source: 'mock',
  };
}

async function goBuildAt(x, y) {
  if (twin || building) return;
  building = true;
  setStage('building');
  navigator.vibrate && navigator.vibrate(40);

  // 1) draw blueprint over the tapped object
  const bp = $('blueprint'); bp.style.left = x + 'px'; bp.style.top = y + 'px';
  bp.style.display = 'block'; bp.innerHTML = BLUEPRINT_SVG;
  $('tbTarget').textContent = '● scanning…';

  // 2) capture the frame and start the REAL vision call
  setPill('ok', '✨ AI RECONSTRUCTION');
  $('cTitle').textContent = 'Building digital twin…';
  $('cSub').textContent = 'Tejas AI is looking at the object through your camera.';
  $('cBody').innerHTML = `<div class="prog"><i id="pBar"></i></div><div class="scanwords" id="scanW"></div>`;
  $('cBtn').style.display = 'none';

  const frame = captureFrame();
  let result, done = false;
  (frame ? identify(frame) : Promise.resolve(null))
    .then(r => { result = r; done = true; })
    .catch(() => { result = null; done = true; });

  // 3) progress bar creeps to 90% until the AI answers, then completes
  const words = ['looking at the object…', 'estimating geometry…', 'identifying parts…', 'choosing sensors…', 'writing the how-to…'];
  let p = 0, wi = -1;
  const t = setInterval(() => {
    const ceiling = done ? 100 : 90;
    p = Math.min(ceiling, p + rnd(5, 11));
    $('pBar').style.width = p + '%';
    const nw = Math.min(words.length - 1, Math.floor(p / 20));
    if (nw !== wi) { wi = nw; $('scanW').textContent = '› ' + words[wi]; }
    if (p >= 100) { clearInterval(t); twinReady(normalize(result), x, y); }
  }, 180);
}

function twinReady(m, x, y) {
  building = false;
  setStage('twin');
  $('tbTarget').textContent = '● ' + (m.model || m.name) + ' · LIVE TWIN';
  // place sensor nodes around the blueprint
  const layer = $('sensorLayer'); layer.innerHTML = '';
  const spots = [[-95, -55], [95, -45], [-100, 40], [100, 45], [0, 80]];
  twin = { machine: m, power: true, speed: 60, sensors: [] };
  m.sensors.forEach((s, i) => {
    const [dx, dy] = spots[i % spots.length];
    const el = document.createElement('div'); el.className = 'sensor';
    el.style.left = (x + dx) + 'px'; el.style.top = (y + dy) + 'px';
    el.innerHTML = `<div class="dot"></div><div class="chip">${escapeHtml(s.label)} <span class="v">—</span>${s.unit ? ' ' + escapeHtml(s.unit) : ''}</div>`;
    layer.appendChild(el);
    twin.sensors.push({ el, label: s.label, unit: s.unit, base: s.base, sens: s.sens });
  });

  // control panel + AI how-to (the "open it from the top" guidance)
  const brainTag = m.source === 'ai'
    ? `✅ TWIN CREATED · ${Math.round(m.confidence * 100)}% · ${m.brain}`
    : '✅ TWIN CREATED';
  setPill('ok', brainTag);
  $('cTitle').textContent = m.name + (m.model ? ' · ' + m.model : '');
  $('cSub').textContent = m.summary || ('Digital twin built from the camera. ' + m.sensors.length + ' virtual sensors attached.');
  const howto = (m.steps && m.steps.length)
    ? `<div class="howto"><div class="howto-h">🧭 How to use it</div><ol>${m.steps.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ol></div>` : '';
  const parts = (m.parts && m.parts.length)
    ? `<div class="parts">Detected parts: <b>${m.parts.map(escapeHtml).join('</b>, <b>')}</b></div>` : '';
  $('cBody').innerHTML =
    `${howto}
     <div class="ctrlrow"><button class="toggle" id="pwr">● RUNNING</button>
       <span>Speed</span><input type="range" id="spd" min="0" max="100" value="60"><b id="spdV" style="color:var(--ink)">60%</b></div>
     ${parts}
     <div class="parts" style="margin-top:8px">Saved to your fleet — Tejas now monitors &amp; can control this. <b>This is how anything becomes a twin.</b></div>`;
  $('pwr').onclick = () => {
    twin.power = !twin.power;
    $('pwr').className = 'toggle' + (twin.power ? '' : ' off');
    $('pwr').textContent = twin.power ? '● RUNNING' : '○ STOPPED';
  };
  $('spd').oninput = (e) => { twin.speed = +e.target.value; $('spdV').textContent = twin.speed + '%'; };
  showBtn('＋ Build another twin', resetBuild);
  if (!twin.timer) twin.timer = setInterval(tickSensors, 650);
}

function tickSensors() {
  if (!twin) return;
  const f = twin.power ? (0.4 + twin.speed / 100 * 0.9) : 0;
  for (const s of twin.sensors) {
    const L = (s.label || '').toLowerCase();
    let val;
    if (/rpm|speed/.test(L)) val = twin.power ? Math.round(s.base * (twin.speed / 100) + rnd(-30, 30)) : 0;
    else if (/temp|heat/.test(L)) val = (twin.power ? 28 + s.base * f * 0.5 + rnd(-1, 1) : 27 + rnd(-1, 1)).toFixed(1);
    else if (/level|fill|volume|charge|batt|humid/.test(L)) val = Math.round(s.base + rnd(-1.5, 1.5)); // slow-moving, not power-driven
    else if (/load|power|current|flow|watt|kw/.test(L)) val = (twin.power ? s.base * f + rnd(-2, 2) : 0).toFixed(/kw|power/.test(L) ? 1 : 0);
    else val = (twin.power ? s.base * f + rnd(-0.3, 0.3) : 0).toFixed(1);
    s.el.querySelector('.v').textContent = val;
    s.el.classList.toggle('warn', +val > s.sens);
  }
}

const escapeHtml = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function resetBuild() {
  if (twin && twin.timer) clearInterval(twin.timer);
  twin = null; building = false;
  $('blueprint').style.display = 'none'; $('blueprint').innerHTML = '';
  $('sensorLayer').innerHTML = '';
  goBuildScan();
}

// ---- small card helpers ----------------------------------------------------
function cardPlain(pill, title, sub) {
  $('card').className = 'card'; setPill('ok', pill);
  $('cTitle').textContent = title; $('cSub').textContent = sub; $('cBody').innerHTML = ''; $('cBtn').style.display = 'none';
}
function setPill(kind, txt) { const p = $('card').querySelector('.pill'); p.className = 'pill ' + kind; p.textContent = txt; }
function showBtn(txt, fn) { const b = $('cBtn'); b.style.display = 'block'; b.textContent = txt; b.onclick = fn; }

// ---- input: tap -----------------------------------------------------------
$('stage').addEventListener('click', (e) => {
  if (e.target.closest('.card') || e.target.closest('.success')) return;
  if (stage === 'scan' || stage === 'locked') doLock(e.clientX, e.clientY);
  else if (stage === 'buildscan') goBuildAt(e.clientX, e.clientY);
});

// ---- boot ------------------------------------------------------------------
showIntro();
