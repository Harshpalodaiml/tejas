// Tejas AI — chat brain client.
// Sends the operator's message + the LIVE twin state to the server brain
// (OpenAI / Ollama). If the brain is unreachable, a deterministic local parser
// keeps the demo fully alive offline. Both paths return { reply, actions }.

const PANELS = ['savings', 'power', 'efficiency', 'racks', 'alerts', 'fleet', 'service', 'autonomy', 'oneline'];

export async function askBrain(message, context) {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message, context }),
    });
    const data = await res.json();
    if (data.ok && (data.reply || Array.isArray(data.actions))) {
      return { reply: data.reply || '', actions: sanitize(data.actions), source: data.brain || 'ai' };
    }
  } catch { /* fall through to local parser */ }
  return { ...localParse(message, context), source: 'local' };
}

// Keep only well-formed, known actions (defends against model drift).
function sanitize(actions = []) {
  const out = [];
  for (const a of actions) {
    if (!a || typeof a !== 'object') continue;
    if (a.type === 'setWeather' && isNum(a.tempC)) out.push({ type: 'setWeather', tempC: clamp(a.tempC, 28, 50) });
    else if (a.type === 'setLoad' && isNum(a.pct)) out.push({ type: 'setLoad', pct: clamp(a.pct, 30, 110) });
    else if (a.type === 'setMode' && (a.mode === 'ai' || a.mode === 'baseline')) out.push({ type: 'setMode', mode: a.mode });
    else if (a.type === 'show' && Array.isArray(a.panels)) {
      const p = a.panels.filter(x => PANELS.includes(x));
      if (p.length) out.push({ type: 'show', panels: p });
    } else if (a.type === 'focusRack' && a.name) out.push({ type: 'focusRack', name: String(a.name) });
    else if (a.type === 'setFleet' && isNum(a.count)) out.push({ type: 'setFleet', count: clamp(a.count, 1, 500) });
  }
  return out;
}
const isNum = (x) => typeof x === 'number' && isFinite(x);
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, Math.round(x)));

