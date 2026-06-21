// Tejas AI — Twin Studio. An open canvas to design a digital twin: search and
// drag components, or describe it in a prompt and let the AI lay it out. Reads
// your location + live wind so cooling can be placed sensibly. Activate -> a
// live, controllable factory twin.

const $ = (id) => document.getElementById(id);

// ---- component library -----------------------------------------------------
const LIB = [
  { cat: 'Machines', items: [
    { t: 'compressor', name: 'Compressor', icon: '🛠️', param: ['Speed', '%', 60], kw: ['compressor', 'compressors'] },
    { t: 'chiller', name: 'Chiller', icon: '❄️', param: ['CHW setpoint', '°C', 7], kw: ['chiller', 'chillers'] },
    { t: 'motor', name: 'Motor', icon: '⚙️', param: ['Speed', '%', 60], kw: ['motor', 'motors'] },
    { t: 'pump', name: 'Pump', icon: '🌀', param: ['Flow', '%', 55], kw: ['pump', 'pumps'] },
    { t: 'cnc', name: 'CNC Machine', icon: '🏭', param: ['Load', '%', 50], kw: ['cnc', 'mill', 'lathe'] },
    { t: 'conveyor', name: 'Conveyor', icon: '📦', param: ['Speed', '%', 40], kw: ['conveyor', 'belt'] },
  ]},
  { cat: 'Cooling', items: [
    { t: 'crac', name: 'CRAC Unit', icon: '🌬️', param: ['Supply air', '°C', 18], kw: ['crac', 'crah', 'ahu'] },
    { t: 'cooler', name: 'Evaporator Cooler', icon: '🧊', param: ['Duty', '%', 70], kw: ['cooler', 'coolers', 'evaporator'] },
    { t: 'fan', name: 'Exhaust Fan', icon: '💨', param: ['Speed', '%', 60], kw: ['fan', 'fans', 'exhaust'] },
    { t: 'ac', name: 'AC Unit', icon: '🆒', param: ['Setpoint', '°C', 22], kw: ['ac', 'air conditioner', 'hvac'] },
  ]},
  { cat: 'Sensors', items: [
    { t: 'temp', name: 'Temp Sensor', icon: '🌡️', param: null, kw: ['temp', 'temperature'] },
    { t: 'vib', name: 'Vibration Sensor', icon: '📈', param: null, kw: ['vibration', 'vibe'] },
    { t: 'flow', name: 'Flow Sensor', icon: '💧', param: null, kw: ['flow'] },
    { t: 'hum', name: 'Humidity Sensor', icon: '💦', param: null, kw: ['humidity', 'rh'] },
  ]},
  { cat: 'Site', items: [
    { t: 'land', name: 'Land / Plot', icon: '🟩', param: ['Size', 'm', 40], kw: ['land', 'plot', 'site', 'ground', 'floor', 'foundation'] },
    { t: 'room', name: 'Room / Zone', icon: '🏠', param: ['Area', 'm²', 120], kw: ['room', 'zone', 'hall'] },
    { t: 'rack', name: 'Rack', icon: '🗄️', param: ['Load', '%', 60], kw: ['rack', 'racks', 'server'] },
    { t: 'door', name: 'Door', icon: '🚪', param: null, kw: ['door'] },
  ]},
];
const ALL = LIB.flatMap(g => g.items);
const findDef = (t) => ALL.find(i => i.t === t);

// ---- palette ---------------------------------------------------------------
function renderPalette(q = '') {
  const ql = q.toLowerCase();
  const host = $('paletteList'); host.innerHTML = '';
  for (const g of LIB) {
    const items = g.items.filter(i => !ql || i.name.toLowerCase().includes(ql) || i.kw.some(k => k.includes(ql)));
    if (!items.length) continue;
    const h = document.createElement('div'); h.className = 'pal-cat'; h.textContent = g.cat; host.appendChild(h);
    for (const i of items) {
      const b = document.createElement('div'); b.className = 'pal-item'; b.draggable = true;
      b.innerHTML = `<span class="pi-ic">${i.icon}</span><span>${i.name}</span>`;
      b.addEventListener('click', () => addNode(i.t));
      b.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', i.t));
      host.appendChild(b);
    }
  }
}
$('paletteSearch').addEventListener('input', e => renderPalette(e.target.value));

