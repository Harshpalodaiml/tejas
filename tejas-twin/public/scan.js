// Tejas AI — phone scan flow. Guides a video walk-around, "sends it to the AI",
// reconstructs the twin, and registers it on the server (so it appears on the
// desktop admin instantly). Falls back to a simulated camera on insecure origins.

const $ = (id) => document.getElementById(id);
const C = 339;  // ring circumference (2πr, r=54)
let machineName = 'Scanned Machine';

async function initCamera() {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw 0;
    const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    $('video').srcObject = s; await $('video').play();
  } catch {
    $('video').style.display = 'none'; $('sim').style.display = 'block';
  }
}

function setRing(p) { $('ringArc').style.strokeDashoffset = C * (1 - p); }

$('cBtn').onclick = async () => {
  machineName = ($('mName').value || '').trim() || 'Scanned Machine';
  await initCamera();
  record();
};

// 1) guided recording (~9s)
function record() {
  $('frame').style.display = 'block';
  $('ring').style.display = 'block';
  $('guide').style.display = 'block';
  $('rec').style.display = 'flex';
  $('cTitle').textContent = 'Recording…';
  $('cSub').textContent = 'Move slowly around the machine. Keep it inside the frame.';
  $('cBody').innerHTML = '';
  $('cBtn').style.display = 'none';

  const guides = ['Capture the front', 'Now the left side', 'Now the right side', 'Tilt to the top & nameplate', 'Almost there…'];
  const total = 9000; const t0 = performance.now();
  const tick = (now) => {
    const e = Math.min(1, (now - t0) / total);
    setRing(e);
    $('recT').textContent = Math.floor(e * 9) + 's';
    $('guide').textContent = guides[Math.min(guides.length - 1, Math.floor(e * guides.length))];
    if (navigator.vibrate && Math.random() < 0.04) navigator.vibrate(8);
    if (e < 1) requestAnimationFrame(tick); else reconstruct();
  };
  requestAnimationFrame(tick);
}

// 2) "AI reconstruction"
function reconstruct() {
  $('frame').style.display = 'none'; $('ring').style.display = 'none';
  $('guide').style.display = 'none'; $('rec').style.display = 'none';
  $('cTitle').textContent = 'Tejas AI is reconstructing the twin';
  $('cSub').textContent = 'Understanding geometry, parts and sensor points from your video.';
  $('cBody').innerHTML = `<div class="prog"><i id="bar"></i></div><div class="words" id="words"></div>`;
  const words = ['uploading frames…', 'structure-from-motion…', 'segmenting components…', 'identifying machine…', 'placing virtual sensors…', 'finalising twin…'];
  let p = 0, wi = -1;
  const t = setInterval(async () => {
    p += 6 + Math.random() * 10; if (p > 100) p = 100;
    $('bar').style.width = p + '%';
    const nw = Math.min(words.length - 1, Math.floor(p / (100 / words.length)));
    if (nw !== wi) { wi = nw; $('words').textContent = '› ' + words[wi]; }
    if (p >= 100) { clearInterval(t); await register(); }
  }, 170);
}

// 3) register the twin on the server (shows up on the desktop admin)
async function register() {
  try {
    await fetch('/api/twins', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: machineName, type: 'factory', method: 'scan' }),
    });
  } catch {}
  navigator.vibrate && navigator.vibrate([40, 60, 120]);
  $('card').classList.add('done');
  $('cTitle').textContent = '';
  $('cSub').textContent = '';
  $('cBody').innerHTML = `<div class="big">✅</div>
    <h3 style="text-align:center;margin:10px 0 4px">Twin created</h3>
    <div class="sub" style="text-align:center"><b>${escapeHtml(machineName)}</b> is now live on your Tejas dashboard, with sensors you can control.</div>`;
  $('cBtn').style.display = 'block';
  $('cBtn').textContent = 'Scan another';
  $('cBtn').onclick = () => location.reload();
}
const escapeHtml = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
