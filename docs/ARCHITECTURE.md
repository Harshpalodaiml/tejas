# Tejas AI — System Architecture

> Physics-first digital twin + autonomous cooling brain.  
> Runnable prototype: `tejas-twin/` · Layer design: [`architect.md`](./architect.md) · Ingestion: [`../tejas-twin/ingestion.md`](../tejas-twin/ingestion.md)  
> **Demo:** [Video](https://accuconsult-my.sharepoint.com/:v:/g/personal/harsh_zenalyst_ai/IQCCDlXCZ5lwR5V-T7A_N7cMAT15xtCeoMB5dCppqR4f2d8?e=lg9S4D) · [Deck](https://canva.link/348k4b76wzcfxen)

---

## 1. What this is

Tejas AI is a **thermal cyber-physical system**: a calibrated physics twin (L1), constrained optimiser (L2), safe deployment ladder (L3), and voice-driven gen-UI (L4). The moat is **twin + control policy + site data** — not the dashboard.

```
  L4  Gen-UI + voice     talk → panels build → actions on twin
  L3  Trust ladder       shadow → advise → supervised → autonomous
  L2  Optimisation       predict + minimise energy s.t. safety
  L1  Digital twin       thermodynamics of the facility
```

---

## 2. Physics model

### Spatial scale

```
Fleet → Campus → Hall → Rack → Component
```

Control constraints propagate **up** (worst rack inlet bounds the hall). Weather and load propagate **down**.

### Fidelity tiers

| Tier | Engine | Use |
|---|---|---|
| T0 | `sim.js` (browser, ~50 Hz) | Demo, training, RL curriculum |
| T1 | EnergyPlus + Sinergym | Production twin, MPC horizon |
| T2 | CFD offline → recirc params | Hot-aisle / containment calibration |

### Governing equations (`sim.js` today)

**Air-side balance**
```
ΔT_return = Q_IT / (UA_air · fanFrac)
```

**Rack inlet** (recirculation + hotspot + fault residual)
```
ε(f) = ε_base + ε_gain · (1 − f)²
T_inlet = T_supply + ε·(T_return − T_supply) + α·P_rack + ΔT_fault
```

**Chiller COP** (degrades in heat, improves with warmer CHW)
```
COP = COP₀ · (1 − k_amb·ΔT_amb) · (1 + k_chw·ΔT_chw)
```

**Fan power** — affinity law: `P_fan ∝ fanFrac³`

**Envelope leak:** `Q_leak = (T_amb − T_room) / R_env`

**Efficiency:** `PUE = P_total / P_IT`

**Safety (hard):** rack inlet ≤ 27°C recommended (ASHRAE A1), ≤ 32°C allowable; optimiser holds 1.5°C margin.

**Maintenance residual:** `r = T_inlet,meas − T̂_inlet(load, u, θ)` — GPU-16 flags +3.4°C unexplained drift.

### Control formulation (L2)

- **MPC (production day-one):** minimise `Σ P_total` over horizon H subject to twin dynamics + safety inequalities.
- **RL (edge):** train in Sinergym; deploy only after shadow M&V.
- **Demo:** `tejasControl()` grid-searches supply temp + fan speed vs `baselineControl()` (reactive BMS).

Disturbances: `d = [weather forecast, rack power, thermal mass]`.  
Actuators: `u = [T_supply, fanFrac, chiller stage, CDU flow]`.

---

## 3. Scalable production topology

Prototype = single `server.py` + browser `Twin.tick()`. Production scales **edge → fleet** without changing the four-layer API.

```
                    ┌─────────────────────────┐
                    │  Fleet plane (optional)  │
                    │  M&V · policy registry   │
                    └───────────┬─────────────┘
                                │
┌───────────────────────────────▼───────────────────────────────┐
│  Site edge (on-prem)                                           │
│  Gateway → Safety Supervisor → BMS/DCIM/Redfish/BACnet/Modbus   │
│  Twin Engine (EnergyPlus) · Optimiser (MPC/RL) · Historian    │
│  Ollama (gen-UI)                                               │
└───────────────────────────────┬───────────────────────────────┘
                                │
         Operator browser · VR · Field AR (phone)
```

| Service | Role |
|---|---|
| **Gateway** | OT connectors, normalise points → Twin Spec graph |
| **Twin Engine** | Roll-forward physics, calibration jobs |
| **Optimiser** | MPC (&lt;30s) or RL inference (&lt;100ms) |
| **Safety Supervisor** | Hard clamp on every write; anomaly → baseline |
| **Historian** | Telemetry, shadow diff, audit trail |
| **Fleet plane** | Multi-site admin, IPMVP, savings-share billing |

**Ingestion pipeline:** Discover → Normalise → Historian → Draft spec → AI clarify → Calibrate → Shadow twin.

---

## 4. Runnable prototype (`tejas-twin/`)

One command: `./run.sh` → https://localhost:7878. Python stdlib server + browser ES modules + vendored Three.js. **No pip, no npm.**

### Runtime

- Server: `ThreadingHTTPServer` on `:7878`, auto TLS for phone AR/scan
- Simulation: **entirely in browser** — `Twin.tick()` in `app.js` RAF loop
- AI brain: OpenAI → Ollama → `localParse()` fallback

### Key routes

| URL | App |
|---|---|
| `/` `/admin` | Twin registry, create flows |
| `/datacenter` | Flagship 3D hall + physics + chat |
| `/vr` `/ar` | VR walk · Field AR (GPU-16 fix) |
| `/ingest` | 6-step brownfield wizard |
| `/build` | Twin Studio |
| `/factory` | Factory / plant twins |

### Core modules

| File | Role |
|---|---|
| `sim.js` | Thermal physics, `Twin`, `tejasControl`, GPU-16 fault |
| `app.js` | Orchestration, HUD, chat actions |
| `twin3d.js` | Three.js hall, temp colour, airflow |
| `genui.js` | Chat client → `/api/chat` |
| `server.py` | APIs, LLM routing, twin registry |

### Chat actions (`POST /api/chat`)

Returns JSON `{ reply, actions[] }`. Types: `setWeather`, `setLoad`, `setMode`, `show`, `focusRack`, `setFleet`.

Context injected every request: PUE, power, savings ₹, hottest rack, alerts, autonomy mode.

---

## 5. Trust ladder & safety

```
TWIN → SHADOW (read-only) → ADVISORY → SUPERVISED → AUTONOMOUS
```

- Shadow logs **would-do vs BMS** — zero risk pilot.
- Production writes pass **only** through Safety Supervisor (rate limits, envelope clamp, instant revert).
- Demo enforces safety inside `tejasControl()` grid search.

---

## 6. Rack inspect (red → blue)

Click rack → aspect lenses (electrical, cooling, mechanical) → fix fault → status `corrected` → **blue**. Modules: `status.js`, `components.js`, `rackdesign.js`, `schematic.js`. Full spec: [`../tejas-twin/ARCHITECTURE-rack-inspect-fix.md`](../tejas-twin/ARCHITECTURE-rack-inspect-fix.md).

Seeded faults: **GPU-16** (DC), **PRESS-7** (factory), **SEP-2** (geothermal).

---

## 7. Demo vs production

| Area | Demo | Production |
|---|---|---|
| Twin | `sim.js` lumped model | EnergyPlus + Sinergym |
| Optimiser | Grid search | MPC + RL |
| Telemetry | Simulated | BACnet / Modbus / Redfish |
| Safety | In-optimizer constraints | Safety Supervisor service |
| Fleet | Projection panel | Fleet control plane |
| Ingestion | Wizard UI (connectors simulated) | Live connector SDK |

---

## 8. API reference

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Brain status |
| GET | `/api/twins` | List twins |
| POST | `/api/twins` | Register twin |
| POST | `/api/chat` | Operator brain + actions |
| POST | `/api/vision` | AR build-from-camera |
| POST | `/api/design` | AI layout |
| POST | `/api/ingest/questions` | Brownfield clarify |

Target: `GET/POST /api/components` for rack fix sync.

---

## 9. Deeper reading

| Topic | Doc |
|---|---|
| Four-layer product design | [`architect.md`](./architect.md) |
| Every feature + roadmap | [`PRODUCT.md`](./PRODUCT.md) |
| Enterprise ingestion graph | [`../tejas-twin/ingestion.md`](../tejas-twin/ingestion.md) |
| App quick start + routes | [`../tejas-twin/README.md`](../tejas-twin/README.md) |
| Rack inspect E2E | [`../tejas-twin/ARCHITECTURE-rack-inspect-fix.md`](../tejas-twin/ARCHITECTURE-rack-inspect-fix.md) |

---

*Run: `cd tejas-twin && ./run.sh`*