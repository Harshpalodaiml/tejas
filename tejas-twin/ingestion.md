# Tejas AI — Digital-Twin Ingestion Architecture (enterprise)

> Scope: how a customer's data center becomes a **trustworthy, controllable, trainable**
> digital twin. This is the hard core — the moat is here, not in the UI.

---

## 0. The blunt verdict (read this first)

**"Draw it yourself" is a great demo and a fine tool for greenfield concepting — but it is NOT an acceptable *primary* ingestion path for an enterprise data center.** If we position drawing as the way twins get built, the product will fail technical due-diligence. Reasons:

1. **A twin is numbers, not a sketch.** Energy/thermal predictions you can *bill savings on* need quantitative engineering data: rack power, airflow (CFM/m³h), chiller COP curves, loop flow/temperatures, UPS/PDU efficiencies, setpoints and their limits. A drawing captures *topology and intent*, not the physics parameters. Drawing-only → a pretty model that is wrong by 20–40%, which is fatal for savings-share billing.
2. **The data already exists** in the customer's systems — re-drawing by hand throws it away and injects human error: DCIM (Nlyte, Sunbird, EcoStruxure IT, Vertiv), BMS (Niagara, Metasys, Desigo), electrical single-line diagrams, mechanical schematics/CAD, CFD models (6SigmaDCX, Future Facilities), asset registers, and the **historian** (OSIsoft PI, InfluxDB/Timescale) with months of telemetry.
3. **The moat is the *calibrated* twin** (matches measured reality within an error band) + accumulated per-site operational data. You cannot calibrate against nothing — calibration *requires* the telemetry, which means a connector, not a canvas.
4. **It doesn't scale.** 5k–50k assets across multiple halls and a fleet of sites cannot be hand-drawn.

**Optimal architecture:** *multi-modal ingestion* that converges every source onto one canonical **Twin Spec** graph. Drawing becomes the **review/edit/greenfield** lane on top of imported data — never the source of truth for a live site.

Two fundamentally different products hide under "ingestion," and they need different pipelines:

| | **Brownfield** (existing DC) | **Greenfield** (design stage) |
|---|---|---|
| Source of truth | BMS/DCIM/historian + drawings | the user's design intent (drawing/spec) |
| Telemetry | yes → **calibratable** → control-grade | none → physics-only → advisory/what-if |
| Drawing's role | topology review + gaps | primary capture (this is where drawing shines) |
| Billable on savings | yes (M&V vs measured baseline) | no (modelled estimate only) |

We must decide which we're building first — they share the spec, not the pipeline.

---

## 1. What ingestion must actually *produce*

Regardless of source, ingestion outputs four artifacts:

1. **Twin Spec (canonical graph)** — entities + relationships + parameters (§3).
2. **Telemetry binding** — map of each spec sensor/actuator to a real tag (BACnet/Modbus/SNMP/Redfish/OPC-UA point), with units and sign conventions.
3. **Calibration dataset** — historian export aligned to the spec, used to tune parameters until sim ≈ reality (§7).
4. **Control & safety model** — what is actuatable, the hard envelope (limits clamped outside the AI), redundancy topology, and fallback controller.

If a lane can't produce #1–#2 it yields an *advisory-only* twin (still useful, not billable on verified savings).

---

## 2. Ingestion lanes (multi-modal), ranked

| Lane | Fidelity | Effort | When |
|---|---|---|---|
| **A. Connector import** (DCIM/BMS/historian/asset API) | Highest | Medium (integration) | Brownfield, the default |
| **B. Document/CAD/CFD extraction** (SLD, mech PDF, IFC/Revit, CFD export) | High | Medium–High | Fills what connectors lack |
| **C. Structured bulk import** (CSV/Excel templates, rack elevations) | High | Low | Fast brownfield bootstrap |
| **D. Drawing canvas** | Low–Med | Low | Greenfield / concept / topology review |
| **E. Walk-through scan** (photogrammetry/LiDAR/360 + vision) | Med (geometry), Low (params) | High | Geometry/asset discovery; *future* |

**Design principle:** A/B/C produce a *draft spec automatically*; D is where a human (or the AI) reviews, connects, and fills gaps; E is a future accelerator. All four write the same Twin Spec.

---

## 3. The canonical Twin Spec (the "everything required")