// ---- canvas + nodes --------------------------------------------------------
const canvas = $('canvas');
let nodes = [], seq = 0, selected = null, cascade = 0;

function addNode(t, x, y, opts = {}) {
  const def = findDef(t); if (!def) return null;
  if (x == null) { x = 80 + (cascade % 6) * 40; y = 80 + (cascade % 6) * 36; cascade++; }
  const node = { id: ++seq, t, name: def.name, icon: def.icon, param: def.param ? [...def.param] : null, x, y };
  const isBase = (t === 'land' || t === 'room');
  const el = document.createElement('div'); el.className = 'node' + (t === 'land' ? ' land' : isBase ? ' base' : ''); el.dataset.id = node.id;
  el.style.left = x + 'px'; el.style.top = y + 'px';
  if (opts.w) { el.style.width = opts.w + 'px'; node.w = opts.w; }
  if (opts.h) { el.style.height = opts.h + 'px'; node.h = opts.h; }
  if (t === 'land') { node.w = node.w || 400; node.h = node.h || 260; }
  el.innerHTML = `<div class="n-ic">${def.icon}</div><div class="n-lbl">${def.name}</div>`;
  // the base layers (land/room) sit behind the machines placed on them
  canvas.insertBefore(el, isBase ? canvas.firstChild.nextSibling : null);
  node.el = el; nodes.push(node);
  wireNode(node); select(node);
  if (!isBase) $('canvasHint').style.display = 'none';
  $('compCount').textContent = nodes.length;
  return node;
}

function wireNode(node) {
  const el = node.el; let drag = false, sx = 0, sy = 0, ox = 0, oy = 0, moved = 0;
  el.addEventListener('pointerdown', e => {
    drag = true; moved = 0; sx = e.clientX; sy = e.clientY; ox = node.x; oy = node.y;
    el.setPointerCapture(e.pointerId); select(node); e.stopPropagation();
  });
  el.addEventListener('pointermove', e => {
    if (!drag) return; const dx = e.clientX - sx, dy = e.clientY - sy; moved += Math.abs(dx) + Math.abs(dy);
    node.x = Math.max(0, ox + dx); node.y = Math.max(0, oy + dy);
    el.style.left = node.x + 'px'; el.style.top = node.y + 'px';
  });
  el.addEventListener('pointerup', e => { drag = false; try { el.releasePointerCapture(e.pointerId); } catch {} });
}

function select(node) {
  selected = node;
  nodes.forEach(n => n.el.classList.toggle('sel', n === node));
  const def = node;
  $('propCard').hidden = false;
  $('propName').textContent = `${node.icon} ${node.name}`;
  if (node.param) {
    $('propParamLbl').firstChild ? $('propParamLbl').textContent = node.param[0] : null;
    $('propParam').style.display = ''; $('propParam').value = clampRange(node.param[2]);
    $('propVal').textContent = `${node.param[2]} ${node.param[1]}`;
  } else {
    $('propParam').style.display = 'none'; $('propVal').textContent = 'No adjustable parameter';
    $('propParamLbl').textContent = 'Sensor';
  }
}
const clampRange = (v) => Math.max(0, Math.min(100, v));
$('propParam').addEventListener('input', e => {
  if (!selected || !selected.param) return;
  selected.param[2] = +e.target.value; $('propVal').textContent = `${selected.param[2]} ${selected.param[1]}`;
});
$('delNode').addEventListener('click', () => {
  if (!selected) return; selected.el.remove(); nodes = nodes.filter(n => n !== selected);
  selected = null; $('propCard').hidden = true; $('compCount').textContent = nodes.length;
});
canvas.addEventListener('pointerdown', e => { if (e.target === canvas || e.target.id === 'canvasHint') { selected = null; nodes.forEach(n => n.el.classList.remove('sel')); $('propCard').hidden = true; } });

