# Tejas AI — Interactive Component Inspect & Guided-Fix
### Architecture spec: click a rack → open its design/circuit → move & correct → red ➜ blue

> **User story (your words):** "I click a rack (in VR or the main 3D), I get options like
> *circuit inside / everything*, the proper design of it comes up, I can move it and correct it;
> once corrected it goes from **red → blue**, and I can click any one — even a blue one — again."

This document is the build plan. It plugs into the existing code:
`public/twin3d.js` (data-center 3D), `public/vr.js` (first-person), `public/plants.js`
(factory/nuclear/geothermal/solar), `public/app.js` (HUD/inspector), `public/factory3d.js`
(orbit viewer) and `server.py` (persistence + AI).

---

## 1. The big idea

Every clickable thing (a rack, a machine, a separator, a reactor) becomes an **inspectable
component** with:

1. a **selectable** state in the 3D scene (click in orbit OR center-reticle tap in VR),
2. a **detail view** that shows **whatever "aspect lenses" the component has** — not just circuits:
   electrical, cooling/airflow, mechanical internals, plumbing/fluid, controls/PLC, structure…
   The lenses are **data-driven per component type**, plus an always-present `Overview` and
   `Everything` (all aspects stacked),
3. an **edit/correct mode** where the user can **move/realign parts** and **apply fixes**,
4. a **lifecycle status** that drives colour: `fault(red) → in-progress(amber) → corrected(blue)`,
5. **persistence** so a corrected unit stays blue and syncs desktop ↔ phone.

The component is **always clickable**, in any status — including blue — so you can re-open,
re-inspect, or revert.

---

## 2. Status model & colour map (single source of truth)

Create **`public/status.js`** — imported everywhere so colours never drift.

```js
// public/status.js
export const STATUS = { HEALTHY:'healthy', WARN:'warn', FAULT:'fault', FIXING:'fixing', CORRECTED:'corrected', SELECTED:'selected' };
export const STATUS_COLOR = {
  healthy:  '#2ee6a6',  // green  — nominal
  warn:     '#ffd34d',  // amber  — drifting
  fault:    '#ff3344',  // red    — needs correction
  fixing:   '#ff7a33',  // orange — being corrected
  corrected:'#19c6ff',  // BLUE   — fixed by the operator   ← the red→blue transition
  selected: '#ffffff',  // white ring while picked
};
export function statusColor(s){ return STATUS_COLOR[s] || STATUS_COLOR.healthy; }
```

Rule: temperature still tints **healthy** units (your existing ramp). But once a unit has an
explicit lifecycle status (`fault/fixing/corrected`) that status **overrides** the temp colour.
This is the key change to the per-frame colour code in `twin3d.update()`, `vr.js` `animatePlant`/rack
loop, and `plants.js animatePlant()`.

```js
// in the per-frame colour code (twin3d.js / plants.js / vr.js):
const st = rk.status;                       // from the component record
if (st && st !== 'healthy') {
  faceMat.emissive.set(statusColor(st));
  faceMat.emissiveIntensity = (st === 'fault' ? 1.0 + 0.5*Math.sin(t*6) : 0.9); // pulse only red
} else {
  tempColor(rk.inlet, tmp); faceMat.emissive.copy(tmp); /* …existing temp logic… */
}
```

---

## 3. Component data model

One record per clickable unit. Built once when the scene is created; mutated by interactions.