A typed graph. Nodes = assets; edges = power feeds / cooling loops / airflow / data. Each node has **required** vs **optional** params (optional → AI infers or asks).

### 3.1 IT load (the heat source)
- **Rack / Row**: id, location (hall/row/position), U-height, count.
- **Rack power**: kW/rack — *required*. Derived path: server/**GPU SKU** (H100 700W, H200, B200 ~1000–1200W, GB200 NVL72 ~120kW/rack, generic CPU) × nodes/rack → kW. (SKU → TDP table is ours to maintain.)
- **Workload profile**: utilization avg/peak, diurnal/weekly pattern, **load-balancing policy** (how jobs move across racks — matters because it shifts the heat map; e.g., bin-packed vs spread, training vs inference).
- **Airflow demand**: CFM ∝ kW / ΔT (derived) — or measured.
- **Inlet limits**: ASHRAE class (A1–A4 / H1 for liquid), recommended/allowable.
- **Cooling interface per rack**: air | rear-door HX | direct-to-chip liquid (DLC) | immersion. (Determines which loop cools it.)

### 3.2 Cooling (heat removal) — each with a *performance curve*, not a single number
- **Air**: CRAC/CRAH — sensible capacity (kW), airflow, supply-temp setpoint range, fan type (EC/VFD) + fan curve, part-load efficiency.
- **Liquid**: CDU — capacity, primary/secondary loop temps, flow, approach.
- **Heat rejection**: chiller (air/water-cooled, **COP vs ambient + CHW-temp curve**, staging, min turndown), cooling tower (approach, **wet-bulb dependence**, water L/kWh), dry cooler.
- **Pumps**: flow, head, VFD (cube-law power).
- **Economizer / free cooling**: airside/waterside availability — *climate-dependent* (this is where location/wet-bulb matters most).
- **Containment**: cold-aisle / hot-aisle / none / chimney.

### 3.3 Power chain (the other half of PUE)
- Utility feed → **transformer** (loss curve) → **UPS** (efficiency curve, topology) → **PDU/busway** → rack.
- **Redundancy**: N / N+1 / 2N / 2N+1 — per system (cooling and power separately). Drives capacity headroom and what the AI may *not* switch off.
- **Generators** (resilience, not steady energy), STS/ATS.

### 3.4 Topology (edges — the "wires & pipes")
- **Chilled-water loop**: chiller → pump → CDU/CRAH → return (must be a *closed* loop).
- **Power feed tree**: source → … → rack (with A/B feeds for 2N).
- **Airflow path**: CRAH → cold aisle → rack → hot aisle → return.
- **Control network**: which controller owns which actuator.
- Topology defines **dependencies** (what cools/powers what) and **failure domains**.

### 3.5 Environment & site
- Location → **TMY climate** (dry-bulb + **wet-bulb** profiles) → free-cooling hours, chiller COP, tower performance. Water source/cost. Elevation (air density). Grid carbon + **tariff (incl. time-of-use, demand charges)**.

### 3.6 Controls, sensors, safety
- **Actuators** (action space): supply-air setpoint, fan speed, CHW setpoint, pump speed, chiller staging, CDU flow — each with min/max/rate-limit.
- **Sensors** (observation space): rack inlet temps, return temps, loop temps, power meters, ambient, humidity, flow, leak detection — with **tag binding, units, sample rate**.
- **Safety envelope**: hard limits clamped *outside* the agent; rate limits; anomaly → fallback to baseline controller.

---

## 4. Edge cases the ingestion MUST handle (non-exhaustive)

**Drawing / structural**
- Racks but no cooling; cooling but no heat rejection; power chain missing.
- **Open loop** (supply pipe with no return); CRAH connected to nothing.
- Disconnected / orphan assets; overlapping placements; duplicate ids.
- Containment undefined; mixed air+liquid in one hall.

**Physics / capacity**
- Cooling capacity < IT load (under-provisioned) → flag, don't silently "balance."
- **GPU density beyond air feasibility** (>~30–40 kW/rack) → AI must require liquid (DLC/immersion).
- Redundancy makes "installed capacity" ≠ "usable capacity" — don't count standby as available.
- Chiller min-turndown vs very low load (short-cycling).
- Wet-bulb too high for tower/economizer assumptions.

**Data quality**
- **Unit ambiguity**: kW vs kVA, °C vs °F, CFM vs m³/h, bar vs psi, US vs metric.
- Stale/incomplete nameplate; missing efficiency curves (→ use SKU defaults + flag).
- Telemetry: gaps, flatlines, stuck sensors, clock skew, unit mismatch vs spec, sign conventions.
- Tag mapping ambiguity (which point is "rack 7 inlet"?).

**Scale / governance**
- 10k+ assets; multi-hall; multi-site fleet with shared templates.
- Versioning: the DC changes (new racks) → twin drift → re-ingest/diff.
- Conflicting sources (DCIM says 8 kW, historian says 11 kW) → reconciliation policy.

---

## 5. The AI clarification loop (ask before building)

Pipeline: **parse sources → build partial spec → gap & plausibility analysis → score confidence → ask only what changes the answer → fill, re-score → gate to build.**

- **Gap detector** (deterministic rules) finds missing required params, open loops, capacity mismatches, unit ambiguity.
- **Question prioritizer** ranks gaps by *impact on energy/safety* (don't ask trivia). Ask GPU SKU/kW before asking paint color.
- **LLM** phrases questions in plain language, proposes a default with rationale, and accepts "use your best assumption."
- **Assumptions ledger**: every inferred/defaulted value is recorded, shown, and flagged in results ("modelled, not measured"). Trust = honesty about what's assumed.
- **Confidence gate**: build only when confidence ≥ threshold *or* user accepts an advisory-only twin. Examples of questions:
  - "40 racks @ 45 kW exceeds air cooling — direct-to-chip liquid or rear-door HX?"
  - "CRAHs present but no chiller/heat rejection — air-cooled chiller on site, or campus chilled-water feed?"
  - "Redundancy for cooling: N, N+1, or 2N? (sets how much I'm allowed to turn down)"
  - "Historian tag `AHU3.SAT` — is that supply-air temp in °C?"

---

## 6. Validation & plausibility (before anyone trusts it)

- **Energy/mass balance**: heat in (IT + losses + leak) ≈ heat rejected. Power chain sums to metered total.
- **Capacity checks** per failure domain (with redundancy removed).
- **Code/intent**: ASHRAE envelope reachable; containment consistent.
- **Back-test**: replay a historian week through the twin → error band on temps & energy.
- Output a **twin quality score** + the assumptions ledger.

---

## 7. Calibration (sim→reality) — the moat

- Tune uncertain params (recirculation, leak, UA, COP offsets) until simulated temps/energy match measured within a band (e.g., temps ±1°C, energy ±5–10%).
- **Data needed**: ≥30 days of historian (ideally spanning load + weather range), at ≥1-min resolution, for the bound sensors.
- Methods: parameter estimation / Bayesian calibration; per-site result is a **proprietary asset** that compounds.
- No telemetry → no calibration → advisory-only twin (state this clearly).

---

## 8. Simulation engine (don't over- or under-build)

| Engine | Fidelity | Cost | Use |
|---|---|---|---|
| **Reduced-order (RC/airflow/COP)** — what the demo uses | Med | Cheap, real-time, RL-trainable | Default for energy + control |
| **EnergyPlus + Sinergym** | High (building energy) | Medium | Credible energy, RL env |
| **CFD (6SigmaDCX / Future Facilities)** | Highest (airflow/hotspots) | Expensive (GPU-hours, not real-time) | Design & periodic recalibration, *not* the control loop |

**Recommendation:** hybrid — reduced-order model *in the control loop*, calibrated against telemetry, with optional CFD offline to inform recirculation/airflow params. RL trains on the fast model.

---

## 9. Agent training (after the twin exists)

- **Observation**: leading indicators (rack power, ambient/wet-bulb forecast, inlet/loop temps, flows).
- **Action**: setpoints/fan/pump/chiller/CDU within hard limits + rate limits.
- **Reward**: − total energy (or PUE/WUE) s.t. inlet ∈ band (hard penalty), equipment & redundancy constraints, switching/stability penalty.
- **Curriculum**: mild→heatwave, low→peak load, **fault injection** (sensor dropout, chiller trip) so the policy is robust.
- **Offline RL / warm start** from historian (learn from the operators' history before sim).
- **Sim-to-real**: domain randomization over uncertain params; validate safety never violated; energy vs baseline.
- **Deploy ladder**: shadow → advisory → supervised → autonomous, each gated on measured results.
- **Continual learning**: real data fine-tunes the per-site policy; drift detection triggers re-calibration.

---

## 10. Cost — think like the buyer's CFO

**Cost drivers (what makes a twin expensive):** data availability (biggest), number of cooling/power assets, fidelity required (CFD is the cost cliff), telemetry integration complexity (protocols, tag mapping), and whether closed-loop control (raises safety/validation cost) vs advisory.

| Phase | Cost shape | Notes |
|---|---|---|
| Connector/integration | one-time eng. | per BMS/DCIM/historian + protocol |
| Twin build + calibration | one-time eng. (days–weeks/site) | drops sharply once templated per customer |
| Compute — reduced-order | negligible (CPU, real-time) | runs on the edge box |
| Compute — CFD | high (GPU-hours, periodic) | only if we offer hotspot-grade fidelity |
| Compute — RL training | moderate (GPU, per policy/site) | amortized; reuse base policy |
| Opex | telemetry storage + retraining + M&V | per site/month |
| Edge hardware | one-time per site | industrial mini-PC (runs model + agent + local LLM) |

**Pricing alignment:** brownfield → **savings-share** (verified M&V; needs calibration). Greenfield/advisory → **SaaS + paid twin-build engagement**. Don't promise savings-share on an uncalibrated (drawing-only) twin.

---

## 11. Security, governance, compliance

- **On-prem / sovereign by default** — telemetry & control never leave site; local LLM for the clarification/UI layer.
- **OT segmentation** — read path and write path isolated; the safety supervisor is a separate, simple, auditable component that can veto the AI.
- **Auth/RBAC, audit log** of every setpoint change (who/what/why).
- **Data residency**, retention, PII-free (it's machine data, but access still governed).
- **Versioning & change management** of the twin (it's tied to billing and control).

---

## 12. Recommended architecture (one diagram in words)

```
SOURCES                 EXTRACTORS           CANONICAL              REASONING            ENGINE
DCIM/BMS API ─┐        ┌ asset/topology ┐                         ┌ gap detect ┐
historian ────┼──────►│ telemetry map  │──►  TWIN SPEC (graph) ──►│ AI Q&A     │──► calibrate ──► reduced-order sim
SLD/CAD/CFD ──┤        │ doc/CAD parse  │     + telemetry binding  │ validate   │      (vs telemetry)   │
CSV templates ┤        │ unit normalize │     + assumptions ledger └ confidence ┘                       ▼
drawing canvas┘        └ drawing→graph  ┘            ▲                                          RL / MPC agent
                                                     └──────── human review on the canvas ───────┘  │
                                                                                                     ▼
                                                                              shadow → advise → supervised → control
```

Drawing is **one extractor and the review surface** — not the spine.

---

## 13. Decisions I need from you (architecture forks)

These change the whole build; I won't guess on them:

1. **Brownfield or greenfield first?** (Existing DC with BMS/DCIM/historian, or design-stage with no telemetry?) — picks the entire primary pipeline.
2. **Fidelity:** energy/PUE reduced-order (real-time, trainable) vs CFD-grade hotspot accuracy (expensive, offline)?
3. **End goal:** closed-loop **control**, or **advisory/what-if** only? (Sets the safety + validation bar and the cost.)
4. **Cooling regime:** air, or high-density **liquid** (DLC/immersion) — what rack densities are we targeting?
5. **Source systems available:** which DCIM/BMS, which historian, which protocols (BACnet/Modbus/SNMP/Redfish/OPC-UA)?
6. **Scale:** one hall, one site, or a fleet?
7. **Deployment & budget:** on-prem sovereign? edge box per site? rough budget envelope per site?
8. **Who signs off safety** for control, and what regulatory constraints apply?

---

## 14. Chosen profile → tailored architecture
**Brownfield · Closed-loop control · Hybrid fidelity · Mixed air+liquid.**
This is the hardest, highest-value path: the AI will *write setpoints to a live data center* with both air and liquid cooling. Everything below is shaped by that.

### 14.1 What this combination forces (non-negotiables)
- **A write path = a safety problem, not a feature.** Control-grade means a separate, dumb, auditable **Safety Supervisor** that clamps every command *outside* the AI, plus instant revert. The AI is never trusted alone.
- **Calibration is mandatory** (you chose brownfield + control + savings). No calibrated twin → no control. Needs historian access.
- **Two coupled cooling worlds** (air + liquid) sharing heat rejection — the model and the agent must handle both and their interaction.
- **Hybrid sim**: reduced-order model runs the control loop in real time; CFD runs offline to inform air recirculation params and is *not* in the loop.

### 14.2 Brownfield ingestion pipeline (concrete)
1. **Discover**: pull asset/topology from DCIM (Nlyte/Sunbird/EcoStruxure) + rack elevations; pull point list from BMS (BACnet/Modbus/OPC-UA) and IT/liquid telemetry (Redfish/SNMP, CDU APIs).
2. **Normalize**: units, sign conventions, tag → spec binding (semi-automated; AI proposes mappings, human confirms the safety-critical ones).
3. **Historian export**: ≥30–90 days, ≥1-min, spanning load + weather range, for every bound point.
4. **Draft spec**: auto-built graph; drawing canvas is only for *review/gap-fill*.
5. **AI clarification** (§5) on what's missing or ambiguous, prioritized by impact.
6. **Validate + back-test** (§6) against a held-out historian week.
7. **Calibrate** (§7) air + liquid loops separately, then jointly.
8. **Hybrid tune**: optional CFD pass to fix recirculation/airflow params; fold back into the reduced-order model.

### 14.3 Mixed air + liquid model
- **Heat split per rack**: fraction to chip (DLC/immersion) vs to air. Typical DLC captures ~70–90% to liquid, remainder to air → *both* loops serve the same rack.
- **Two loops, shared or separate rejection**: TCS (technology cooling (liquid) loop via CDU) + CRAH air loop, both rejecting to chiller/tower. Warm-water liquid loops unlock far more free-cooling hours (big efficiency lever the agent should exploit).
- **Coupled constraints**: chip temp (Tj/coolant supply) for liquid; inlet air temp (ASHRAE) for air. The agent optimizes energy s.t. *both* envelopes.

### 14.4 Closed-loop control architecture (the write path)
```
        ┌───────────────── Tejas Edge Box (on-prem, OT) ──────────────────┐
telemetry│  reduced-order twin  →  RL/MPC agent  →  proposed setpoints      │
  in ───►│                                            │                     │
        │                              ┌─────────────▼──────────────┐      │
        │                              │  SAFETY SUPERVISOR (separate│      │
        │                              │  simple, auditable):        │      │
        │                              │  • hard envelope clamp      │      │
        │                              │  • rate limits              │      │
        │                              │  • heartbeat/watchdog       │      │
        │                              │  • anomaly → revert baseline│      │
        │                              └─────────────┬──────────────┘      │
        └────────────────────────────────────────────┼─────────────────────┘
                                                       ▼ writes (BACnet priority array, etc.)
                                          existing BMS / CDU controllers  ──► plant
                                          (command arbitration; operator override always wins)
```
- **Never command breakers/valves that risk equipment**; actuate **setpoints + speeds + staging** only, inside limits.
- **Coordinate, don't fight** the existing BMS (use priority arrays / supervisory setpoints; respect local loops).
- **Deploy ladder is the de-risking**: shadow (read-only, log would-be actions) → advisory → supervised (operator confirms) → autonomous, each gated on measured results + a commissioning sign-off (Management of Change).

### 14.5 Edge cases specific to this profile
- BMS point is read-only / not writable → start advisory until write access provisioned.
- Write conflicts with existing BMS schedules → arbitration + priority.
- Liquid: leak detection, coolant temp/flow loss, CDU trip → immediate failsafe.
- Sim-to-real gap on the liquid loop (less historical data than air).
- Mixed-mode hand-off (free-cooling ↔ mechanical) instability.
- Telemetry/network loss → watchdog → safe baseline.
- Savings attribution across two loops for M&V.

### 14.6 M&V (because savings-share)
- IPMVP-style: agree a **baseline model** (the dumb BMS under matched weather/load), normalize for weather + IT load, report verified kWh/₹/CO₂ (and WUE for water). Auditable — this is what billing is computed from.

### 14.7 Cost shape for THIS profile (highest tier)
- One-time: connector integration (per BMS/DCIM/historian + protocols), **dual-loop calibration**, control **commissioning + safety validation** (the expensive part of closed-loop), optional CFD pass.
- Recurring: telemetry storage, periodic recalibration, M&V, retraining, edge-box opex.
- Cost cliffs: CFD fidelity, and the safety/commissioning effort for autonomous control. Advisory is far cheaper — the ladder lets the customer pay into control as trust builds.

### 14.8 Locked rollout decisions
- **Shadow first** → graduate advisory → supervised → autonomous.
- **Action space decided at commissioning** → start narrow (air setpoints + fan speeds), widen with trust.
- **Protocols mixed/unknown** → build a **pluggable connector SDK**, don't hardcode one.
- **Historian unknown** → a **data audit** precedes everything.

---

## 15. The program given those answers (this is the plan)

Three "not sure" answers (protocols, historian, action scope) mean the honest first deliverable is **discovery, not code**. You cannot scope connectors, calibration, or control on unknowns. Sequence:

| Phase | Goal | Produces | Gate to next |
|---|---|---|---|
| **0 · Discovery audit** | Resolve the unknowns | filled audit (§15.2), point list, data sample | data sufficient + writable-point map |
| **1 · Shadow twin** | Read-only twin, prove it | calibrated twin, "would-do" log, savings estimate vs reality | calibration error band met |
| **2 · Advisory** | AI recommends, human applies | live setpoint advice + M&V baseline | operator-applied savings verified |
| **3 · Supervised control** | AI writes, operator confirms | write path + Safety Supervisor commissioned | stable, in-band, MoC sign-off |
| **4 · Autonomous** | Closed-loop within envelope | full control + continuous M&V | sustained verified savings |

### 15.1 Pluggable connector SDK (because protocols are mixed/unknown)
One interface, many adapters — so the unknown protocol mix is a config, not a rebuild:
```
Connector:
  discover() -> [points]        # auto-find tags/assets
  read(points) -> samples       # telemetry in
  write(point, value, priority) # setpoint out (Phase 3+), with BMS priority arbitration
  health() -> status            # heartbeat for the watchdog
Adapters: BACnet/IP · Modbus TCP/RTU · OPC-UA · Redfish · SNMP · CDU/vendor REST · CSV/historian
```
Read path lights up in Phase 1; the write path stays *dark* until Phase 3 commissioning.

### 15.2 Site Discovery Audit checklist (run this first — resolves every "not sure")

**Controls / BMS**
- BMS vendor + version (Niagara/Metasys/Desigo/EcoStruxure…)? Protocols exposed (BACnet/Modbus/OPC-UA)?
- Point list export available? Which points are **writable**, and via what (priority array, supervisory setpoint)?
- Existing control sequences/schedules we must coexist with?

**Telemetry / historian**
- Historian present (PI/Influx/Timescale/BMS trends)? Retention + resolution? Export method (API/CSV)?
- Which of the needed points are actually trended today vs need new instrumentation?

**Cooling — air**
- CRAC/CRAH count, capacities, fan type (EC/VFD), supply-temp setpoints & ranges; containment type.
- Chillers (air/water-cooled), tower/dry cooler, pumps (VFD?), economizer/free-cooling present?

**Cooling — liquid (mixed)**
- DLC/immersion? CDU vendor + count + capacity; coolant type; loop supply/return temps & flow; Tj/coolant limits; leak detection.
- Heat split (≈% to liquid vs air) per high-density row.

**Power**
- Utility/transformer/UPS (topology + efficiency), PDU/busway metering granularity (per-rack?).
- **Redundancy** per system (N/N+1/2N) — usable vs installed capacity.

**IT / load**
- Rack count + per-rack kW (metered?) or **GPU/server SKUs** + nodes/rack. Workload pattern + load-balancing policy.
- ASHRAE class / inlet limits per hall.

**Site / climate / commercial**
- Location (climate + wet-bulb), water source/cost, electricity **tariff (ToU + demand charges)**, grid carbon.
- M&V/baseline expectations; savings-share vs SaaS terms.

**Network / OT security**
- OT/IT segmentation, where the edge box sits, firewalling of the write path, RBAC/audit requirements, data-residency/sovereignty.

**Safety / governance**
- Who signs off control (MoC)? Hard limits per asset. Required failsafe behavior on anomaly/network loss.

### 15.3 "Confidence to build" gate
The twin is only promoted from spec → live when: required params present (or explicitly assumed + logged), loops closed, capacity ≥ load per failure domain, telemetry bound + units verified, back-test error band met. Below gate → advisory-only, clearly labeled.
