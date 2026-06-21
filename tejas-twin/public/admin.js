// Tejas AI — Admin Panel.
// Lists digital twins (data-center built-in + factory twins from the server),
// and creates new ones two ways: phone video scan (cross-device, via the API)
// or blueprint-image upload. Both run a simulated "AI reconstruction".

const $ = (id) => document.getElementById(id);

// ---- QR helper (vendored generator) ---------------------------------------
function renderQR(box, url) {
  box.innerHTML = '';
  try {
    const qr = window.qrcode(0, 'M'); qr.addData(url); qr.make();
    const img = new Image(); img.src = qr.createDataURL(6, 2); box.appendChild(img);
  } catch { box.textContent = url; }
}

async function lanBase() {
  let base = location.origin;
  try {
    const info = await fetch('/api/info').then(r => r.json());
    const ip = (info.ips || []).find(x => /^(192\.168|10\.|172\.)/.test(x)) || info.ips?.[0];
    if (ip) base = `${location.protocol}//${ip}:${info.port}`;
  } catch {}
  return base;
}

// ---- twin list ------------------------------------------------------------
let knownIds = new Set();
async function loadTwins() {
  let twins = [];
  try { twins = (await fetch('/api/twins').then(r => r.json())).twins || []; } catch {}
  // remove old injected factory cards
  document.querySelectorAll('.twin-card.factory').forEach(el => el.remove());
  const createCard = $('createCard');
  for (const t of twins) {
    knownIds.add(t.id);
    const a = document.createElement('a');
    a.className = 'twin-card factory';
    a.dataset.type = 'factory';
    a.href = `/factory?id=${t.id}&name=${encodeURIComponent(t.name)}`;
    a.innerHTML = `<div class="tc-badge fac">FACTORY</div><div class="tc-icon">🏭</div>
      <div class="tc-name">${escapeHtml(t.name)}</div>
      <div class="tc-meta"><span class="dot live"></span> Live · ${t.method === 'blueprint' ? 'from blueprint' : 'from phone scan'}</div>
      <div class="tc-stats"><span>auto-twin</span><span>live sensors</span><span>controllable</span></div>
      <div class="tc-open">Open twin →</div>`;
    createCard.parentNode.insertBefore(a, createCard);
  }
  applyFilter();
}
const escapeHtml = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---- type filter ----------------------------------------------------------
let filter = 'all';
function applyFilter() {
  document.querySelectorAll('.twin-card').forEach(c => {
    if (c.classList.contains('create')) return;
    c.style.display = (filter === 'all' || c.dataset.type === filter) ? '' : 'none';
  });
}
document.querySelectorAll('.type-tab').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.type-tab').forEach(x => x.classList.remove('active'));
  b.classList.add('active'); filter = b.dataset.type; applyFilter();
}));

// ---- create modal ---------------------------------------------------------
const modal = $('createModal');
function openCreate() { showStep('mStep1'); modal.classList.add('open'); }
function closeCreate() { modal.classList.remove('open'); stopScanPoll(); }
function showStep(id) {
  ['mStep1', 'mScanView', 'mBpView', 'mDone'].forEach(s => $(s).hidden = (s !== id));
}
$('createCard').addEventListener('click', openCreate);
$('createClose').addEventListener('click', closeCreate);
modal.addEventListener('click', e => { if (e.target === modal) closeCreate(); });
$('scanBack').addEventListener('click', () => { stopScanPoll(); showStep('mStep1'); });
$('bpBack').addEventListener('click', () => showStep('mStep1'));

let createdTwin = null;
function goDone(twin) {
  createdTwin = twin;
  $('doneName').textContent = twin.name;
  showStep('mDone');
}
$('doneOpen').addEventListener('click', () => {
  if (createdTwin) location.href = `/factory?id=${createdTwin.id}&name=${encodeURIComponent(createdTwin.name)}`;
});