```js
// conceptual shape (lives on mesh.userData.component AND in a flat registry)
Component = {
  id:        'GPU-16',            // stable id (matches rack/machine name)
  twinId:    'datacenter-A',      // which twin it belongs to
  type:      'rack' | 'machine' | 'separator' | 'reactor' | ...,
  status:    'fault',             // STATUS.*  → drives colour
  inlet:     28.4,                // live telemetry (existing)
  load:      9.4,
  // ---- the "proper design" that opens on click ----
  design: {
    model:   'NVIDIA HGX B200',
    parts: [                      // exploded internals (each is movable in edit mode)
      { id:'fan-tray',  label:'Rear fan tray', ok:false, aspect:'cooling', offset:[0,0,0], correctOffset:[0,0,0.0] },
      { id:'filter',    label:'CRAC-2 intake filter (MERV-13)', ok:false, aspect:'cooling' },
      { id:'gpu-tray-1',label:'GPU tray A', ok:true, aspect:'mechanical' },
      { id:'psu',       label:'PSU 3kW ×6', ok:true, aspect:'electrical' },
      { id:'busbar',    label:'48V busbar', ok:true, aspect:'electrical' },
    ],
    // ── ASPECT LENSES: whatever views THIS component has (data-driven, open-ended) ──
    aspects: [                    // each one becomes a button in the detail view
      { key:'electrical', label:'Electrical', icon:'🔌', schematic:'rack-power',   view:'both' }, // 3D + SVG
      { key:'cooling',    label:'Cooling / Airflow', icon:'❄️', schematic:'rack-air', view:'both' },
      { key:'mechanical', label:'Internals', icon:'🧩', view:'3d'   },               // exploded model only
      { key:'controls',   label:'Controls / BMS', icon:'🎛️', schematic:'rack-ctl', view:'svg' }, // schematic only
    ],
  },
  faults: [                       // what's wrong + how to correct (drives the checklist)
    { partId:'filter',   issue:'clogged',  fix:'Swap the CRAC-2 intake filter' },
    { partId:'fan-tray', issue:'bearing',  fix:'Replace the rear fan tray (the ringed part)' },
  ],
  corrected: false,               // becomes true when all faults resolved → status='corrected' (blue)
}
```

A flat **registry** keyed by `id` lives in a new module **`public/components.js`** and is the
bridge between the 3D scene, the UI, and the server.

```js
// public/components.js
const REG = new Map();
export function register(c){ REG.set(c.id, c); }
export function get(id){ return REG.get(id); }
export function all(){ return [...REG.values()]; }
export function setStatus(id, status){ const c=REG.get(id); if(c){ c.status=status; emit(id); } }
export function correct(id){ const c=REG.get(id); if(!c) return;
  c.faults.forEach(f=>f.done=true); c.corrected=true; c.status='corrected'; emit(id); save(c); }
// observer + server sync
const subs=new Set(); export function onChange(fn){subs.add(fn);}
function emit(id){ subs.forEach(fn=>fn(id)); }
async function save(c){ try{ await fetch('/api/components',{method:'POST',
  headers:{'content-type':'application/json'}, body:JSON.stringify({id:c.id,twinId:c.twinId,status:c.status,corrected:c.corrected})});}catch{} }
```

---

## 4. Interaction flow (the whole loop)

```
            ┌─────────────────────────────────────────────────────────────┐
 click /    │ 1. PICK            2. CONTEXT MENU         3. DETAIL VIEW      │
 reticle ─▶ │ raycast → unit  ─▶ ◦ Overview          ─▶ proper design /     │
            │ (white ring)      ◦ Circuit / Internals    exploded model +   │
            │                   ◦ Everything             telemetry          │
            │                   ◦ Move / Correct                            │
            └───────────────────────────────────────────┬─────────────────┘
                                                         │ "Move / Correct"
                                                         ▼
            ┌─────────────────────────────────────────────────────────────┐
 red ▶ blue │ 4. EDIT MODE: drag the flagged part to its correct slot       │
            │    (snap when within tolerance) → tick the fix checklist      │
            │ 5. When all faults done → correct(id) → status='corrected'    │
            │    → mesh recolours BLUE, persists to server, work order auto │
            │    closes. Unit stays clickable (re-open to inspect/revert).  │
            └─────────────────────────────────────────────────────────────┘
```

**Always clickable:** the raycast targets every registered unit regardless of status, so a blue
(corrected) unit re-opens the same menu; "Move / Correct" there offers **Revert** instead of fix.

---

## 5. UI components

