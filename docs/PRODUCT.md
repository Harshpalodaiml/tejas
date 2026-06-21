# Tejas AI — Product Definition

> **What we are building, feature by feature — today, tomorrow, and why it matters.**  
> Companion docs: [`project.md`](./project.md) (strategy) · [`ARCHITECTURE.md`](./ARCHITECTURE.md) (technical) · [`story.md`](./story.md) (narrative) · [`pitch/pitch.md`](./pitch/pitch.md) (sales kit)

---

## Table of contents

1. [Product in one sentence](#1-product-in-one-sentence)
2. [What Tejas AI is (and is not)](#2-what-tejas-ai-is-and-is-not)
3. [Product pillars](#3-product-pillars)
4. [Who it is for](#4-who-it-is-for)
5. [The product map](#5-the-product-map)
6. [Feature deep-dives](#6-feature-deep-dives)
7. [Vertical solutions](#7-vertical-solutions)
8. [Deployment product — trust ladder](#8-deployment-product--trust-ladder)
9. [Platform & packaging](#9-platform--packaging)
10. [Competitive position](#10-competitive-position)
11. [Product roadmap](#11-product-roadmap)
12. [Success metrics](#12-success-metrics)
13. [Feature status matrix](#13-feature-status-matrix)

---

## 1. Product in one sentence

**Tejas AI is an on-prem platform that builds a calibrated digital twin of any heat-intensive facility, runs an autonomous cooling brain on top of existing controls, and lets operators talk to the building — cutting cooling energy 20–40% while predicting failures before they become outages.**

तेजस् (Tejas) — radiance, sharpness. Built in India. Sovereign by default.

---

## 2. What Tejas AI is (and is not)

### We are

| | |
|---|---|
| **A cooling brain** | Predicts heat, optimises setpoints, explains every action |
| **A digital-twin platform** | Data centers, cold chain, factories, plants — one engine |
| **A trust-building deployment** | Shadow → advise → control; never rip-and-replace on day one |
| **An operator product** | Voice, chat, vernacular — no dashboard training required |
| **An on-prem system** | Data and control stay on site; Ollama local LLM |

### We are not

| | |
|---|---|
| A generic IoT dashboard | We **act**, not just chart |
| A BMS replacement | We sit **on top** and send better setpoints |
| A hyperscaler-only cloud SaaS | We serve **mid-market** India and the world |
| A drawing tool for enterprise DCs | Drawing is **review**; connectors + historian are truth |
| A slide deck | The demo is a **running system** on one laptop |

### The product promise

> *"What did your building know last night that you didn't?"*

We turn existing BMS data into a **story** — predict the next chapter, optimise every page, flag machines dying in the margins, guide the technician to the exact part, and prove savings on your numbers before we touch a setpoint.

---

## 3. Product pillars

Everything we build rolls up to five pillars:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PILLAR 1 · CALIBRATED TWIN     Physics model matched to YOUR facility   │
│  PILLAR 2 · AUTONOMOUS BRAIN    Predict + optimise inside safety band    │
│  PILLAR 3 · PREDICT & FIX       Maintenance before inspection / outage   │
│  PILLAR 4 · TALK TO THE BUILDING Voice · chat · gen-UI · vernacular      │
│  PILLAR 5 · DEPLOY SAFELY       Shadow → advise → control · on-prem      │
└─────────────────────────────────────────────────────────────────────────┘
```

| Pillar | Customer outcome | Moat |
|---|---|---|
| Calibrated twin | "This model matches my hall within ±1°C" | Per-site proprietary asset |
| Autonomous brain | "20–28% less cooling ₹ on the same SLA" | Safe control policy + site data |
| Predict & fix | "GPU-16 fixed in 25 min, not at 2:14 AM trip" | Physics-linked fault detection |
| Talk to building | "My operator never touched a mouse" | India-tuned voice + context AI |
| Deploy safely | "We proved it read-only for 30 days first" | Trust ladder + Safety Supervisor |

---

## 4. Who it is for

### Buyers (who signs)

| Persona | Pain | Tejas hook |
|---|---|---|
| **Facility owner / CFO** | Power bill, downtime, SLA penalties | Savings-share: pay only from verified savings |
| **Operations head** | Heat waves, staffing, incidents | Shadow pilot on their historian — zero risk |
| **Energy manager** | PUE, demand charges, ESG | Auditable M&V, fleet projection |
| **Cold-chain director** | Spoilage + refrigeration % | Hold 2–8°C band at warmest safe point |

### Users (who runs it daily)

| Persona | Need | Tejas fit |
|---|---|---|
| **On-site operator** | Hands full, not technical | Voice: *"how much did we save today?"* |
| **HVAC technician** | Know what part to bring | Work order + Field AR + rack inspect fix |
| **Commissioning engineer** | Brownfield topology + gaps | 6-step ingestion wizard + AI clarify |
| **Investor / judge** | Wow in 90 seconds | Live 47°C demo on one laptop |

### Beachhead priority

1. **Cold storage / cold chain** — refrigeration = #1 cost; national spoilage problem
2. **Edge & mid-size data centers** — India's DC boom; Phaidra ignores them
3. **Commercial buildings** — HVAC 40–50% of energy; brutal summers
4. **Smart factories & plants** — PRESS-7 class faults; supply-chain risk

---

## 5. The product map

```
                         TEJAS AI PLATFORM
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
    ┌────▼────┐          ┌─────▼─────┐         ┌─────▼─────┐
    │ ADMIN   │          │ FLAGSHIP  │         │ ENTERPRISE │
    │ PANEL   │          │ DC TWIN   │         │ INGESTION  │
    └────┬────┘          └─────┬─────┘         └─────┬─────┘
         │                     │                     │
    ┌────┴────────┐    ┌───────┴────────┐    ┌──────┴──────┐
    │ Twin Studio │    │ Autonomous     │    │ Connectors  │
    │ Phone Scan  │    │ Cooling        │    │ Calibrate   │
    │ Factory/    │    │ Predictive PM  │    │ Shadow mode │
    │ Plant twins │    │ Rack inspect   │    │ AI clarify  │
    └─────────────┘    │ Chat · Voice   │    └─────────────┘
                       │ AR · VR        │
                       └────────────────┘
```

### Routes (what customers open)

| Route | Product surface |
|---|---|
| `/` `/admin` | **Command centre** — all twins, create new |
| `/datacenter` | **Flagship** — 3D AI hall, autonomous cooling |
| `/twin` | **Twin Pro** — glass analytics console |
| `/ingest` | **Brownfield wizard** — enterprise DC onboarding |
| `/build` | **Twin Studio** — design any facility |
| `/scan` | **Phone scan** — video → twin |
| `/factory` | **Factory / plant viewer** — live sensors |
| `/ar` | **Field AR** — fix + build from camera |
| `/vr` | **VR walkthrough** — first-person inside |

---

## 6. Feature deep-dives

Each feature: **what it is** · **who uses it** · **today** · **future** · **why it wins**

---

### F1 · Admin Panel — Command Centre

**What:** Single landing page listing every digital twin. One click to open. Create-new flows for scan, blueprint, studio, ingest.

**Who:** Operations lead, demo presenter, multi-site portfolio manager.

**Today (`admin.js`):**
- Built-in data-center card (always live)
- Dynamic factory cards from server twin registry
- Create: QR → phone scan, blueprint upload, Twin Studio link, ingest link
- Polls `/api/twins` every 5s — phone-created twin appears on desktop instantly

**Future:**
- Fleet dashboard: N sites, aggregate ₹/MWh/CO₂
- RBAC: operator vs engineer vs admin
- Site health traffic lights (shadow / advisory / autonomous per hall)
- Partner white-label skin

**Why it wins:** One front door for a **platform**, not a single-demo app. Land one hall → cards multiply across the chain.

---

### F2 · Data Center Twin — Flagship Experience

**What:** Live 3D AI training hall — 24 racks, mixed air + liquid cooling story, Chennai weather, autonomous brain running in real time.

**Who:** DC operators, colo sales engineers, investors, hyperscaler-adjacent edge DCs.

**Today (`datacenter.html`, `app.js`, `twin3d.js`, `sim.js`):**
- 3D hall: racks glow by inlet temperature; airflow particles; sky shifts with weather
- Weather slider 28–50°C; IT load slider 30–110%
- Live PUE: Tejas ~1.30 vs baseline ~1.50 at 47°C
- KPI strip: savings ₹/day, cooling %, ASHRAE band
- Click any rack → inspector panel
- 9 draggable gen-UI panels (savings, power, efficiency, racks, alerts, service, fleet, autonomy, single-line)
- Guided voice tour (3 min, no presenter)
- QR → Field AR · QR → VR walkthrough

**Future:**
- Import real hall layout from ingest wizard → replace demo 4×6 grid
- Per-rack Redfish power binding
- Live historian overlay (measured vs simulated)
- Multi-hall campus view
- Customer-branded hall (CtrlS-class colo)

**Why it wins:** The **whole company in one screen** — cooling, maintenance, savings, scale. Shareable 90-second clip.

---

### F3 · Thermal Simulation Engine — The Twin Brain

**What:** Physics model of how the facility heats and cools. Two controllers race: dumb BMS vs Tejas AI.

**Who:** Internal engineering, customer commissioning, AI training environment.

**Today (`sim.js`):**
- 24 racks, GPU clusters, per-rack inlet with recirculation
- Chiller COP vs ambient + CHW setpoint
- Fan cube law; envelope leak; ASHRAE A1 band
- `baselineControl()` vs `tejasControl()` grid search
- Online learning metrics: policy version, steps, confidence, decision log
- Economics: ₹/kWh tariff, CO₂, daily/yearly savings

**Future:**
- EnergyPlus + Sinergym backend (same `Twin` API)
- MPC horizon optimizer (replace grid search)
- RL agent trained millions of episodes in twin
- Mixed air + liquid coupled loops
- Fault injection curriculum (chiller trip, sensor dropout)
- Per-customer calibrated parameters from historian

**Why it wins:** The **defensible core**. Dashboards are copyable; a twin matched to reality within ±1°C is not.

---

### F4 · Autonomous Cooling — Tejas vs Baseline

**What:** Self-learning agent that holds every rack in the safe band using the **least** energy — and explains why.

**Who:** Facility operator (daily), energy manager (ROI), CFO (bill).

**Today:**
- Mode switch: Tejas AI ↔ baseline BMS
- Autonomous control card: policy v3, steps learned, confidence %, live rationale
- Heat-wave behaviour: warmer supply air → protect chiller COP → widen savings gap
- Chat: *"take control"*, *"heat wave push to 47"*, *"how much electricity"*
- Decision log: one-sentence why per action

**Future:**
- Closed-loop write to BACnet priority array (supervised → autonomous)
- Weather forecast feed (not just slider)
- Demand-charge aware optimisation
- WUE (water) co-optimisation for Chennai-class sites
- Per-zone staging across multiple CRAHs/chillers

**Why it wins:** **Same safety. 20–28% less power.** Visible on a 47°C day — the pitch that closes.

---

### F5 · Predictive Maintenance — GPU-16 Story

**What:** AI watches every rack for physics anomalies — inlet temp hotter than load explains — months before inspection.

**Who:** Facilities HVAC lead, technician, reliability engineer.

**Today:**
- **GPU-16** seeded at rack `2-3`: +3.4°C unexplained inlet rise, 14-month drift
- Root cause: CRAC-2 filter + rear fan-tray bearing
- Parts list + 25-min fix procedure
- Drafted service email to R. Kumar (Facilities/HVAC)
- Alerts panel + service panel + chat *"is any machine going down?"*
- 3D rack pulses red; VR reticle shows SERVICE NEEDED

**Future:**
- Fleet-wide PM ranking across 50 halls
- CMMS integration (ServiceNow, Maximo)
- Vibration/acoustic model fusion
- Auto-schedule maintenance window (low-load period)
- Renesas-class fab line extension (PRESS-7, SEP-2 patterns)

**Why it wins:** Turns **invisible drift** into a work order with parts — before ₹2 Cr outage.

---

### F6 · Interactive Rack Inspect & Guided Fix — Red → Blue

**What:** Click any rack (desktop or VR) → see its **proper design** (electrical, cooling, mechanical, controls) → move the faulted part → unit turns **blue** when corrected. Always clickable — even blue units (revert available).

**Who:** Technician (fix), commissioning engineer (inspect), demo audience (wow).

**Today — modules built:**

| Module | Status |
|---|---|
| `status.js` | ✅ Lifecycle enum + colour map (`corrected` = `#19c6ff` blue) |
| `components.js` | ✅ Registry, `correct()`, `revert()`, `resolveFault()`, server sync hooks |
| `rackdesign.js` | ✅ `RackDesign` class — exploded 3D, aspect lenses, drag-to-snap |
| `schematic.js` | ✅ SVG chains: rack-power, rack-air, rack-ctl |
| Desktop UI wire-up | 🔜 Context menu + aspect tabs in `app.js` |
| 3D colour override | 🔜 `twin3d.js` status-aware loop |
| VR aspect buttons | 🔜 `vr.js` Internals · Circuit · Correct |
| `POST /api/components` | 🔜 `server.py` persistence |
| AR → `correct('GPU-16')` | 🔜 Desktop rack turns blue on phone fix |

**Interaction design (product spec):**

```
PICK (white ring)
  → Overview · [aspect lenses from data] · Everything · Move & Correct
  → Aspect: exploded 3D and/or SVG schematic
  → Edit: drag faulted part to ghost slot → snap → fault done
  → All faults done → BLUE → work order closes → persists → phone↔desktop sync
```

**Seeded demo units:**

| Scene | Unit | Fault |
|---|---|---|
| Data center | GPU-16 | Airflow restriction |
| Smart factory | PRESS-7 | Motor temp + vibration |
| Geothermal | SEP-2 | Separator / reinjection drift |

**Future:**
- PLC/BMS schematic live bind (writable points highlighted)
- CFD-informed airflow lens
- Spare-parts ERP lookup
- Training mode: randomised faults for technician certification
- Nuclear reactor coolant lens (neutronics + fluid)

**Why it wins:** Only product that goes from **3D hall → exploded internals → physical fix → verified blue state** in one loop. AR checklist becomes **persistent truth** on the twin.

---

### F7 · Context-Aware AI Chat & Voice

**What:** Operator talks; Tejas answers from **live twin state** and **acts** — changes weather, reveals panels, focuses racks, projects fleet.

**Who:** Floor operator (primary), exec in a demo, Hindi/Tamil-speaking staff.

**Today (`genui.js`, `server.py`, `tour.js`):**
- Three-tier brain: OpenAI → Ollama → built-in `localParse()` (demo never dies)
- Every chat carries full context: PUE, power, hottest rack, alerts, savings
- Actions: `setWeather`, `setLoad`, `setMode`, `show`, `focusRack`, `setFleet`
- Guided voice tour with Web Speech API
- Vernacular: *"आज सबसे गरम यूनिट कौन सी है?"* via local parser

**Future:**
- Push-to-talk hotkey + Whisper STT local
- Piper TTS spoken replies
- Tool-calling: query historian, draft email, open work order
- Multi-language STT (Tamil, Telugu, Kannada)
- Slack/Teams bot for advisory mode alerts

**Why it wins:** Operators **don't learn dashboards** — they ask questions. Foreign SaaS won't invest in vernacular industrial voice.

---

### F8 · Generative UI Panels

**What:** Dashboard is not fixed — chat **reveals** the right panel for the question. Panels are draggable, closeable cards.

**Who:** Operator exploring; presenter in demo.

**Today (`app.js`, `styles.css`):**
- 9 panels: savings, power, efficiency, racks, alerts, service, fleet, autonomy, oneline
- Sparkline charts (power, PUE)
- Movable cards with ✕ close
- AI `show` action opens relevant panels from chat

**Future:**
- Full Ollama UI-spec generation (component registry)
- Custom panels per customer (tariff breakdown, WUE, carbon credits)
- Saved layouts per operator role
- Mobile-optimised panel set for AR companion

**Why it wins:** **Exploration layer** on top of fixed safety screens — wow without sacrificing reliability.

---

### F9 · Savings, PUE & Fleet Projection

**What:** Live and projected money, energy, carbon — per hall and multiplied across N sites.

**Who:** CFO, board, ESCO partner, sustainability lead.

**Today:**
- Savings panel: ₹/day, ₹/year, kWh, tonnes CO₂ — AI vs baseline
- Efficiency panel: PUE comparison + sparkline
- Fleet panel: slider 1–500 sites → annual ₹, MWh, CO₂
- Chat: *"project across 50 sites"*

**Future:**
- IPMVP-style M&V report export (PDF)
- Savings-share billing integration
- Weather-normalised baseline model
- Demand-charge savings line item
- Water (WUE) savings for tower-heavy sites

**Why it wins:** **Boardroom slide that signs the contract** — from live demo numbers, not a spreadsheet guess.

---

### F10 · Electrical Single-Line Diagram

**What:** Live SVG one-line: grid → transformer → switchgear → UPS → PDU → NVIDIA GPU racks — with kW/amps.

**Who:** Electrical engineer, DC designer, customer technical due-diligence.

**Today (`app.js` `renderOneLine()`):**
- Chat triggers `oneline` panel
- Shows accelerator SKUs, hottest inlet, IT/cooling/total kW, PUE
- GPU-16 fault flagged on diagram

**Future:**
- Import from customer SLD (PDF/CAD extract)
- A/B feed redundancy visualization
- Per-PDU rack grouping from DCIM
- Trip scenario overlay (UPS on battery)

**Why it wins:** Connects **cooling story to power chain** — PUE is not abstract.

---

### F11 · Enterprise Brownfield Ingestion — 6-Step Wizard

**What:** Onboard a **real** data center without hand-drawing 5,000 assets. Connect → discover → layout → clarify → calibrate → shadow.

**Who:** Commissioning engineer, Tejas solutions team, colo customer IT/OT.

**Today (`ingest.html`, `ingest.js`):**
1. **Connect** — BACnet, Modbus, OPC-UA, Redfish, SNMP, CDU, Historian (UI)
2. **Discover** — simulated asset enumeration + point count
3. **Layout** — interactive hall: rows, racks/row, CRAH, CDU, kW/rack, air↔liquid rows
4. **Clarify** — AI questions via `/api/ingest/questions` + assumptions ledger
5. **Calibrate** — simulated ±0.8°C, ±6%, 92% quality score
6. **Activate** — registers brownfield twin on server

**Future:**
- Live connector SDK (BACnet/Modbus/Redfish adapters)
- Real historian export + automated calibration
- DCIM import (Nlyte, Sunbird, EcoStruxure)
- CFD parameter fold-in (6SigmaDCX)
- Confidence gate: advisory-only vs control-grade twin
- Diff/re-ingest when customer adds racks

**Why it wins:** **The moat.** Enterprise DC due-diligence asks "how do you ingest?" — this is the answer.

---

### F12 · Twin Studio — Build Any Facility

**What:** Drag-and-drop or prompt-describe a facility on a canvas; activate as live controllable twin.

**Who:** Greenfield designer, factory owner, demo builder, cold-storage planner.

**Today (`builder.html`, `builder.js`):**
- Palette: compressor, chiller, CRAC, cooler, fan, motor, pump, CNC, conveyor, sensors, land, room, rack, door
- Drag/drop + move on canvas
- AI layout: *"cold storage with 2 compressors"* → `/api/design`
- Geolocation → Open-Meteo wind arrow on canvas
- Activate → POST twin → open `/factory`

**Future:**
- Import IFC/Revit footprint
- AI validates capacity (cooling ≥ load)
- Cost estimate per layout
- Export Twin Spec JSON for ingestion pipeline
- Collaborative multi-user canvas

**Why it wins:** **Greenfield lane** of multi-modal ingestion — where drawing shines.

---

### F13 · Phone Scan → Digital Twin

**What:** Guided phone video walk-around → AI reconstructs facility → twin registered on admin panel.

**Who:** Factory owner without CAD; field engineer; quick pilot bootstrap.

**Today (`scan.html`, `scan.js`):**
- 9s guided recording with progress ring
- Simulated reconstruction animation
- POST `/api/twins` `{type:'factory', method:'scan'}`
- Appears on admin within 5s poll

**Future:**
- Real photogrammetry / NeRF pipeline
- Asset auto-labeling from video
- Scale measurement from AR
- Merge scan geometry + connector telemetry

**Why it wins:** **"No install, no schematic"** — any machine can become a twin in minutes.

---

### F14 · Field AR — Fix & Build

**What:** Phone camera AR: (1) navigate to faulted machine and guide repair; (2) point at any object and spawn a live sensor twin.

**Who:** HVAC technician, maintenance contractor, factory floor.

**Today (`ar.html`, `ar.js`):**
- **Fix GPU-16:** wayfinding → reticle lock → AR rings → 4-step checklist → success
- **Build twin:** camera capture → `/api/vision` (OpenAI/Ollama) → blueprint overlay → live sensors → power/speed controls
- HTTPS required for live camera; simulated fallback on HTTP

**Future:**
- `components.correct('GPU-16')` on fix complete → desktop rack blue
- LiDAR mesh alignment to twin coordinates
- Remote expert video pin-in
- Work order sync to CMMS
- PRESS-7 / SEP-2 AR flows per plant type

**Why it wins:** Closes the loop from **AI diagnosis → human hands → verified fix** on the actual machine.

---

### F15 · VR Walkthrough

**What:** First-person inside the data center or plant — walk, look, reticle-pick machines, inspect live telemetry.

**Who:** Remote stakeholder tour, training, investor wow, operator familiarisation.

**Today (`vr.html`, `vr.js`):**
- Datacenter default or `?type=factory|nuclear|geothermal|solar`
- Joystick walk, drag/gyro look, rise/duck
- Center reticle → info card (temp, load, status)
- Cardboard VR split-screen mode
- GPU-16 fault at row 4 in DC mode

**Future:**
- Aspect lens buttons (Internals, Circuit, Correct) — same as F6
- Multiplayer guided tour (trainer + trainee)
- Hand tracking for grab/interact
- Export tour script per customer site

**Why it wins:** **"Walk inside your facility before it's built"** — sales and training without site access.

---

### F16 · Multi-Plant Twins

**What:** Four industrial plant types with live animation, faults, and VR — same platform as the data center.

**Who:** Industrial energy buyers, geothermal operators, solar O&M, nuclear training (simulation).

**Today (`plants.js`, `factory.js`, `factory3d.js`):**

| Plant | Live animation | Seeded fault |
|---|---|---|
| 🏭 Smart Factory | Conveyors, robots, workers, AGV | **PRESS-7** |
| ☢️ Nuclear | Core pulse, turbine, cooling towers | — |
| 🌋 Geothermal | Steam, separators, reinjection loop | **SEP-2** |
| 🔆 Solar | Trackers, inverters, irradiance | — |

**Future:**
- Register all machines as `Component` records (F6)
- Plant-specific control policies (reinjection limits, tracker optimisation)
- Live SCADA bind per plant type
- Desalination / district cooling templates

**Why it wins:** Proves Tejas is a **platform for all heat**, not a single DC demo.

---

### F17 · Twin Pro — Glass Console

**What:** Alternate analytics-first view of the same simulation engine — for power users who want charts over 3D.

**Who:** Energy analyst, commissioning engineer, technical buyer deep-dive.

**Today (`twinpro.html`, `twinpro.js`):**
- Analytics · Configurator · Simulations tabs
- Same `Twin` + `Twin3D` underneath
- Banner shows selected rack telemetry

**Future:**
- Historian replay mode
- A/B test controller policies
- Export simulation datasets for ML training
- API access for third-party BI

**Why it wins:** **Serious buyer surface** without diluting the flagship 3D story.

---

### F18 · Cross-Device Sync

**What:** Twin created or fixed on phone appears on laptop — and corrected rack state persists across sessions.

**Who:** Technician in field + operator at desk.

**Today:**
- `/api/twins` registry — scan/ingest/builder → admin poll 5s
- `components.js` — `save()` + `syncFromServer()` + `startSync()` (client ready; server endpoint next)

**Future:**
- `/api/components` server persistence
- WebSocket push (replace poll)
- Offline queue on phone → sync when back on LAN
- Conflict resolution for multi-tech edits

**Why it wins:** **One truth** across desk, phone, VR — not three disconnected demos.

---

### F19 · On-Prem Sovereign Stack

**What:** Entire product runs on customer edge hardware or one laptop — no cloud required for control or chat.

**Who:** Indian sovereignty buyers, hospitals, government, defense-adjacent facilities.

**Today:**
- Pure Python stdlib server; vendored Three.js
- Ollama local LLM path
- Built-in parser offline fallback
- Self-signed HTTPS for phone camera
- `.tejas-secret` git-ignored keys

**Future:**
- Hardened edge box image (Docker)
- Air-gapped update bundles
- Customer CA certificate tooling
- FIPS-compliant crypto option
- Multi-tenant on-prem for colo providers

**Why it wins:** **Structural moat** — Phaidra cloud cannot match cost + sovereignty for Indian mid-market.

---

### F20 · Safety Supervisor (Production Control)

**What:** Separate, auditable service that clamps every AI command outside hard limits — instant revert to baseline on anomaly.

**Who:** Facility owner (sign-off), regulators, insurance, Tejas engineering.

**Today:**
- Hard constraints inside `tejasControl()` grid search (demo)
- Mode switch: human can return to baseline instantly
- UI narrative: trust ladder on roadmap card

**Future:**
- Independent process / container
- BACnet write path with priority array
- Rate limits, heartbeat watchdog
- Full audit log (who, what, why, state snapshot)
- MoC (Management of Change) workflow integration
- IEC 62443 / OT security alignment

**Why it wins:** **Unlocks closed-loop revenue** — without this, enterprise control sales stop at advisory.

---

## 7. Vertical solutions

How the **same platform** packages for each industry:

### Data center (flagship)

| Capability | Value |
|---|---|
| Autonomous cooling | 20–28% cooling ₹; PUE 1.3 vs 1.5 at 47°C |
| GPU-16 PM | Avoid ₹2+ Cr outage; 25-min fix vs emergency |
| Brownfield ingest | CtrlS-class colo onboarding |
| Fleet projection | 50-hall ₹90–160 Cr/yr story |
| Real anchor | Chennai OMR corridor · [2024 heat wave](https://en.wikipedia.org/wiki/2024_Indian_heat_wave) |

### Cold chain

| Capability | Value |
|---|---|
| Band holding | 2–8°C at warmest safe point — not coldest nervous point |
| Heat-wave drill | Prove 47°C day behaviour before summer |
| Refrigeration % | 15–25% of ₹65L/month bill |
| Real anchor | [₹92,651 Cr annual post-harvest loss](https://www.ibef.org/blogs/from-farms-to-fridges-how-cold-chain-infrastructure-is-transforming-india-s-agriculture) |

### Smart factory

| Capability | Value |
|---|---|
| PRESS-7 fault | Vibration + motor temp early warning |
| Phone scan twin | New line in 10 min |
| AR fix | Planned window vs unplanned stop |
| Real anchor | [Renesas Naka 2021](https://en.wikipedia.org/wiki/2020%E2%80%932023_global_chip_shortage#Fires_at_facilities) |

### Geothermal

| Capability | Value |
|---|---|
| SEP-2 monitor | Reinjection + separator drift |
| Reinjection limits | Field life protection |
| VR plant walk | Separator inspect without deck walk |
| Real anchor | [The Geysers, CA](https://en.wikipedia.org/wiki/The_Geysers) |

### Commercial buildings

| Capability | Value |
|---|---|
| HVAC optimisation | 40–50% of building energy |
| Advisory mode | Low-risk entry for FM companies |
| Vernacular voice | Security guard operates without training |

---

## 8. Deployment product — trust ladder

The **deployment** is a product — not just a feature:

```
PHASE 0 · TWIN          Build + train in simulation. Zero hardware.
PHASE 1 · SHADOW        Read-only on customer BMS/historian. Log would-do.
PHASE 2 · ADVISORY      AI recommends setpoints. Human applies.
PHASE 3 · SUPERVISED    AI writes. Human confirms each change.
PHASE 4 · AUTONOMOUS    Closed-loop inside envelope. Instant revert.
```

| Phase | Customer risk | Tejas deliverable | Commercial |
|---|---|---|---|
| Twin | None | Demo + twin-build engagement | Paid on-ramp |
| Shadow | None | 30-day report on their tariff | Pilot fee → credit |
| Advisory | Low | Live recommendations + M&V | Savings-share begins |
| Supervised | Medium | Write path commissioned | SaaS + share |
| Autonomous | Managed | Full control + audit | Premium share |

**Product rule:** Never skip a rung. Never promise autonomous on uncalibrated twin.

---

## 9. Platform & packaging

### Editions (future packaging)

| Edition | Includes | Target |
|---|---|---|
| **Tejas Demo** | DC twin, chat, AR/VR, one laptop | Sales, investors, conferences |
| **Tejas Shadow** | Ingest wizard + read-only connectors + M&V report | Pilot |
| **Tejas Advisory** | Shadow + recommendation UI + email alerts | Conservative operators |
| **Tejas Control** | Advisory + Safety Supervisor + write path | Mature trust |
| **Tejas Fleet** | Multi-site admin + aggregate M&V | Chains, colos, logistics |

### Pricing models

| Model | Pitch |
|---|---|
| **Savings-share (20–40%)** | Pay only from money you weren't going to have |
| **SaaS per facility** | Predictable after trust built |
| **Twin-build engagement** | Paid on-ramp; produces ROI case |

### Land-and-expand

```
One cold store → 50-store chain
One hall → campus → fleet panel
One factory line → whole plant
```

---

## 10. Competitive position

| vs | They | Tejas |
|---|---|---|
| **BMS status quo** | Reactive rules | Predict + learn + explain |
| **Phaidra** | Hyperscaler AI factories, cloud | Mid-market, on-prem, savings-share |
| **Schneider/Vertiv** | Hardware + dashboards | AI control layer, no rip-and-replace |
| **ESCO audit** | Report | Closed-loop + twin + AR execution |
| **Build in-house** | No twin infra | Off-the-shelf brain + shadow proof |

**Moat stack:** calibrated twin + safe policy + per-site data + trust to run cooling + India voice.

---

## 11. Product roadmap

### Now — demonstrable today

- [x] Flagship DC twin with autonomous cooling
- [x] GPU-16 predictive maintenance story
- [x] Chat + voice tour + 9 gen-UI panels
- [x] Field AR fix + build-from-camera
- [x] VR walkthrough (DC + 4 plants)
- [x] Twin Studio + phone scan + admin sync
- [x] Brownfield ingest wizard (UI + AI clarify)
- [x] Rack inspect modules (`status`, `components`, `rackdesign`, `schematic`)

### Next — wire & prove (0–3 months)

- [ ] Rack inspect UI integration (desktop + VR + AR → blue)
- [ ] `/api/components` server persistence
- [ ] First live shadow pilot (one real facility, read-only)
- [ ] Recorded 60s pitch clip + case study template
- [ ] PRESS-7 + SEP-2 as full `Component` seeds

### V1 — revenue (3–9 months)

- [ ] BACnet/Modbus read connector (one adapter)
- [ ] Historian CSV import + calibration v1
- [ ] Advisory mode product (recommendations dashboard)
- [ ] IPMVP savings report export
- [ ] 3 paying shadow→advisory customers

### V2 — control-grade (9–18 months)

- [ ] Safety Supervisor service
- [ ] Supervised write path (BACnet priority array)
- [ ] EnergyPlus/Sinergym twin backend option
- [ ] MPC controller production path
- [ ] Fleet admin for 10+ sites

### V3 — scale (18+ months)

- [ ] RL per-site policy fine-tuning
- [ ] Connector SDK marketplace
- [ ] CFD offline calibration service
- [ ] Vernacular STT/TTS production
- [ ] International weather + tariff packs

---

## 12. Success metrics

### Product metrics

| Metric | Target |
|---|---|
| Demo → shadow pilot conversion | >30% of qualified meetings |
| Shadow → advisory conversion | >60% when savings >15% |
| Time to first shadow report | <45 days from contract |
| Twin calibration error | ±1°C temp, ±8% energy |
| Operator chat success (no fallback) | >85% intent match |
| AR fix completion rate (demo) | 100% checklist path |

### Business metrics

| Metric | Target |
|---|---|
| Cooling energy reduction | 20–28% (verified M&V) |
| Avoided downtime events | ≥1 per hall per year |
| Fleet NRR | Expand to ≥3 sites per logo |
| Savings-share gross margin | >50% at scale |

### Wow metrics (demo)

| Metric | Target |
|---|---|
| 47°C heat-wave savings gap visible | <5 sec from command |
| GPU-16 story from chat | <10 sec |
| Phone scan → admin card | <30 sec after scan |
| 60-second pitch timing | 0:58–1:02 |

---

## 13. Feature status matrix

| # | Feature | Route / file | Status | Next milestone |
|---|---|---|---|---|
| F1 | Admin Panel | `/` `admin.js` | **Live** | Fleet view |
| F2 | Data Center Twin | `/datacenter` | **Live** | Real layout import |
| F3 | Simulation Engine | `sim.js` | **Live** | EnergyPlus backend |
| F4 | Autonomous Cooling | `sim.js` `app.js` | **Live** | BACnet write |
| F5 | Predictive PM | GPU-16 | **Live** | CMMS integration |
| F6 | Rack Inspect Fix | `status.js` etc. | **Modules live · UI wiring next** | Full red→blue E2E |
| F7 | AI Chat & Voice | `genui.js` `tour.js` | **Live** | Whisper STT |
| F8 | Gen-UI Panels | `app.js` | **Live** | Full Ollama UI spec |
| F9 | Savings & Fleet | `app.js` | **Live** | IPMVP export |
| F10 | Single-Line Diagram | `app.js` | **Live** | SLD import |
| F11 | Brownfield Ingest | `/ingest` | **UI live · connectors sim** | Live BACnet read |
| F12 | Twin Studio | `/build` | **Live** | IFC import |
| F13 | Phone Scan | `/scan` | **Live · sim reconstruct** | Real SfM |
| F14 | Field AR | `/ar` | **Live** | correct() sync |
| F15 | VR Walkthrough | `/vr` | **Live** | Aspect lenses |
| F16 | Plant Twins | `plants.js` | **Live** | Component registry |
| F17 | Twin Pro | `/twin` | **Live** | Historian replay |
| F18 | Cross-Device Sync | `admin.js` `components.js` | **Twins live · components next** | `/api/components` |
| F19 | On-Prem Stack | `server.py` | **Live** | Edge box image |
| F20 | Safety Supervisor | spec | **Roadmap** | Supervised write |

**Legend:** **Live** = demo-ready today · **Modules live** = code exists, integration in progress · **Roadmap** = specified, not built

---

## The product in one breath

> **Tejas AI is not a dashboard. It is the autonomous brain for every facility that removes heat — built as a calibrated digital twin, proven in shadow mode on your data, deployed through a trust ladder, operated by voice, and sold as rupees off your power bill. The flagship demo runs on one laptop. The enterprise path runs through ingestion, calibration, and safe control. The technician's phone finishes the story in AR — and the rack turns blue when the fix is real.**

---

*Run the product today: `cd tejas-twin && ./run.sh` → https://localhost:7878*

*Sales: [`pitch/pitch.md`](./pitch/pitch.md) · Technical: [`ARCHITECTURE.md`](./ARCHITECTURE.md) · Story: [`story.md`](./story.md)*