// ---- method 1: phone scan -------------------------------------------------
let scanPoll = null, scanBaseline = new Set();
$('mScan').addEventListener('click', async () => {
  showStep('mScanView');
  const url = (await lanBase()) + '/scan';
  $('scanUrl').textContent = url;
  renderQR($('scanQr'), url);
  // baseline current twins, then poll for a new one created by the phone
  try { scanBaseline = new Set(((await fetch('/api/twins').then(r => r.json())).twins || []).map(t => t.id)); } catch { scanBaseline = new Set(); }
  scanPoll = setInterval(async () => {
    try {
      const twins = (await fetch('/api/twins').then(r => r.json())).twins || [];
      const fresh = twins.find(t => !scanBaseline.has(t.id));
      if (fresh) { stopScanPoll(); await loadTwins(); goDone(fresh); }
    } catch {}
  }, 1800);
});
function stopScanPoll() { if (scanPoll) { clearInterval(scanPoll); scanPoll = null; } }

// ---- method 3: open the Twin Studio ---------------------------------------
$('mStudio').addEventListener('click', () => { location.href = '/build'; });
// ---- method 4: brownfield data-center ingestion ---------------------------
$('mIngest').addEventListener('click', () => { location.href = '/ingest'; });

// ---- method 2: blueprint upload (click OR drag & drop) --------------------
$('mBlueprint').addEventListener('click', () => showStep('mBpView'));
function handleBpFile(f) {
  if (!f || !/^image\//.test(f.type)) return;
  const img = $('bpPreview'); img.src = URL.createObjectURL(f); img.hidden = false;
  $('dropzone').querySelector('.dz-inner').style.display = 'none';
  if (!$('bpName').value) $('bpName').value = f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
}
const dz = $('dropzone');
dz.addEventListener('click', () => $('bpFile').click());
$('bpFile').addEventListener('change', e => handleBpFile(e.target.files[0]));
dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag'); });
dz.addEventListener('dragleave', () => dz.classList.remove('drag'));
dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('drag'); handleBpFile(e.dataTransfer.files[0]); });
$('bpBuild').addEventListener('click', () => {
  const name = $('bpName').value.trim() || 'Factory Line';
  $('bpBuild').disabled = true;
  $('bpProgress').hidden = false;
  const words = ['reading blueprint…', 'detecting components…', 'extracting dimensions…', 'placing sensors…', 'wiring the twin…'];
  let p = 0, wi = -1;
  const t = setInterval(async () => {
    p += 8 + Math.random() * 12; if (p > 100) p = 100;
    $('bpBar').style.width = p + '%';
    const nw = Math.min(words.length - 1, Math.floor(p / 20));
    if (nw !== wi) { wi = nw; $('bpWords').textContent = '› ' + words[wi]; }
    if (p >= 100) {
      clearInterval(t);
      try {
        const twin = (await fetch('/api/twins', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name, type: 'factory', method: 'blueprint' }),
        }).then(r => r.json())).twin;
        await loadTwins(); goDone(twin);
      } catch {}
      $('bpBuild').disabled = false; $('bpProgress').hidden = true; $('bpBar').style.width = '0';
    }
  }, 160);
});

// ---- brain health ---------------------------------------------------------
fetch('/api/health').then(r => r.json()).then(h => {
  const dot = $('brainDot'), txt = $('brainText');
  if (h.brain === 'openai') { dot.className = 'dot good'; txt.textContent = 'OpenAI · ' + h.model; }
  else if (h.brain === 'ollama') { dot.className = h.present ? 'dot good' : 'dot bad'; txt.textContent = 'Ollama'; }
  else { dot.className = 'dot'; txt.textContent = 'local brain'; }
}).catch(() => { $('brainText').textContent = 'local brain'; });

// ---- boot -----------------------------------------------------------------
loadTwins();
setInterval(loadTwins, 5000);   // reflect twins created elsewhere