| UI | Where | Purpose |
|---|---|---|
| **Selection ring** | 3D (all scenes) | white pulsing ring on the picked unit (`status:selected` overlay) |
| **Radial/context menu** | `app.js` (desktop), `vr.js` (phone) | 4 options: Overview · Circuit/Internals · Everything · Move&Correct |
| **Detail panel** | reuse `#inspector` (desktop) / `#info` (VR), add tabs | shows the chosen lens |
| **Exploded model** | new `public/rackdesign.js` | builds the unit's internal parts as a small Three.js group, explodes them apart |
| **Circuit overlay** | new `public/schematic.js` | SVG schematic of the unit (power/airflow), reuses the single-line style from `app.js renderOneLine()` |
| **Fix checklist** | detail panel | the `faults[]` as tickable steps (mirrors the AR `WO.steps` flow in `ar.js`) |

Desktop context menu = small floating menu at the click point. VR = the existing `#info` card
grows three buttons (`🔍 Internals`, `🔌 Circuit`, `🛠 Correct`) under the reticle.

---

## 6. Aspect lenses — "not only circuits, whatever there can be"

The detail view is **not fixed to a circuit**. It renders **one button per `design.aspects[]`
entry**, so each component shows exactly the views it actually has. Each aspect declares how it
renders: `view:'3d'` (exploded model), `view:'svg'` (schematic), or `view:'both'` (toggle).

- **Overview** (always) — current `#inspector` content (temp, load, airflow, status).
- **Per-aspect lens** (zero-to-many, defined by data) — examples:
  - 🔌 **Electrical** — busbar → PSU → trays (SVG) + the power parts exploded (3D).
  - ❄️ **Cooling / Airflow** — CRAC → cold aisle → inlet path, fan tray + filter highlighted.
  - 🧩 **Internals / Mechanical** — exploded model of every part, faulted part glows red.
  - 🎛️ **Controls / BMS** — control/PLC schematic, setpoints, writable points.
  - 🛢️ **Plumbing / Fluid** (plants) — CDU/liquid loop, valves, pressures.
  - …**anything else** a future component declares — the UI loops over `aspects`, it is **not
    hard-coded** to "circuit".
- **Everything** (always) — every aspect stacked + the drafted **service work order** + an
  **AI explanation** (`/api/chat`: *"explain GPU-16's fault and the exact correction"*).

**Rendering contract** (so any aspect "just works"):
- `view:'3d'`  → `rackdesign.build(component, aspectKey)` returns a Three.js group; parts whose
  `aspect === aspectKey` are emphasised, others dimmed; exploded with labels; faulted part red.
- `view:'svg'` → `schematic.draw(component, aspect.schematic)` returns SVG (reuses `.ol-*` CSS);
  nodes coloured by status (faulted red → corrected blue).
- `view:'both'` → both, with a small 3D/2D toggle.

Because the detail view iterates `component.design.aspects`, adding a new kind of view later is
**pure data** — no UI rewrite. A factory press exposes `mechanical + hydraulic + electrical`; a
geothermal separator exposes `fluid + thermal + controls`; a reactor exposes
`neutronics + coolant + electrical` — all through the same component contract.

---

## 7. Move & Correct (edit mode)

```
Enter edit mode on a faulted part:
  • The part (e.g. fan-tray) detaches and becomes draggable in 3D.
  • Desktop: pointer-drag on the ground/again-raycast plane; VR: joystick nudges or "grab" button.
  • A ghost shows the CORRECT slot (design.parts[].correctOffset). 
  • Snap when |pos - correctSlot| < tol → mark that fault done, vibrate/flash green tick.
Correction criteria:
  • A fault is "done" when its part is snapped/replaced (or its checklist step ticked).
  • When every fault.done → components.correct(id):
        status = 'corrected'  → recolour BLUE
        persist to server, close the work order, drop the red pulse.
Revert (on an already-blue unit):
  • "Move / Correct" shows "Revert to fault" → status='fault', clears corrected.
```

Tolerance + snap keep it forgiving for a demo. Movement is constrained to the unit's local space
so parts can't fly across the hall.

---

## 8. Integration points (file by file)

