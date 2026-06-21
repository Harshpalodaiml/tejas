# Tejas AI — Complete System Architecture

> **The definitive technical reference** for the Tejas AI digital-twin platform.  
> Covers the runnable demo (`tejas-twin/`), enterprise ingestion design, interactive rack inspect & guided-fix, simulation, AI brain, AR/VR, and the production roadmap.  
> Companion docs: [`architect.md`](./architect.md) (product layers) · [`../tejas-twin/ingestion.md`](../tejas-twin/ingestion.md) (enterprise ingestion) · [`../tejas-twin/ARCHITECTURE-rack-inspect-fix.md`](../tejas-twin/ARCHITECTURE-rack-inspect-fix.md) (rack-fix spec source)

---

## Table of contents

1. [Executive summary](#1-executive-summary)
2. [System context](#2-system-context)
3. [Four-layer model](#3-four-layer-model)
4. [Repository map](#4-repository-map)
5. [Runtime topology](#5-runtime-topology)
6. [Backend — `server.py`](#6-backend--serverpy)
7. [Simulation engine — `sim.js`](#7-simulation-engine--simjs)
8. [3D rendering](#8-3d-rendering)
9. [AI brain & generative UI](#9-ai-brain--generative-ui)
10. [Data-center application — `app.js`](#10-data-center-application--appjs)
11. [Interactive rack inspect & guided fix](#11-interactive-rack-inspect--guided-fix)
12. [Multi-twin platform](#12-multi-twin-platform)
13. [Enterprise ingestion](#13-enterprise-ingestion)
14. [Field AR, VR, scan](#14-field-ar-vr-scan)
15. [Plant twins — `plants.js`](#15-plant-twins--plantsjs)
16. [End-to-end data flows](#16-end-to-end-data-flows)
17. [Trust ladder & safety](#17-trust-ladder--safety)
18. [Security & sovereignty](#18-security--sovereignty)
19. [Deployment & operations](#19-deployment--operations)
20. [Demo vs production matrix](#20-demo-vs-production-matrix)
21. [Extension points & roadmap](#21-extension-points--roadmap)
22. [Appendix — API reference](#22-appendix--api-reference)
23. [Appendix — file index](#23-appendix--file-index)

---

## 1. Executive summary

**Tejas AI** is an on-prem digital-twin platform with an autonomous cooling brain. It:

- **Predicts** heat (weather, load, thermal mass) instead of reacting after temperatures spike
- **Optimises** setpoints continuously inside a hard safety envelope
- **Explains** every action in plain language (chat, voice, vernacular)
- **Acts** through a trust ladder: twin → shadow → advisory → supervised → autonomous
- **Maintains** equipment via predictive flags (GPU-16), work orders, Field AR, and the **rack inspect → move & correct → red→blue** lifecycle

The **runnable system** lives in `tejas-twin/`: pure Python stdlib server + browser ES modules + vendored Three.js. No npm, no pip, one command: `./run.sh`.

The **defensible moat** is not the dashboard — it is the **calibrated twin + safe control policy + per-site operational data**. The gen-UI, 3D, AR, and VR are the unforgettable face on top.

---

## 2. System context

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           OPERATOR / TECHNICIAN                              │
│         voice · chat · 3D orbit · VR walk · phone AR · admin panel          │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────────────────┐
│  tejas-twin (browser + server.py)                                            │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────────────┐ │
│  │ L4 Gen-UI   │  │ L3 Deploy    │  │ L2 Control  │  │ L1 Twin (sim.js) │ │
│  │ genui.js    │  │ mode ladder  │  │ tejasControl│  │ thermal physics  │ │
│  │ /api/chat   │  │ autonomy UI  │  │ baseline    │  │ 24 racks, PUE    │ │
│  └─────────────┘  └──────────────┘  └─────────────┘  └──────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ 3D · Components · AR · VR · Ingest · Builder · Admin                   │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │ (production)
┌───────────────────────────────────▼─────────────────────────────────────────┐
│  FACILITY: BMS · DCIM · Historian · CDU · Redfish · BACnet · Modbus         │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Design principle:** The AI never learns on live critical hardware first. It learns on the **twin**, is validated in **shadow mode**, then climbs the trust ladder. The facility is **never worse off** than before Tejas.

---

## 3. Four-layer model

| Layer | Name | Demo implementation | Production target |
|---|---|---|---|
| **L1** | Digital twin | `sim.js` — lumped thermal model, 24 racks, Indian weather | EnergyPlus + Sinergym; calibrated per site |
| **L2** | Optimisation engine | `tejasControl()` — grid search over Tsup/fan | MPC day-one; RL trained in twin |
| **L3** | Safe deployment | UI mode switch + autonomy card narrative | Shadow → advisory → supervised → autonomous + Safety Supervisor |
| **L4** | Gen-UI + voice | `genui.js` + `/api/chat` + `tour.js` | Ollama tool-calling + component registry |

```
  L4  GENERATIVE UI + VOICE     talk → dashboard builds → actions on twin
  L3  DEPLOYMENT (sim→real)     shadow → advise → control (trust ladder)
  L2  OPTIMIZATION ENGINE       predict + minimise energy s.t. safety
  L1  DIGITAL TWIN              physics model of facility thermals
```

**Feed-forward insight (Phaidra-class):** Read leading indicators — rack power, weather forecast, thermal lag — act in &lt;10s, not after inlet temps spike.

---

## 4. Repository map

### `minmo/` (product repo root)

| Path | Purpose |
|---|---|
| `ARCHITECTURE.md` | **This document** — complete system reference |
| `architect.md` | Product-layer architecture (EnergyPlus, MPC/RL, Ollama) |
| `project.md` | Business strategy, GTM, pricing |
| `demo.md` | Two-screen demo script |
| `story.md` | Sales narrative with real-world anchors |
| `pitch/` | Pitch deck, 60s script, one-pager |
| `tejas-twin/` | **Runnable application** |

### `tejas-twin/` (application)

```
tejas-twin/
├── server.py                 # HTTP/HTTPS server, AI APIs, twin registry
├── run.sh                    # One-command launcher
├── README.md                 # Quick start, routes, 90s demo script
├── ingestion.md              # Enterprise ingestion architecture (spec)
├── ARCHITECTURE-rack-inspect-fix.md   # Rack inspect spec (detailed source)
├── .tejas-secret             # Git-ignored API keys (KEY=VALUE)
├── .tejas-cert.pem / .tejas-key.pem    # Auto-generated TLS certs
└── public/
    ├── admin.html / admin.js           # Landing: twin list, create flows
    ├── datacenter.html / app.js        # Flagship 3D data-center twin
    ├── twinpro.html / twinpro.js       # Glass console (Analytics · Config · Sim)
    ├── factory.html / factory.js       # Factory/plant twin viewer
    ├── builder.html / builder.js       # Twin Studio (drag/drop + AI layout)
    ├── ingest.html / ingest.js         # Brownfield 6-step wizard
    ├── scan.html / scan.js             # Phone video → twin registration
    ├── ar.html / ar.js                 # Field AR: fix GPU-16 + build-from-camera
    ├── vr.html / vr.js                 # First-person VR walkthrough + OpenAI voice assistant
    ├── sim.js                          # Thermal physics + Twin class
    ├── twin3d.js                       # Data-center Three.js scene
    ├── factory3d.js                    # Factory/plant Three.js scene
    ├── plants.js                       # 4 plant type builders + animation
    ├── genui.js                        # Chat client + offline parser
    ├── charts.js                       # Sparkline charts
    ├── tour.js                         # Guided Web Speech tour
    ├── styles.css / twinpro.css
    └── vendor/
        ├── three.module.js             # Three.js r160 (offline)
        └── qrcode.js                   # QR for AR/VR/scan links
```

### Rack inspect modules

| Module | Status | Role |
|---|---|---|
| `public/status.js` | **Built** | Status enum + colour map (single source of truth) |
| `public/components.js` | **Built** | Registry, `correct()`, `revert()`, server sync hooks |
| `public/rackdesign.js` | **Built** | `RackDesign` — exploded 3D, drag-to-snap |
| `public/schematic.js` | **Built** | Per-unit SVG schematics (rack-power, rack-air, rack-ctl) |
| UI wire-up (`app.js`, `twin3d.js`, `vr.js`) | **In progress** | Context menu, aspect tabs, status colour |
| `/api/components` | **Next** | GET/POST persistence in `server.py` |

See [§11](#11-interactive-rack-inspect--guided-fix) for the full rack inspect architecture.

---

## 5. Runtime topology

### Process model

- **Single process:** `python3 server.py` — `ThreadingHTTPServer` on `0.0.0.0:7878`
- **No build step:** Browser loads ES modules directly from `public/`
- **State:** Simulation runs **entirely in the browser** (`Twin.tick()` in `app.js` RAF loop)
- **Server state:** In-memory `TWINS[]` registry (thread-locked); no database in demo

### URL routing (server aliases)

| URL | Serves |
|---|---|
| `/`, `/admin` | `admin.html` |
| `/datacenter` | `datacenter.html` |
| `/twin` | `twinpro.html` |
| `/factory` | `factory.html` |
| `/build`, `/studio` | `builder.html` |
| `/ingest` | `ingest.html` |
| `/scan` | `scan.html` |
| `/ar` | `ar.html` |
| `/vr`, `/walk` | `vr.html` |

### Client module graph (data center)

```
datacenter.html
  └── app.js
        ├── sim.js          (Twin, physics, controllers)
        ├── twin3d.js     (Three.js hall)
        ├── charts.js     (Spark)
        ├── genui.js      (askBrain → /api/chat)
        └── tour.js       (voice tour)
```

---

## 6. Backend — `server.py`

**Stack:** Python 3.8+ standard library only — `http.server`, `ssl`, `json`, `urllib`, `threading`. No pip dependencies.

### Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `7878` | Listen port |
| `OPENAI_API_KEY` | env or `.tejas-secret` | Tier-1 brain |
| `OPENAI_MODEL` | `gpt-4o-mini` | Chat model |
| `OPENAI_VISION_MODEL` | `gpt-4o-mini` | Vision scan |
| `OLLAMA_URL` | `http://localhost:11434` | Tier-2 brain |
| `TEJAS_MODEL` | `qwen2.5:7b-instruct` | Ollama chat |
| `TEJAS_VISION_MODEL` | `llava:7b` | Ollama vision |
| `TEJAS_HTTP` | unset → HTTPS | `1`/`true` for plain HTTP |

### AI brain priority

```
1. OpenAI     — if OPENAI_API_KEY set
2. Ollama     — if reachable at OLLAMA_URL
3. Fallback   — genui.js localParse() (client-side; server returns fallback:true)
```

### In-memory registries

```python
TWINS = []       # {id, name, type, method, components, bounds, status, created}
TWINS_LOCK       # threading.Lock()
_TWIN_SEQ        # auto-increment id

# Target (rack inspect — §11):
COMPONENTS = {}  # key: f"{twinId}:{id}" → {status, corrected, ts}
COMPONENTS_LOCK
```

### `add_twin(name, ttype, method, components, bounds)`

Creates twin record for cross-device sync (phone scan → desktop admin within 5s poll).

### Chat system prompt (`SYSTEM_PROMPT`)

Tejas returns **strict JSON**:

```json
{
  "reply": "<1-3 sentences, operator language>",
  "actions": [ { "type": "...", ... } ]
}
```

**Action types:**

| Action | Parameters | Effect in `app.js` |
|---|---|---|
| `setWeather` | `tempC: 28..50` | `twin.setAmbient()` |
| `setLoad` | `pct: 30..110` | `twin.setLoad()` |
| `setMode` | `mode: "ai"\|"baseline"` | Hand control |
| `show` | `panels: [...]` | Reveal HUD panels |
| `focusRack` | `name: "GPU-16"` | `scene.focusRack()` |
| `setFleet` | `count: 1..500` | Fleet projection multiplier |

**Panels:** `savings`, `power`, `efficiency`, `racks`, `alerts`, `fleet`, `service`, `autonomy`, `oneline`

### Context injection (`context_block`)

Every `/api/chat` request carries live twin state from `app.js` `ctxForBrain()`:

```
mode, Tamb, loadPct, aiPUE, basePUE, aiTotal, baseTotal,
aiCool, baseCool, coolPct, rupeesDay, rupeesYear, co2Year,
hottest, hottestTemp, faultRack, autonomy, alerts[]
```

### Other LLM endpoints

| Endpoint | Prompt | Output |
|---|---|---|
| `POST /api/design` | `DESIGN_PROMPT` | `{name, components[{type, count}]}` |
| `POST /api/ingest/questions` | `INGEST_PROMPT` | `{questions[{q, why, default}]}` |
| `POST /api/vision` | `VISION_PROMPT` | `{name, model, category, parts, sensors, steps}` |

### HTTPS (`ensure_cert()`)

- Auto-generates self-signed cert with SAN for `localhost` + LAN IPs via `openssl`
- Required for phone camera (AR, scan) on mobile browsers
- Falls back to HTTP if cert generation fails

---

## 7. Simulation engine — `sim.js`

A **dependency-free lumped thermal model** of an AI data-center hall. Same interfaces as the future EnergyPlus/Sinergym twin — runs in browser at ~50Hz sim time.

### What is modelled

| Phenomenon | Implementation |
|---|---|
| Per-rack IT load | Heterogeneous utilisation; GPU clusters at 14 kW nameplate |
| Air-side cooling | `ΔT_return = Q_IT / (airUA · fanFrac)` |
| Hot-aisle recirculation | `recircBase + recircGain · (1 - fanFrac)²` |
| Per-rack inlet hotspot | `hotGain · rackLoad` |
| Chiller COP | Degrades with ambient (`copAmbSlope`); improves with warmer CHW (`copChwSlope`) |
| Fan power | Cube law: `P_fan ∝ fanFrac³` |
| Envelope leak | `Renv` thermal resistance to ambient |
| Thermal mass | `tauRoom`, `tauInlet` relaxation per tick |
| PUE | `Ptotal / Pit` |
| ASHRAE A1 | Recommended inlet ≤27°C; allowable ≤32°C |

### `PARAMS` (key constants)

```js
airUA: 12.5          // kW/°C aggregate at full fan
copBase: 4.2         // nominal chiller COP
fanPowerMax: 19      // kW at 100% fan
inletRecMax: 27.0    // ASHRAE recommended max inlet °C
aiMargin: 1.5        // AI holds worst rack 1.5°C below limit
tariff: 9.0          // ₹/kWh
co2PerKwh: 0.71      // kg CO₂/kWh India grid
```

### Rack layout (`buildRacks()`)

- **4 rows × 6 cols = 24 racks**
- GPU clusters: positions `1-2`, `1-3`, `2-2`, `2-3`, `0-5`
- **GPU-16** at `row=2, col=3` (`faultKey = '2-3'`) — predictive maintenance seed

### GPU-16 fault model

```js
faulted: true,
faultRise: 3.4,    // extra inlet °C from airflow restriction
service: {
  degradingMonths: 14,
  rootCause: 'CRAC-2 filter + rear fan-tray bearing',
  parts: ['MERV-13 filter', '4-fan tray', 'blanking panels ×6'],
  action: '~25 min on-site',
  tech: { name: 'R. Kumar', role: 'Facilities / HVAC' }
}
```

`workOrder()` estimates waste: `faultRise × 3.1 kW` → annual ₹ at tariff.

### Controllers

**`baselineControl(env, racks)`** — dumb BMS:
- Cold supply 16°C, fans 95%
- Reactive bumps when worst inlet approaches limit
- Over-cools; burns power in heat waves

**`tejasControl(env, racks)`** — Tejas AI:
- Grid search: `Tsup` 26→13°C, `fanFrac` 1.0→0.4
- Minimise `Ptotal` subject to `worstInlet ≤ inletRecMax - aiMargin`
- Feed-forward: uses ambient + load to pick warmer supply (protect COP)

### `Twin` class

| Method | Returns |
|---|---|
| `tick(dt)` | Full state: `env`, `ai`, `base`, `aiRacks`, PUE, savings, decisions |
| `summary()` | HUD-friendly rollup |
| `workOrder()` | GPU-16 email draft + parts |
| `alerts()` | Open maintenance strings |
| `hottestRack()` | Name + temp |
| `setAmbient(T)` | Weather slider |
| `setLoad(pct)` | IT utilisation |
| `setMode('ai'\|'baseline')` | Control handoff |

### Production migration path

```
sim.js interfaces  →  EnergyPlus/Sinergym env  →  MPC/RL agent
     (same Twin API)      (higher fidelity)         (trained in twin)
```

---

## 8. 3D rendering

### `twin3d.js` — `Twin3D` class (data center)

| Feature | Implementation |
|---|---|
| Renderer | WebGL, PCF shadows, fog |
| Camera | Custom orbit (no OrbitControls addon) |
| Racks | `setRacks(layout)` — body mesh + emissive face + LED strip |
| Colour | `tempColor(inlet)` ramp 15°C blue → 34°C red |
| Fault pulse | `rk.faulted` → `emissiveIntensity *= 1 + 0.5·sin(6t)` |
| Pick | `Raycaster` on click → `onPick(rack)` |
| Focus | `focusRack(id)` — camera lerp |
| Weather | Sky gradient, sun sprite, fog lerp with `Tamb` |
| Airflow | ~900 particles; speed ∝ `fanFrac` |
| Chiller | Back-wall unit + animated pipe loop |
| Performance | Scratch `THREE.Color` reused; no per-frame alloc |

### `factory3d.js` — `Factory3D` class

| Mode | Method |
|---|---|
| Default factory | `buildMachine()` — motor, stations, conveyors, robots, workers, AGV |
| Studio layout | `buildLayout(components, bounds)` — 2D canvas → 3D boxes |
| Plant scene | `buildPlantScene(type)` → `plants.js` |

`frame(dt)` animates rotors, conveyors, robot arms, workers, AGVs, plant-specific sinks.

### `vr.js` — first-person

| Feature | Detail |
|---|---|
| Entry | `/vr` or `/vr?enter=1` |
| Plant types | `?type=factory\|nuclear\|geothermal\|solar` (default: datacenter) |
| Movement | Joystick walk, drag/gyro look, rise/duck |
| Pick | Center reticle raycast → `#info` card |
| Cardboard | `THREE.StereoCamera` split-screen |
| Datacenter | 28 static racks; GPU-16 at row 4 |
| Plants | `buildPlant()` + `animatePlant()` |

---

## 9. AI brain & generative UI

### `genui.js` — `askBrain(message, context)`

```
POST /api/chat { message, context }
  → { ok, brain, reply, actions[] }
  → sanitize(actions)  // clamp ranges, whitelist panels
  → app.js applyActions()
```

If server fails or `fallback: true` → `localParse()` — deterministic regex parser covering:
- Heat wave / weather
- Savings / power / PUE
- GPU-16 / service / maintenance
- Fleet projection
- Single-line electrical diagram
- Hindi hottest-unit query

### `tour.js` — `Tour` class

Web Speech API guided walkthrough; steps call `runCommand()` with fixed phrases for reliable demo.

### Production gen-UI (target)

```
voice → STT → Ollama → tool call + UI spec JSON → component registry render
```

Component registry: `LineChart`, `BigNumber`, `Comparison`, `Gauge`, `Table`, `Alert`, `ModeSwitch`.

---

## 10. Data-center application — `app.js`

### Orchestration loop

```js
requestAnimationFrame(frame)
  → twin.tick(0.02)           // physics
  → scene.update(state)       // 3D
  → updateHUD(summary)        // panels, KPIs, charts
```

### HUD panels

| Panel ID | Content |
|---|---|
| `savings` | ₹/day, ₹/year, kWh, CO₂ — AI vs baseline |
| `power` | Total draw, cooling power, IT load |
| `efficiency` | PUE comparison + sparkline |
| `racks` | 24-rack heat map grid |
| `alerts` | Cooling advisories + maintenance |
| `service` | GPU-16 work order + drafted email |
| `fleet` | `fleet` count × per-site savings |
| `autonomy` | Policy version, confidence, decision log |
| `oneline` | SVG electrical single-line (grid → UPS → PDU → GPU) |

### Inspector (`#inspector`)

On rack pick (`onPickRack`):
- Inlet temp, load, airflow CFM, vibration
- NVIDIA GPU model (by rack id)
- Status: Healthy / Hot / **Service** (if `faulted`)
- Root cause message for GPU-16

### Chat integration

```js
runCommand(text)
  → askBrain(text, ctxForBrain())
  → append reply to chat log
  → applyActions(actions)
```

---

## 11. Interactive rack inspect & guided fix

> **The flagship interaction:** click a rack → see its proper design → move & correct → **red → blue**.  
> Full spec source: [`../tejas-twin/ARCHITECTURE-rack-inspect-fix.md`](../tejas-twin/ARCHITECTURE-rack-inspect-fix.md)

### 11.1 User story

> *"I click a rack (in VR or the main 3D), I get options like circuit inside / everything, the proper design of it comes up, I can move it and correct it; once corrected it goes from **red → blue**, and I can click any one — even a blue one — again."*

Every clickable unit becomes an **inspectable component** with:

1. Selectable state (white ring)
2. **Aspect lenses** — data-driven views per component type (not hard-coded to "circuit")
3. Edit/correct mode — drag flagged parts to correct slot
4. Lifecycle status driving colour: `fault → fixing → corrected`
5. Persistence — corrected stays blue; syncs desktop ↔ phone

### 11.2 Status model — `status.js` (target)

```js
export const STATUS = {
  HEALTHY:   'healthy',
  WARN:      'warn',
  FAULT:     'fault',
  FIXING:    'fixing',
  CORRECTED: 'corrected',
  SELECTED:  'selected',
};

export const STATUS_COLOR = {
  healthy:   '#2ee6a6',  // green
  warn:      '#ffd34d',  // amber
  fault:     '#ff3344',  // red — pulse
  fixing:    '#ff7a33',  // orange
  corrected: '#19c6ff',  // BLUE — the red→blue transition
  selected:  '#ffffff',  // white ring while picked
};
```

**Colour priority rule:** Explicit lifecycle status **overrides** temperature tint. Only `healthy` racks use the temp ramp.

```js
// Per-frame colour (twin3d.js, vr.js, plants.js, factory3d.js):
const st = component.status;
if (st && st !== 'healthy') {
  faceMat.emissive.set(statusColor(st));
  faceMat.emissiveIntensity = (st === 'fault' ? 1.0 + 0.5*Math.sin(t*6) : 0.9);
} else {
  tempColor(rk.inlet, tmp);
}
```

### 11.3 Component data model

```js
Component = {
  id:        'GPU-16',              // stable id
  twinId:    'datacenter-A',
  type:      'rack' | 'machine' | 'separator' | 'reactor',
  status:    'fault',                 // STATUS.*
  inlet:     28.4,                    // live telemetry
  load:      9.4,
  design: {
    model:   'NVIDIA HGX B200',
    parts: [
      { id:'fan-tray',  label:'Rear fan tray', ok:false, aspect:'cooling',
        offset:[0,0,0], correctOffset:[0,0,0] },
      { id:'filter',    label:'CRAC-2 intake filter', ok:false, aspect:'cooling' },
      { id:'gpu-tray-1',label:'GPU tray A', ok:true, aspect:'mechanical' },
      { id:'psu',       label:'PSU 3kW ×6', ok:true, aspect:'electrical' },
    ],
    aspects: [
      { key:'electrical', label:'Electrical', icon:'🔌', schematic:'rack-power', view:'both' },
      { key:'cooling',    label:'Cooling / Airflow', icon:'❄️', schematic:'rack-air', view:'both' },
      { key:'mechanical', label:'Internals', icon:'🧩', view:'3d' },
      { key:'controls',   label:'Controls / BMS', icon:'🎛️', schematic:'rack-ctl', view:'svg' },
    ],
  },
  faults: [
    { partId:'filter',   issue:'clogged', fix:'Swap CRAC-2 intake filter', done:false },
    { partId:'fan-tray', issue:'bearing', fix:'Replace rear fan tray', done:false },
  ],
  corrected: false,
}
```

### 11.4 Component registry — `components.js` (target)

```js
const REG = new Map();
export function register(c) { REG.set(c.id, c); }
export function get(id) { return REG.get(id); }
export function setStatus(id, status) { /* emit + save */ }
export function correct(id) {
  c.faults.forEach(f => f.done = true);
  c.corrected = true;
  c.status = 'corrected';  // → BLUE
  emit(id);
  save(c);  // POST /api/components
}
export function revert(id) { /* fault again, for demo reset */ }
export function onChange(fn) { /* UI + 3D refresh */ }
```

### 11.5 Interaction flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. PICK          raycast / VR reticle → white selection ring    │
│ 2. CONTEXT MENU  Overview · [aspect buttons] · Everything ·      │
│                  Move & Correct                                  │
│ 3. DETAIL VIEW   per aspect lens (3D explode and/or SVG)        │
│ 4. EDIT MODE     drag faulted part → snap to correctOffset      │
│ 5. CORRECT       all faults done → correct(id) → BLUE           │
│ 6. PERSIST       POST /api/components → sync phone ↔ desktop      │
│ 7. RE-OPEN       blue units still clickable → Revert available  │
└─────────────────────────────────────────────────────────────────┘
```

### 11.6 Aspect lenses (data-driven, not hard-coded)

| Lens | Renders | Example (GPU-16) |
|---|---|---|
| **Overview** | Always — current inspector | Temp, load, CFM, vibration, status |
| **Electrical** | `view:'both'` | Busbar → PSU → trays (SVG + 3D) |
| **Cooling** | `view:'both'` | CRAC → cold aisle → fan tray + filter |
| **Mechanical** | `view:'3d'` | Exploded internals; faulted part red |
| **Controls** | `view:'svg'` | BMS setpoints, writable points |
| **Plumbing** | plants only | CDU loop, valves, pressures |
| **Everything** | Always | All aspects + work order + AI explain |

**Rendering contract:**
- `view:'3d'` → `rackdesign.build(component, aspectKey)` — Three.js group, exploded
- `view:'svg'` → `schematic.draw(component, aspect.schematic)` — SVG nodes coloured by status
- `view:'both'` → toggle 3D/2D

Adding a new aspect = **pure data** in `design.aspects[]` — no UI rewrite.

### 11.7 Move & correct (edit mode)

```
Enter on faulted part:
  • Part detaches, draggable in local space
  • Desktop: pointer-drag on ground plane
  • VR: joystick nudge or grab button
  • Ghost shows correct slot (correctOffset)
  • Snap when |pos - slot| < tolerance → fault.done = true
  • All faults done → correct(id) → status='corrected' → BLUE
  • Work order auto-closes in app.js service panel

On blue unit:
  • "Move & Correct" shows "Revert to fault"
  • revert(id) → status='fault', corrected=false
```

### 11.8 UI components

| UI | Location | Purpose |
|---|---|---|
| Selection ring | All 3D scenes | White pulse on picked unit |
| Context menu | `app.js` desktop | Floating menu at click point |
| VR buttons | `vr.js` `#info` | Internals · Circuit · Correct |
| Detail tabs | `#inspector` / `#info` | One tab per aspect + Overview + Everything |
| Exploded model | `rackdesign.js` | Internal parts as Three.js group |
| Circuit overlay | `schematic.js` | SVG schematic (reuses `.ol-*` CSS from single-line) |
| Fix checklist | Detail panel | `faults[]` as tickable steps (mirrors `ar.js` WO.steps) |
| Corrected badge | `styles.css` | Blue badge on corrected units |

### 11.9 Server persistence — `/api/components` (target)

```python
COMPONENTS = {}   # f"{twinId}:{id}" → {status, corrected, ts}
COMPONENTS_LOCK = threading.Lock()

# GET  /api/components?twinId=datacenter-A  → {"components":[...]}
# POST /api/components  {id, twinId, status, corrected}  → {"ok":true}
```

Client polls every 5s (like `admin.js` polls `/api/twins`) — fix on phone turns rack blue on laptop.

### 11.10 Seeded fault units

| Scene | Unit | Location in code |
|---|---|---|
| Data center | **GPU-16** | `sim.js` faultKey `2-3` |
| Smart factory | **PRESS-7** | `plants.js` `faulted: true` at z=-4 |
| Geothermal | **SEP-2** | `plants.js` separator at x=-7 |

### 11.11 Integration map (file by file)

| File | Change |
|---|---|
| `status.js` | NEW — enum + colours |
| `components.js` | NEW — registry, correct, sync |
| `rackdesign.js` | NEW — exploded 3D per aspect |
| `schematic.js` | NEW — SVG per aspect |
| `twin3d.js` | Pick → Component; selection ring; status-aware colour |
| `vr.js` | Reticle → aspect menu; status colour in loop |
| `plants.js` | Register machines as Components; status colour |
| `factory3d.js` | Status-aware colour in `frame()` |
| `app.js` | Inspector tabs; `onChange` refresh; auto-close work order |
| `ar.js` | On fix complete → `components.correct('GPU-16')` |
| `server.py` | `/api/components` GET/POST |
| `styles.css` | Context menu, tabs, corrected badge |

### 11.12 Build milestones

| Milestone | Deliverable | Demo criterion |
|---|---|---|
| **M1** | `status.js` + `components.js`; status-aware colour loops | `setStatus('GPU-16','corrected')` in console → blue rack |
| **M2** | Pick → menu → Overview/Everything tabs | Click GPU-16 → menu appears desktop + VR |
| **M3** | `rackdesign.js` + `schematic.js` | Aspect lenses show exploded 3D + SVG |
| **M4** | Drag-to-correct + `/api/components` | Complete fix → blue + persists reload + phone sync |

### 11.13 Current implementation (today)

What works **now** without the full component pipeline:

| Capability | Implementation |
|---|---|
| Fault visibility | `rk.faulted` → red pulse in `twin3d.js` / `vr.js` |
| Click to inspect | `onPickRack` → `#inspector` with telemetry |
| Work order | `twin.workOrder()` → service panel + email draft |
| AR fix checklist | `ar.js` 4-step WO for GPU-16 (no 3D colour transition) |
| Chat focus | `focusRack` action → camera + panel |
| Plant faults | PRESS-7, SEP-2 LED pulse in `plants.js` |

**Gap to full rack inspect E2E:** wire modules into `app.js` / `twin3d.js` / `vr.js` / `ar.js`; add `/api/components` to `server.py`; seed GPU-16 as `Component` on load.

### 11.14 Acceptance criteria (full system)

1. Click/tap selects unit (white ring) + context menu
2. Menu: Overview · [dynamic aspects] · Everything · Move & Correct
3. Each aspect shows proper design; faulted part/node highlighted red
4. Drag/snap or checklist completes faults
5. All faults done → unit turns **blue `#19c6ff`**; work order closes; state persists
6. Blue units remain clickable; Revert available
7. Status colour overrides temperature tint

---

## 12. Multi-twin platform

### Admin panel (`admin.js`)

- Built-in data-center card (always present)
- Dynamic cards from `GET /api/twins` (poll every 5s)
- Create flows: phone scan QR, blueprint upload, Twin Studio, brownfield ingest

### Twin types

| Type | Route | Builder |
|---|---|---|
| `datacenter` | `/datacenter` | Built-in `sim.js` + `twin3d.js` |
| `factory` | `/factory` | `builder.js`, `scan.js`, blueprint |
| `nuclear` | `/factory?type=nuclear` | `plants.js` |
| `geothermal` | `/factory?type=geothermal` | `plants.js` |
| `solar` | `/factory?type=solar` | `plants.js` |

### Twin Studio (`builder.js`)

- Palette: land, room, rack, crac, chiller, compressor, cooler, fan, motor, pump, cnc, conveyor, sensors
- Drag/drop on canvas OR `POST /api/design` with `localDesign()` fallback
- Open-Meteo wind arrow from geolocation
- `activateBtn` → `POST /api/twins` → redirect `/factory`

### Twin Pro (`twinpro.js`)

Alternate glass-console view over same `Twin` + `Twin3D` engine — Analytics · Configurator · Simulations tabs.

---

## 13. Enterprise ingestion

**Spec:** [`../tejas-twin/ingestion.md`](../tejas-twin/ingestion.md)  
**UI:** `ingest.html` + `ingest.js` — 6-step brownfield wizard

### Principle

> Drawing is **review/edit**, not the source of truth for enterprise brownfield. The moat is the **calibrated twin** matched to historian telemetry.

### Six wizard steps (implemented UI)

| Step | Panel | Real vs simulated |
|---|---|---|
| 1 Connect | BACnet, Modbus, OPC-UA, Redfish, SNMP, CDU, Historian checkboxes | UI only — no live connectors |
| 2 Discover | Animated log + asset grid | **Simulated** handshake |
| 3 Layout | Interactive hall: rows, racks/row, CRAH, CDU, kW/rack, air↔liquid toggle | **Real** topology → `draftSpec.layout` |
| 4 Clarify | `POST /api/ingest/questions` + assumptions ledger | **Real** LLM; fallback `FALLBACK_Q` |
| 5 Calibrate | Progress bar ±0.8°C, ±6%, 92% quality | **Simulated** |
| 6 Activate | `POST /api/twins` brownfield registration | **Real** twin record |

### `draftSpec` shape

```js
{
  site, connectors[], halls, points, ups, cooling, sensors{}, gaps[],
  racks, gpuRacks, crah, cdu, kwPerRack, itPowerMW,
  layout: {
    rows, racksPerRow, coldAisles, liquidRows[],
    airRacks, liquidRacks, ...
  }
}
```

### Canonical Twin Spec (production target)

Typed graph: racks, CRAHs, CDUs, chillers, power chain, topology edges, actuators, sensors, safety envelope. See `ingestion.md` §3 for full node/edge schema.

### Ingestion lanes (ranked)

| Lane | Fidelity | Role |
|---|---|---|
| A. Connector import (DCIM/BMS/historian) | Highest | Brownfield default |
| B. Document/CAD/CFD extraction | High | Fill connector gaps |
| C. Structured bulk import (CSV) | High | Fast bootstrap |
| D. Drawing canvas | Low–Med | Greenfield / review |
| E. Walk-through scan | Med geometry | Future accelerator |

### Production pipeline

```
Discover → Normalize → Historian export → Draft spec → AI clarify →
Validate → Calibrate → (optional CFD) → Shadow twin → Control ladder
```

---

## 14. Field AR, VR, scan

### Field AR (`ar.js`)

**Mode 1 — Fix GPU-16:**
1. `goNav()` — simulated walk to rack
2. `goScan()` — reticle lock
3. `doLock()` — AR rings + fault card (`WO` struct)
4. `goFix()` — 4-step checklist from `WO.steps`
5. `nextStep()` → success overlay  
   **Target:** step 5 calls `components.correct('GPU-16')` → desktop rack turns blue

**Mode 2 — Build twin:**
1. Camera capture → `POST /api/vision`
2. Blueprint SVG overlay + live sensor chips
3. `tickSensors()` — simulated values
4. Power/speed controls

### VR (`vr.js`)

- First-person inside datacenter or plant
- Reticle pick → `#info` inspect card
- Joystick + gyro + Cardboard split-screen
- **AI voice assistant** (`#assistant` overlay): floating **💬 Ask Tejas** toggle opens a full-screen assistant you can leave and return to. Push-to-talk (`SpeechRecognition`: tap the 🎙️ mic **or press `T`** to talk, again to send) + spoken replies (`speechSynthesis`); routes through `askBrain` → `POST /api/chat` (OpenAI, with local fallback).
- `siteContext()` builds a live facility **spec** (rack count, GPU models, nameplate/now kW, PUE 1.30 vs 1.60, cooling, savings, GPU-16 fault); `assistantContext(rack)` appends that rack's deep detail. Server-side, `context_block()` renders the spec under **FACILITY SPEC** so the model answers size/spec questions concretely.
- **Ask AI about this rack** button in `#info` opens the assistant scoped to the inspected rack.
- **Target:** aspect lens buttons under reticle (Internals, Circuit, Correct)

### Voice · Tej (`app.js` desktop, `vr.js` in-VR)

A thin voice layer over the existing chat brain — no separate UI surface on the desktop page:

- **Input** — Web Speech `SpeechRecognition`. **Press `T`** anywhere (or tap the 🧠 **`.voice-btn`** logo) to start; interim transcript streams into the chat box (`#cmdInput`); press `T`/tap again to send. Push-to-talk, ignored while a text field is focused.
- **Routing** — the transcript runs through the normal `runCommand()` → `askBrain()` → `POST /api/chat` (OpenAI, local fallback), so voice and text share one brain and the same twin-driving actions.
- **Output** — `speechSynthesis` reads the reply **only when the question came by voice** (`answerAloud` flag); typed chat stays silent. While speaking, the logo **glows** (`.voice-btn.speaking`); pressing `T`/tapping it **mutes** (`speechSynthesis.cancel()`).
- **Context depth** — `chatContext()` returns `tejSiteCtx()` (live state + facility spec) normally, or `tejRackCtx(id)` for in-depth, rack-specific answers while a rack's detail screen is open. Server-side these land under **FACILITY SPEC** in `context_block()`.
- **Rack-detail chat dock** — the full-screen rack detail (`#detail`) carries its own `#detailChat` dock (`.dc-*`): a 🧠 mic + transcript + input scoped to the inspected rack. `detailOpen()`/`activeInput()` route voice and the `T` key to this dock (and `tejRackCtx(detailId)`) while it's open, and back to the main console otherwise; `runDetailChat()` renders/speaks the reply.
- **In VR** (`vr.js`) the same voice + spec context power the `#assistant` overlay (a full screen is appropriate on the phone walk-in); `/datacenter` keeps it to logo + `T` driving the on-page chat.

### Phone scan (`scan.js`)

1. 9s guided video recording
2. Simulated reconstruction progress
3. `POST /api/twins` `{type:'factory', method:'scan'}`
4. Admin poll shows new twin card

---

## 15. Plant twins — `plants.js`

### `PLANTS` metadata

| Type | Icon | Key sensors | Seeded fault |
|---|---|---|---|
| `factory` | 🏭 | Line output, OEE, motor temp, vibration | **PRESS-7** |
| `nuclear` | ☢️ | Reactor power, core temp, coolant flow | — |
| `geothermal` | 🌋 | Steam temp, wellhead pressure, turbine RPM | **SEP-2** |
| `solar` | 🔆 | DC/AC power, panel temp, irradiance | — |

### Builders

- `buildFactory()` — 12 stations, conveyors, workers, AGV
- `buildNuclear()` — reactor domes, turbine hall, cooling towers
- `buildGeothermal()` — wells → separators → turbine → condenser → reinjection (colour-coded pipes)
- `buildSolar()` — tracking PV rows, inverters, sun

### `animatePlant(sinks, dt, t, power)`

Animates rotors, solar trackers, conveyor parts, workers, AGVs, steam particles, reactor pulse, fault LED colours.

### `statusUnit()` / `machineStation()` / `separator()`

Attach `userData.rack = {name, base, faulted, load, led, isMachine, temp}` for VR picking and future Component registration.

---

## 16. End-to-end data flows

### Data-center live loop

```
┌──────────────────────────────────────────────────────────────┐
│  app.js RAF loop                                              │
│    Twin.tick() ──► sim.js physics                            │
│    scene.update() ──► twin3d.js colour/airflow               │
│    updateHUD() ──► panels, inspector, charts                 │
│    runCommand() ──► genui.askBrain(msg, ctx)                 │
│      POST /api/chat ──► server.py ──► OpenAI/Ollama          │
│      ◄── {reply, actions[]} ──► applyActions()               │
└──────────────────────────────────────────────────────────────┘
```

### Cross-device twin sync

```
scan.js / ingest.js / builder.js
  POST /api/twins
admin.js
  GET /api/twins every 5s
```

### Target: component fix sync

```
ar.js / app.js correct()
  POST /api/components
app.js / twin3d.js / vr.js
  GET /api/components every 5s
  components.onChange() → recolour mesh
```

### Chat action pipeline

```
User message
  → ctxForBrain() injects live state
  → SYSTEM_PROMPT + context_block
  → LLM JSON {reply, actions}
  → sanitize() in genui.js
  → applyActions() in app.js
  → twin / scene / panels update
```

---

## 17. Trust ladder & safety

### Deployment phases

```
PHASE 0 · TWIN       Build model; train in sim; zero hardware
PHASE 1 · SHADOW     Read-only; log would-do vs reality
PHASE 2 · ADVISORY   AI recommends; human applies
PHASE 3 · SUPERVISED AI writes; human confirms each change
PHASE 4 · AUTONOMOUS Closed-loop inside hard envelope; instant revert
```

### Safety Supervisor (production)

Separate auditable component outside the AI:

- Hard envelope clamp on every command
- Rate limits on setpoint changes
- Sensor dropout / anomaly → instant revert to baseline
- Every action logged: who, what, why, triggering state
- BMS priority array arbitration — operator override always wins

### Demo safety (`tejasControl`)

Hard constraint in grid search: `worstInlet ≤ inletRecMax - aiMargin`. No external Safety Supervisor process in demo — constraint is in the optimizer.

---

## 18. Security & sovereignty

| Property | Demo | Production |
|---|---|---|
| Data residency | All local (browser + server on laptop) | On-prem edge box |
| LLM | OpenAI optional; Ollama local; built-in parser | Ollama default; no cloud required |
| Secrets | `OPENAI_API_KEY` env or `.tejas-secret` (git-ignored) | Vault / env per site |
| HTTPS | Self-signed auto-cert for phone camera | Customer cert or internal CA |
| OT write path | Not implemented | Segmented; Safety Supervisor gates writes |
| Audit | Chat log in UI | Full setpoint audit trail |

---

## 19. Deployment & operations

### Quick start

```bash
cd tejas-twin
export OPENAI_API_KEY=sk-...   # optional
./run.sh
# → https://localhost:7878 (or http if TEJAS_HTTP=1)
```

### Phone access

Same Wi-Fi → `https://<LAN-IP>:7878` (cert warning → Advanced → Proceed)

### Requirements

- Python 3.8+
- `openssl` CLI (for HTTPS cert generation)
- Modern browser with ES modules + WebGL
- Optional: Ollama at `localhost:11434`
- Optional: OpenAI API key

### No dependencies

- No `pip install`
- No `npm install`
- Three.js vendored in `public/vendor/`

---

## 20. Demo vs production matrix

| Area | Demo (`tejas-twin`) | Production target |
|---|---|---|
| Twin engine | `sim.js` lumped model | EnergyPlus + Sinergym; calibrated |
| Optimizer | Grid-search `tejasControl` | MPC + RL (Stable-Baselines3) |
| Telemetry | Simulated sensor values | BACnet/Modbus/Redfish/OPC-UA connectors |
| Safety | In-optimizer constraints | Separate Safety Supervisor process |
| Sim-to-real | UI narrative (autonomy card) | Shadow → advisory → supervised → autonomous |
| Gen-UI | Chat + panel show/hide | Full Ollama component registry |
| Ingestion | 6-step wizard; steps 2/5 simulated | Connector SDK + calibration + M&V |
| Rack inspect | Fault pulse + inspector + AR checklist | Full red→blue lifecycle (§11) |
| BMS write | Not built | BACnet priority array writes |
| Fleet | Projection panel (multiply savings) | Multi-site cloud dashboard |
| CFD | Not built | 6SigmaDCX offline for recirculation params |
| Phone scan | Simulated reconstruction | Photogrammetry + vision pipeline |

### What works end-to-end today

1. Data-center demo — live physics, 3D, PUE, heat-wave, chat actions
2. GPU-16 maintenance — alerts, work order, email, AR fix steps
3. Multi-twin admin — scan/blueprint/studio → factory viewer
4. Four plant types in VR + factory view
5. Brownfield ingest wizard — layout + AI questions + twin registration
6. Vision API — `/api/vision` for AR build mode
7. Offline resilience — `localParse`, `localDesign`, `FALLBACK_Q`

---

## 21. Extension points & roadmap

### Near-term (rack inspect M1–M4)

1. Ship `status.js`, `components.js`
2. Wire status colour into `twin3d.js`, `vr.js`, `plants.js`
3. Context menu + aspect tabs in `app.js` / `vr.js`
4. `rackdesign.js`, `schematic.js`
5. `/api/components` + AR → `correct()` on fix complete

### Medium-term (enterprise)

1. Pluggable connector SDK (BACnet, Modbus, OPC-UA, Redfish)
2. Historian export + calibration pipeline
3. Shadow mode logging (would-do vs BMS)
4. Safety Supervisor as separate service
5. MPC controller replacing grid search

### Long-term

1. EnergyPlus/Sinergym twin per customer
2. RL policy trained per site
3. CFD-informed recirculation parameters
4. Fleet cloud (optional) for multi-site ops
5. Vernacular STT/TTS (Whisper, Piper)

---

## 22. Appendix — API reference

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/api/health` | — | `{ok, brain, model, vision?}` |
| GET | `/api/info` | — | `{ips[], port}` |
| GET | `/api/twins` | — | `{twins[]}` |
| POST | `/api/twins` | `{name, type, method, components?, bounds?, spec?}` | `{ok, twin}` |
| POST | `/api/chat` | `{message, context}` | `{ok, brain, reply, actions[]}` |
| POST | `/api/vision` | `{image: dataURL, hint?}` | `{ok, brain, name, parts, sensors, steps}` |
| POST | `/api/design` | `{prompt}` | `{ok, name, components[]}` |
| POST | `/api/ingest/questions` | `{spec}` | `{ok, questions[]}` |
| GET | `/api/components` | `?twinId=` | `{components[]}` *(target)* |
| POST | `/api/components` | `{id, twinId, status, corrected}` | `{ok}` *(target)* |

---

## 23. Appendix — file index

| Concern | Primary files |
|---|---|
| Server / APIs | `tejas-twin/server.py` |
| Physics / GPU-16 | `tejas-twin/public/sim.js` |
| Data-center UI | `tejas-twin/public/app.js`, `datacenter.html` |
| 3D datacenter | `tejas-twin/public/twin3d.js` |
| Chat brain client | `tejas-twin/public/genui.js` |
| Plants / faults | `tejas-twin/public/plants.js` |
| Factory 3D | `tejas-twin/public/factory3d.js` |
| VR walkthrough | `tejas-twin/public/vr.js`, `vr.html` |
| Field AR | `tejas-twin/public/ar.js`, `ar.html` |
| Brownfield ingest | `tejas-twin/public/ingest.js`, `ingestion.md` |
| Twin Studio | `tejas-twin/public/builder.js` |
| Admin | `tejas-twin/public/admin.js` |
| Rack inspect spec | `tejas-twin/ARCHITECTURE-rack-inspect-fix.md` |
| Status / components *(target)* | `status.js`, `components.js`, `rackdesign.js`, `schematic.js` |
| Product strategy | `project.md`, `architect.md` |
| Sales narrative | `story.md` |
| Pitch kit | [`pitch/pitch.md`](./pitch/pitch.md), [`pitch/Tejas-AI-Pitch-Deck.pptx`](./pitch/Tejas-AI-Pitch-Deck.pptx) |

---

*Tejas AI — the autonomous brain for cooling and energy. Built in India. Ready for the world.*

*Run it: `cd tejas-twin && ./run.sh` → https://localhost:7878*