// drag-and-drop from palette
canvas.addEventListener('dragover', e => { e.preventDefault(); canvas.classList.add('drop'); });
canvas.addEventListener('dragleave', () => canvas.classList.remove('drop'));
canvas.addEventListener('drop', e => {
  e.preventDefault(); canvas.classList.remove('drop');
  const t = e.dataTransfer.getData('text/plain'); if (!t) return;
  const r = canvas.getBoundingClientRect();
  addNode(t, e.clientX - r.left - 45, e.clientY - r.top - 35);
});

// ---- prompt -> layout (AI-designed, with local fallback) -------------------
function clearNodes() {
  nodes.forEach(n => n.el.remove()); nodes = []; cascade = 0; selected = null;
  $('propCard').hidden = true; $('compCount').textContent = 0;
}

$('genBtn').addEventListener('click', async () => {
  const p = $('prompt').value.trim(); if (!p) return;
  $('genBtn').disabled = true; $('genBtn').textContent = '✨ AI is designing…';
  let comps = null, name = null;
  try {
    const d = await fetch('/api/design', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt: p }),
    }).then(r => r.json());
    if (d.ok && Array.isArray(d.components) && d.components.length) { comps = d.components; name = d.name; }
  } catch {}
  if (!comps) comps = localDesign(p);          // offline / fallback
  placeDesign(comps);
  if (!$('twinName').value) $('twinName').value = name || guessName(p);
  $('genBtn').disabled = false; $('genBtn').textContent = '✨ Generate layout';
});

// keyword fallback designer
function localDesign(p) {
  p = p.toLowerCase(); const out = {};
  for (const item of ALL) for (const k of item.kw) {
    if (p.includes(k)) { const m = p.match(new RegExp('(\\d+)\\s*' + k, 'i')); out[item.t] = (out[item.t] || 0) + (m ? Math.min(20, +m[1]) : 1); break; }
  }
  let comps = Object.entries(out).map(([type, count]) => ({ type, count }));
  if (!comps.length) {
    if (/cold stor|refriger|cold chain/.test(p)) comps = [{ type: 'room', count: 1 }, { type: 'compressor', count: 2 }, { type: 'cooler', count: 3 }, { type: 'temp', count: 2 }, { type: 'hum', count: 1 }];
    else if (/data ?cent|server|rack/.test(p)) comps = [{ type: 'room', count: 1 }, { type: 'rack', count: 8 }, { type: 'crac', count: 3 }, { type: 'chiller', count: 1 }, { type: 'temp', count: 3 }, { type: 'hum', count: 1 }];
    else comps = [{ type: 'motor', count: 2 }, { type: 'cooler', count: 1 }, { type: 'temp', count: 2 }, { type: 'vib', count: 1 }];
  }
  return comps;
}

// expand a {type,count}[] design onto a sized land plot
function placeDesign(comps) {
  clearNodes();
  const flat = [];
  for (const c of comps) {
    if (c.type === 'land') continue;
    if (!findDef(c.type)) continue;
    const n = Math.max(1, Math.min(20, c.count || 1));
    for (let i = 0; i < n; i++) flat.push(c.type);
  }
  if (!flat.length) flat.push('motor', 'cooler', 'temp');
  const cols = Math.min(6, Math.max(3, Math.ceil(Math.sqrt(flat.length))));
  const rows = Math.ceil(flat.length / cols);
  const cellW = 104, cellH = 92;
  const landW = cols * cellW + 36, landH = rows * cellH + 50;
  const cw = canvas.clientWidth || 800, ch = canvas.clientHeight || 560;
  const lx = Math.max(16, (cw - landW) / 2), ly = Math.max(16, (ch - landH) / 2);
  addNode('land', lx, ly, { w: landW, h: landH });
  flat.forEach((t, i) => { const c = i % cols, r = Math.floor(i / cols); addNode(t, lx + 20 + c * cellW, ly + 40 + r * cellH); });
  selected = null; nodes.forEach(n => n.el.classList.remove('sel')); $('propCard').hidden = true;
  $('canvasHint').style.display = 'none';
}