| File | Change |
|---|---|
| **`public/status.js`** (new) | status enum + colour map |
| **`public/components.js`** (new) | registry, status mutation, server sync, observer |
| **`public/rackdesign.js`** (new) | build + explode a unit's internal parts (Three.js group) |
| **`public/schematic.js`** (new) | per-unit SVG circuit (power/airflow), red/blue nodes |
| **`public/twin3d.js`** | `_handlePick` → also resolve a `Component`; add selection ring; colour code respects `status` (see §2); expose `explode(id)` / `focusComponent(id)` |
| **`public/vr.js`** | reticle pick already returns the unit → open `#info` with the 3 lens buttons; status overrides colour in the frame loop |
| **`public/plants.js`** | `animatePlant()` colour code respects `status`; machines already carry `userData.rack` → register them as Components |
| **`public/factory3d.js`** | same status-aware colour in `frame()` |
| **`public/app.js`** | inspector → tabs (Overview/Circuit/Everything) + "Move&Correct"; wire `components.onChange` to refresh; auto-close work order on `corrected` |
| **`server.py`** | new `/api/components` GET/POST — a per-twin status registry mirroring the existing `TWINS` list (thread-locked, in-memory); lets blue persist + sync desktop↔phone |
| **`public/styles.css`** | context menu, detail tabs, exploded-part labels, blue "corrected" badge |

### Server endpoint (mirrors the existing TWINS pattern)

```python
# server.py — alongside TWINS
COMPONENTS = {}                      # key: f"{twinId}:{id}" -> {status, corrected, ts}
COMPONENTS_LOCK = threading.Lock()

# GET  /api/components?twinId=...   -> {"components":[...]}
# POST /api/components  {id,twinId,status,corrected}  -> {"ok":true}
```

Polling on the client (like `admin.js` polls `/api/twins` every 5 s) makes a fix done on the
phone turn the rack blue on the laptop, and vice-versa.

---

## 9. Phased build plan

- **M1 — Status colour pipeline:** `status.js` + `components.js`; register racks/machines; make the
  three colour loops status-aware. *Done when:* setting `status='corrected'` in console turns a unit blue.
- **M2 — Pick → menu → detail tabs:** selection ring + context menu (desktop & VR) + Overview/Everything tabs.
- **M3 — Internals + circuit lenses:** `rackdesign.js` exploded view + `schematic.js` SVG circuit.
- **M4 — Move & Correct + persistence:** drag-to-correct, snap, `correct(id)` → blue, `/api/components`
  sync, auto-close work order, Revert on blue.

Each milestone is independently demoable.

---

## 10. Acceptance criteria

1. Clicking a rack (orbit) or center-tapping it (VR) selects it (white ring) and opens the menu.
2. Menu offers **Overview · (one button per aspect the unit declares) · Everything · Move & Correct** —
   the aspect buttons are generated from `design.aspects[]`, not hard-coded to "circuit".
3. Each aspect lens shows the unit's **proper design** for that aspect (exploded 3D and/or schematic),
   with the faulted part/node highlighted **red**.
4. In **Move & Correct** I can drag the flagged part; snapping it / completing the checklist marks
   the fault done.
5. When all faults are done the unit turns **blue (`#19c6ff`)**, the work order closes, and the state
   **persists** (survives reload, syncs phone↔desktop).
6. **Any** unit — including blue ones — remains clickable; a blue unit offers **Revert**.
7. Colour priority: explicit status (fault/fixing/corrected) overrides live-temperature tint.

---

## 11. Notes / gotchas (from this codebase)

- **Three.js r160, vendored, no addons.** Use `Raycaster` you already have; for drag use a ground
  plane or re-raycast — don't pull in TransformControls.
- **Do NOT** `Object.assign(mesh, {position:…})` — `position` is read-only in this build (it silently
  killed the whole factory build once). Always `mesh.position.set(...)`.
- Reuse the **`.ol-*` single-line CSS** (already in `styles.css`) for `schematic.js`.
- Reuse the **AR work-order/steps pattern** in `ar.js` (`WO.steps`, checklist render) for the fix list.
- Keep per-frame allocations out of the colour loops (reuse a scratch `THREE.Color`, like
  `this._scratch` in `twin3d.js`).
- The faulted unit today is **GPU-16** (data center) / **PRESS-7** (factory) / **SEP-2**
  (geothermal) — seed those as `status:'fault'` so the red→blue demo works out of the box.
```
