# Rack Inspect & Guided Fix

Click rack → aspect lenses → move & correct → **red → blue**.

**Modules:** `status.js` · `components.js` · `rackdesign.js` · `schematic.js`  
**Wire-up:** `app.js` · `twin3d.js` · `vr.js` · `ar.js` · `server.py` `/api/components`

---

## User story

> Click a rack (3D or VR) → Overview / Electrical / Cooling / Mechanical / Everything → fix faulted part → unit turns **blue**. Blue units stay clickable (revert available). Phone fix syncs to desktop.

---

## Status model (`status.js`)

| Status | Colour | Meaning |
|---|---|---|
| healthy | green | Temp tint applies |
| warn | amber | Drifting |
| fault | red pulse | Needs fix |
| fixing | orange | In progress |
| corrected | **#19c6ff blue** | Fixed |
| selected | white ring | Picked |

**Rule:** lifecycle status **overrides** temperature colour.

---

## Component shape

```
id, twinId, type, status, inlet, load
design: { model, parts[], aspects[] }
faults: [{ partId, issue, fix, done }]
corrected: bool
```

**Seeded faults:** GPU-16 (DC) · PRESS-7 (factory) · SEP-2 (geothermal)

---

## Interaction flow

```
PICK → context menu → aspect lens (3D and/or SVG)
  → edit mode: drag part to ghost slot → snap
  → all faults done → correct() → BLUE
  → POST /api/components → sync phone ↔ desktop
```

### Aspect lenses (data-driven)

| Lens | View | Example |
|---|---|---|
| Electrical | SVG + 3D | PSU → GPU trays |
| Cooling | SVG + 3D | CRAC → filter → fan tray |
| Mechanical | 3D explode | Internals |
| Controls | SVG | BMS setpoints |

---

## API (target)

```
GET  /api/components?twinId=
POST /api/components  { id, twinId, status, corrected }
```

Client polls 5s (like `/api/twins`).

---

## Milestones

| # | Done when |
|---|---|
| M1 | `setStatus('GPU-16','corrected')` → blue in 3D |
| M2 | Pick → menu desktop + VR |
| M3 | Aspect lenses render |
| M4 | Drag fix + persist + AR → blue on desktop |

---

## Today vs gap

| Works now | Gap |
|---|---|
| Fault pulse, inspector, work order | Context menu wire-up |
| AR 4-step checklist | `correct()` → desktop blue |
| Modules built | `/api/components` in server |

---

*System arch: [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) § rack inspect*