function guessName(p) {
  if (/cold storage|cold store|refriger/.test(p)) return 'Cold Storage Twin';
  if (/data ?cent/.test(p)) return 'Data Center Twin';
  if (/factory|plant|line|manufactur/.test(p)) return 'Factory Line Twin';
  return 'Custom Twin';
}

// ---- location + wind -------------------------------------------------------
$('locBtn').addEventListener('click', () => {
  $('locOut').textContent = 'Locating…';
  if (!navigator.geolocation) return setWeatherMock();
  navigator.geolocation.getCurrentPosition(async pos => {
    const lat = pos.coords.latitude, lon = pos.coords.longitude;
    try {
      const w = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,wind_direction_10m`).then(r => r.json());
      const c = w.current;
      setWeather(lat, lon, c.temperature_2m, c.wind_speed_10m, c.wind_direction_10m);
    } catch { setWeatherMock(lat, lon); }
  }, () => setWeatherMock(), { timeout: 8000 });
});
function setWeather(lat, lon, temp, wind, dir) {
  const compass = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(dir / 45) % 8];
  $('locOut').innerHTML = `📍 ${lat.toFixed(2)}, ${lon.toFixed(2)}<br>🌡️ ${Math.round(temp)}°C · 💨 ${Math.round(wind)} km/h from ${compass}` +
    `<br><span class="loc-tip">Cooling load tuned to climate; place exhaust downwind (${compass}).</span>`;
  $('windArrow').style.transform = `rotate(${dir + 180}deg)`;  // arrow points where wind flows TO
  $('windLabel').textContent = `wind ${Math.round(wind)} km/h ${compass}`;
  $('wind').classList.add('on');
}
function setWeatherMock(lat, lon) {
  const temp = 30 + Math.round(Math.random() * 14), wind = 6 + Math.round(Math.random() * 18), dir = Math.round(Math.random() * 359);
  setWeather(lat || 13.08, lon || 80.27, temp, wind, dir);
  $('locOut').innerHTML += '<br><span class="loc-tip">(offline — modelled climate)</span>';
}

// ---- activate --------------------------------------------------------------
$('activateBtn').addEventListener('click', async () => {
  if (!nodes.length) { $('canvasHint').style.display = 'block'; $('canvasHint').textContent = 'Add at least one component before activating.'; return; }
  const name = ($('twinName').value || '').trim() || 'Studio Twin';
  $('activateBtn').textContent = 'Activating…'; $('activateBtn').disabled = true;
  const components = nodes.map(n => ({ t: n.t, name: n.name, x: Math.round(n.x), y: Math.round(n.y), w: n.w || null, h: n.h || null, param: n.param }));
  const bounds = { w: canvas.clientWidth, h: canvas.clientHeight };
  try {
    const twin = (await fetch('/api/twins', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, type: 'factory', method: 'studio', components, bounds }),
    }).then(r => r.json())).twin;
    location.href = `/factory?id=${twin.id}&name=${encodeURIComponent(name)}`;
  } catch { $('activateBtn').textContent = '⚡ Activate twin'; $('activateBtn').disabled = false; }
});

// ---- boot ------------------------------------------------------------------
renderPalette();
// lay the land first — a base plot to build on
requestAnimationFrame(() => {
  const w = canvas.clientWidth || 700, h = canvas.clientHeight || 500;
  addNode('land', Math.max(20, w / 2 - 200), Math.max(20, h / 2 - 130));
  selected = null; nodes.forEach(n => n.el.classList.remove('sel')); $('propCard').hidden = true;
  cascade = 0;
});