// ---- Local deterministic fallback (offline, always works) ------------------
function localParse(cmd, ctx) {
  const t = (cmd || '').toLowerCase();
  const actions = []; let reply = 'Done.';

  const num = (t.match(/\b(2[89]|3\d|4\d|50)\b/) || [])[1];
  if (/(heat ?wave|outside|ambient|weather|temperature to|degrees|crank|push)/.test(t) && num) {
    actions.push({ type: 'setWeather', tempC: +num }, { type: 'show', panels: ['power', 'efficiency'] });
    reply = `Ramping ambient to ${num}°C. Watch the baseline burn power while the AI holds PUE.`;
  }
  const loadM = t.match(/\bload\b.*?(\d{2,3})|(\d{2,3})\s*%/);
  if (/load|utilis|utiliz|workload|traffic|busy/.test(t) && loadM) {
    const pct = +(loadM[1] || loadM[2]);
    actions.push({ type: 'setLoad', pct }, { type: 'show', panels: ['power'] });
    reply = `Setting IT load to ${pct}%.`;
  }
  if (/(what.?s happening|status|going on|current|right now|situation|overview)/.test(t)) {
    actions.push({ type: 'show', panels: ['autonomy', 'efficiency'] });
    reply = ctx ? `In autonomous control: outside ${ctx.Tamb}°C, IT load ${ctx.loadPct}%, PUE ${ctx.aiPUE} vs ${ctx.basePUE} baseline. ${(ctx.alerts && ctx.alerts[0]) || 'All racks inside the safe band.'}` : 'Running autonomously and holding the band.';
  }
  if (/(single.?line|one.?line|wiring|electrical diagram|power diagram|distribution|circuit|\bsld\b|switchgear|transformer|ups|pdu)/.test(t)) {
    actions.push({ type: 'show', panels: ['oneline'] });
    reply = ctx ? `Here's the live electrical single-line — grid through the transformer, switchgear, UPS and PDUs to the NVIDIA GPU racks, drawing ${ctx.aiTotal} kW now.` : 'Here is the live electrical single-line diagram.';
  } else if (/(electric|power|draw|watt|kw|consum|using|usage|energy use)/.test(t)) {
    actions.push({ type: 'show', panels: ['power'] });
    reply = ctx ? `Drawing about ${ctx.aiTotal} kW total now — baseline would pull ${ctx.baseTotal} kW for the same work.` : 'Here is live power.';
  }
  if (/(save|saving|savings|money|rupee|₹|bill)/.test(t)) {
    actions.push({ type: 'show', panels: ['savings'] });
    reply = ctx ? `Saving about ₹${ctx.rupeesDay}/day right now — ${ctx.coolPct}% leaner cooling than baseline.` : 'Here are the verified savings.';
  }
  if (/(compare|versus|vs|old controller|dumb)/.test(t)) {
    actions.push({ type: 'show', panels: ['power', 'efficiency'] });
    reply = 'Tejas vs the baseline controller — live power and efficiency.';
  }
  if (/(autonom|learning|control|decision|why|doing|policy|reason)/.test(t)) {
    actions.push({ type: 'show', panels: ['autonomy'] });
    reply = ctx ? `Autonomous, policy v3, ${ctx.autonomy}.` : 'Here is what I am doing and why.';
  }
  if (/(going down|fail|breakdown|underperform|degrad|service|maintenance|repair|email|work order|technician)/.test(t)) {
    actions.push({ type: 'show', panels: ['service', 'alerts'] });
    if (ctx && ctx.hottest) actions.push({ type: 'focusRack', name: ctx.faultRack || ctx.hottest });
    reply = ctx ? `${ctx.faultRack || ctx.hottest} has been degrading — I've drafted the service email with the exact parts so it's fixed in minutes.` : 'Here is the service work order and drafted email.';
  }
  if (/(pue|efficien|cop)/.test(t)) { actions.push({ type: 'show', panels: ['efficiency'] }); reply = ctx ? `PUE is ${ctx.aiPUE} versus ${ctx.basePUE} on the baseline.` : 'Here is the efficiency.'; }
  if (/(hot|hottest|service|maintenance|fault|repair|fix|attention|alert|problem)/.test(t)) {
    actions.push({ type: 'show', panels: ['alerts', 'racks'] });
    if (ctx && ctx.hottest) actions.push({ type: 'focusRack', name: ctx.hottest });
    reply = ctx ? `${ctx.hottest} is the hottest at ${ctx.hottestTemp}°C. ${(ctx.alerts && ctx.alerts[0]) || ''}` : 'Surfacing the hottest rack and any service alerts.';
  }
  if (/(rack|server|cabinet)/.test(t)) {
    const rk = (t.match(/\b(gpu-\d+|r-\d+)\b/) || [])[1];
    actions.push({ type: 'show', panels: ['racks'] });
    if (rk) actions.push({ type: 'focusRack', name: rk.toUpperCase() });
    reply = 'Showing the rack thermal map.';
  }
  if (/(fleet|facilit|sites|stores|scale|across|portfolio)/.test(t)) {
    const f = (t.match(/\b(\d{1,3})\b/) || [])[1] || 10;
    actions.push({ type: 'show', panels: ['fleet'] }, { type: 'setFleet', count: +f });
    reply = `Projecting annual savings across ${f} facilities.`;
  }
  if (/(take control|optimi|autonom|turn on|enable|hand control|tejas on)/.test(t)) {
    actions.push({ type: 'setMode', mode: 'ai' }, { type: 'show', panels: ['efficiency', 'savings'] });
    reply = 'Taking control — running the hall as warm and lean as the safe band allows.';
  } else if (/(baseline|dumb|turn off|disable|manual|stop optim)/.test(t)) {
    actions.push({ type: 'setMode', mode: 'baseline' });
    reply = 'Handing back to the baseline controller.';
  }
  if (!actions.length) {
    actions.push({ type: 'show', panels: ['savings', 'efficiency'] });
    reply = ctx ? `PUE ${ctx.aiPUE}, saving ₹${ctx.rupeesDay}/day. Ask me to crank the heat, find a hot rack, or project a fleet.` : 'Ask me about savings, the weather, or a hot rack.';
  }
  return { reply, actions };
}
