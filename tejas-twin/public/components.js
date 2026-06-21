// Tejas AI — the component registry.
// The bridge between the 3D scene, the inspect/fix UI, and the server.
// One record per clickable unit (rack / machine / separator / reactor …).
//
// A component is ALWAYS clickable, in any status — including blue — so it can be
// re-opened, re-inspected or reverted.

import { STATUS } from './status.js';

const REG = new Map();              // id -> Component
const subs = new Set();             // change observers

export function register(c) { REG.set(c.id, c); emit(c.id); return c; }
export function get(id)      { return REG.get(id); }
export function all()        { return [...REG.values()]; }
export function clear()      { REG.clear(); }

// ---- observer ------------------------------------------------------------
export function onChange(fn) { subs.add(fn); return () => subs.delete(fn); }
function emit(id) { subs.forEach(fn => { try { fn(id); } catch {} }); }

// ---- status mutation -----------------------------------------------------
export function setStatus(id, status, { persist = true } = {}) {
  const c = REG.get(id);
  if (!c) return;
  c.status = status;
  if (status === STATUS.CORRECTED) c.corrected = true;
  if (status === STATUS.FAULT)     c.corrected = false;
  emit(id);
  if (persist) save(c);
}

// Mark one fault resolved; flip to 'fixing' if work has started but isn't done.
export function resolveFault(id, partId) {
  const c = REG.get(id);
  if (!c) return false;
  const f = (c.faults || []).find(x => x.partId === partId);
  if (f) f.done = true;
  const allDone = (c.faults || []).every(x => x.done);
  if (allDone) { correct(id); return true; }
  if (c.status !== STATUS.FIXING) setStatus(id, STATUS.FIXING);
  return false;
}

// All faults resolved → CORRECTED (blue). Persists + lets the work order close.
export function correct(id) {
  const c = REG.get(id);
  if (!c) return;
  (c.faults || []).forEach(f => f.done = true);
  c.corrected = true;
  c.status = STATUS.CORRECTED;
  emit(id);
  save(c);
}

// Revert an already-corrected (blue) unit back to a fault for re-demo.
export function revert(id) {
  const c = REG.get(id);
  if (!c) return;
  (c.faults || []).forEach(f => f.done = false);
  (c.design?.parts || []).forEach(p => { if (p.moved) p.moved = false; });
  c.corrected = false;
  c.status = STATUS.FAULT;
  emit(id);
  save(c);
}

export function isCorrected(id) { return !!REG.get(id)?.corrected; }
export function hasFaults(id)   { return (REG.get(id)?.faults || []).length > 0; }

// ---- server sync ---------------------------------------------------------
// Mirrors the admin.js polling pattern: a fix done on the phone turns the rack
// blue on the laptop, and vice-versa.
async function save(c) {
  try {
    await fetch('/api/components', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: c.id, twinId: c.twinId, status: c.status, corrected: !!c.corrected }),
    });
  } catch {}
}

// Pull persisted statuses and apply them (without re-persisting → no echo loop).
export async function syncFromServer(twinId) {
  try {
    const r = await fetch('/api/components?twinId=' + encodeURIComponent(twinId));
    const { components = [] } = await r.json();
    for (const rec of components) {
      const c = REG.get(rec.id);
      if (!c || c.twinId !== rec.twinId) continue;
      if (c.status !== rec.status) {
        c.status = rec.status;
        c.corrected = !!rec.corrected;
        if (c.corrected) (c.faults || []).forEach(f => f.done = true);
        emit(c.id);
      }
    }
  } catch {}
}

// Poll for desktop↔phone sync (every `ms`, default 5 s like admin.js).
export function startSync(twinId, ms = 5000) {
  syncFromServer(twinId);
  return setInterval(() => syncFromServer(twinId), ms);
}
