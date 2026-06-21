# Tejas AI — Architecture

> Technical companion to [`project.md`](./project.md). Specifies the digital twin, the cooling-optimization engine, the safe deployment path, and the generative-UI + voice layer (running on **local Ollama**). For the presentation build, see [`demo.md`](./demo.md).  
> **Complete runnable-system reference:** [`ARCHITECTURE.md`](./ARCHITECTURE.md) — every module, API, data flow, rack inspect red→blue, demo vs production.

---

## Table of contents
1. [System overview](#1-system-overview)
2. [Layer 1 — The Digital Twin](#2-layer-1--the-digital-twin)
3. [Layer 2 — The Optimization Engine](#3-layer-2--the-optimization-engine)
4. [Layer 3 — Safe Deployment (Sim-to-Real)](#4-layer-3--safe-deployment-sim-to-real)
5. [Layer 4 — The Generative UI + Voice (local Ollama)](#5-layer-4--the-generative-ui--voice-local-ollama)
6. [The two-screen demo architecture](#6-the-two-screen-demo-architecture)
7. [Data & integration architecture](#7-data--integration-architecture)
8. [Safety, guardrails & measurement](#8-safety-guardrails--measurement)
9. [Technology stack](#9-technology-stack)
10. [Security & sovereignty](#10-security--sovereignty)
11. [Open questions](#11-open-questions)

---

## 1. System overview

Tejas AI is four layers. The bottom three are the **defensible engine**; the top is the **interface**.

```
┌──────────────────────────────────────────────────────────────────────┐
│  L4  GENERATIVE UI + VOICE   — talk to it; the dashboard builds itself  │  ← Ollama (local)
│      "show me today's savings" → UI renders · "go to advisory mode"     │
├──────────────────────────────────────────────────────────────────────┤
│  L3  DEPLOYMENT (sim→real)   — shadow → advise → closed-loop control     │
│      safety guardrails · human override · measurement & verification    │
├──────────────────────────────────────────────────────────────────────┤
│  L2  OPTIMIZATION ENGINE     — RL agent + MPC; feed-forward prediction   │  ← the moat
│      reward = min energy s.t. temperature/safety constraints            │
├──────────────────────────────────────────────────────────────────────┤
│  L1  DIGITAL TWIN            — physics sim of the facility's thermals     │  ← the moat
│      EnergyPlus + Sinergym · Indian weather · calibrated to real data   │
└──────────────────────────────────────────────────────────────────────┘
```

**Design principle:** the AI never learns on live critical hardware. It learns on the **twin** (L1), is validated there, then deployed through a **trust ladder** (L3). The **UI** (L4) is a thin, replaceable shell over this — flashy, but not the value.

---

## 2. Layer 1 — The Digital Twin

A digital twin is a **physics-based simulation of how the facility heats and cools** — the environment the AI learns in. This is what lets us build, train, and demo **with zero physical hardware.**

**Stack:**
- **EnergyPlus** — the open-source, industry-standard building/facility energy & thermal simulator (used in real engineering, so results are credible, not toy).
- **Sinergym** — open-source Python layer that wraps EnergyPlus as a reinforcement-learning environment (Gym-style: `reset()`, `step(action)`, reward). Ships a ready-made **`2ZoneDataCenterHVAC`** model — a data-center cooling twin we can use immediately.
- **Indian weather files** (`.epw`) for Chennai / Mumbai / Delhi — so the twin runs against *real local climate* (the 45°C summer day that makes the savings dramatic).

**What the twin models:** heat load (IT/equipment/product), thermal mass, chiller/CRAC/CDU behavior, airflow/zones, ambient weather, and **energy consumed** per control action.

**Calibration (twin → reality):** for a real customer, we tune the twin's parameters against their historical sensor logs until simulated temps/energy match measured reality (within an error band). A calibrated twin is the per-customer asset that makes our control policy *theirs* — and accumulates as a moat.

```
   weather (.epw) ─┐
   heat load ──────┤→  EnergyPlus thermal model  →  zone temps, energy used
   control action ─┘            ▲
                                └── Sinergym exposes this as an RL env (step/reward)
```

---

## 3. Layer 2 — The Optimization Engine

The brain. It decides cooling **actions** (setpoints, fan speed, chiller staging, CDU flow) to **minimize energy** while **never violating safety** (temperature/humidity bounds).

**Two complementary controllers (we ship both, escalate over time):**

| Controller | What it is | Role |
|---|---|---|
| **Model-Predictive Control (MPC)** | Optimizes actions over a short future horizon using the twin's model + forecasts | **Day-one workhorse** — safe, explainable, beats rule-based immediately; no long training |
| **Reinforcement-Learning agent** | Learns an optimal control policy by millions of trials *in the twin* | **The edge** — discovers strategies MPC can't; improves with data; the Phaidra-class approach |

**Reward / objective:**
```
maximize:  − total_energy
subject to:  temperature ∈ [safe_min, safe_max]   (hard constraint)
             humidity, equipment limits respected  (hard constraint)
             setpoint change rate limited           (stability)
```
Constraint violations are penalized so heavily the agent learns safety is non-negotiable — and at deploy time they're enforced *outside* the agent too (L8).

**Feed-forward prediction (the Phaidra insight):** instead of reacting to temperature *after* it rises, the agent reads **leading indicators** — incoming load, weather forecast, thermal lag — and acts *ahead* of the heat. Phaidra validated this on NVIDIA AI factories (rack-power as a leading indicator, response cut from minutes to <10s). We bring the same principle to mid-market facilities.

**Baseline for comparison:** we always run the **default rule-based controller** alongside, so every result is "AI vs. the dumb thermostat" — the savings number is the whole pitch.

---

## 4. Layer 3 — Safe Deployment (Sim-to-Real)

The agent is trained in the twin — but the twin ≠ reality (the "sim-to-real gap"). So we never flip straight to autonomous control. We climb a **trust ladder**:

```
 SHADOW          →   ADVISORY        →   SUPERVISED       →   AUTONOMOUS
 read-only.          AI shows the        AI controls, but     AI runs closed-loop.
 AI computes what    optimal setpoints   operator confirms     Hard safety envelope +
 it WOULD do;        live; human          each major change.    instant revert to
 we log the gap      applies them.                              baseline on anomaly.
 vs reality.
```

- **Shadow** proves savings on the customer's real data with **zero risk** — this is the pilot that wins the deal.
- Each rung requires the previous rung's results to clear a bar.
- **Always-on fallback:** if sensors fault, the agent is uncertain, or a constraint nears violation → instantly hand control back to the safe baseline controller. The facility is never worse off than before Tejas.

---

## 5. Layer 4 — The Generative UI + Voice (local Ollama)

The interface is **not** fixed screens you navigate. You **speak or type**, and a **local LLM (via Ollama)** assembles the view. This is "generative UI": the model emits a UI specification, the frontend renders it.

### How the loop works
```
 [push-to-talk key held] → mic → Speech-to-Text → text prompt
        │
        ▼
   OLLAMA (local LLM, e.g. Llama 3.x / Qwen)  ← runs on the same machine, offline
   given: { user prompt, current UI state, available components, data schema }
        │
        ├── emits TOOL CALL → fetch data (query telemetry / run twin / get savings)
        │
        └── emits UI SPEC (JSON) → { layout, components[], props }
        │
        ▼
   Frontend renders the spec → dashboard reshapes live
        │
        └── (optional) Text-to-Speech speaks a short reply
```

### The component registry (what the LLM can assemble)
A fixed, trusted set of building blocks — the LLM *arranges* them, it doesn't invent raw markup (keeps it reliable):
`LineChart` · `BigNumber` · `Comparison(AI vs baseline)` · `Gauge` · `Table` · `Alert` · `ModeSwitch` · `Map/FacilityList`.

### Example interactions
| You say | Ollama emits | Result |
|---|---|---|
| *"Show me Chennai cold-storage energy, last 24h"* | tool: `getEnergy(site, 24h)` + UI spec `[LineChart]` | dashboard rebuilds to that chart |
| *"Compare AI vs the old controller and tell me the savings"* | UI spec `[Comparison, BigNumber]` | side-by-side + ₹ saved |
| *"Switch the Mumbai unit to advisory mode"* | tool: `setMode(site, advisory)` | mode changes, confirmed aloud |
| *"What's running hottest right now?"* | tool: `hottestUnit()` + UI spec `[Gauge, Alert]` | surfaces the at-risk unit |

### Why Ollama / local
- **Offline & sovereign** — runs on the on-prem box or a laptop; no facility data leaves the site; no cloud cost.
- **Vernacular** — Indian-language voice for floor operators (a foreign SaaS won't bother).
- **Cheap & fast** — small models handle "parse intent → choose component/tool" easily; no per-token bill.

### Honest boundary
Generative UI is the **exploration & wow layer**. Critical real-time monitoring also has a **few rock-solid fixed screens** underneath — operators need consistency for safety. Voice/genUI augments; it doesn't replace the safety-critical view.

---

## 6. The two-screen demo architecture

This is how we present **without a real data center** — see [`demo.md`](./demo.md) for the script.

```
  ┌────────────────────────────┐        ┌────────────────────────────┐
  │  SCREEN A — THE FACILITY    │        │  SCREEN B — TEJAS AI         │
  │  (the Digital Twin, live)   │        │  (Generative UI + Voice)     │
  │                             │        │                              │
  │  EnergyPlus/Sinergym twin   │◄──────►│  You talk → Ollama →         │
  │  running a 45°C Chennai day │  same  │  dashboard rebuilds:         │
  │                             │  sim   │   • AI vs baseline energy    │
  │  • zone temperatures        │  state │   • ₹ saved today            │
  │  • AI controller acting     │        │   • "crank heat to 47°C"     │
  │  • baseline acting          │        │   • mode switch advisory→ctrl│
  │  • energy: AI ▼ baseline    │        │                              │
  └────────────────────────────┘        └────────────────────────────┘
            both driven by one backend: the twin + the optimization engine
```

- **Screen A** = the simulated facility (the "world"): temperatures stay safe, the AI's energy line sits visibly below the dumb baseline. A weather slider lets the audience trigger a heat wave.
- **Screen B** = the Tejas product: the presenter *talks*, Ollama interprets, the dashboard morphs, and the savings number climbs. No mouse.
- **One backend** feeds both: the twin simulates, the engine controls, both screens read the same live state.

It runs entirely on **one laptop** (plus an external monitor, or two windows). Fully offline.

---

## 7. Data & integration architecture

For real deployments (beyond the demo):

```
 FACILITY SENSORS/BMS  ──(Modbus / BACnet / MQTT / OPC-UA)──►  Edge Connector
        │                                                          │
        ▼                                                          ▼
   Time-series store (InfluxDB/TimescaleDB)  ◄── telemetry ──  Tejas Edge Box (on-prem)
        │                                                     ├─ calibrated digital twin
        ▼                                                     ├─ optimization engine (MPC/RL)
   Historian / M&V (measure savings)                          ├─ safety supervisor
        ▲                                                     └─ Ollama (gen-UI + voice)
        └──────── control setpoints back to BMS ◄─────────────────┘  (advisory or closed-loop)
```

- **Read** path: pull sensor/energy telemetry from the existing Building Management System over standard industrial protocols (BACnet/Modbus/MQTT/OPC-UA) — no rip-and-replace.
- **Write** path: send optimized setpoints back to the same BMS (advisory = displayed to operator; autonomous = written directly, inside the safety envelope).
- **Edge-first:** the whole brain runs **on-prem** (an industrial edge box). The cloud, if used at all, is only for fleet dashboards/updates — never required for control.

---

## 8. Safety, guardrails & measurement

**Safety (non-negotiable in critical cooling):**
- **Hard envelope** enforced outside the AI: temperature/humidity/equipment limits are clamped regardless of what the agent requests.
- **Rate limiting** on setpoint changes (no thrashing equipment).
- **Anomaly → fallback:** sensor dropout, model uncertainty, or near-violation instantly reverts to the proven baseline controller.
- **Human override** always available; every autonomous action is logged and explainable.

**Measurement & Verification (M&V) — proving the savings honestly:**
- Run AI and baseline in comparable conditions; normalize for weather/load.
- Report verified savings (kWh, ₹, CO₂) against an agreed baseline — this is what savings-share billing is computed from, so it must be auditable.

---

## 9. Technology stack

| Concern | Choice |
|---|---|
| **Digital twin** | EnergyPlus + **Sinergym** (`2ZoneDataCenterHVAC` to start); Indian `.epw` weather |
| **Optimization** | MPC (do-mpc / CasADi) + RL (Stable-Baselines3 / custom) trained in the twin |
| **Edge runtime** | Python services; containerized; runs on an on-prem edge box |
| **Telemetry** | InfluxDB / TimescaleDB; BACnet/Modbus/MQTT/OPC-UA connectors |
| **Gen-UI LLM** | **Ollama** (local) — Llama 3.x / Qwen class; tool-calling + UI-spec generation |
| **Voice** | Speech-to-text (Whisper / Vosk local); push-to-talk hotkey; TTS (Piper, local) |
| **Frontend** | React dashboard with a fixed component registry the LLM arranges (generative UI) |
| **Demo** | One laptop, offline: twin + engine + Ollama + two-window/two-monitor UI |

Everything in the critical path has a **local** implementation — the system runs fully offline, on-prem, sovereign.

---

## 10. Security & sovereignty

- **On-prem by default** — sensor data and control never leave the facility; the LLM is local (Ollama). This is both a security property and a *sales* advantage for cost- and sovereignty-sensitive Indian buyers.
- **Control isolation** — the safety supervisor is a separate, simple, auditable component that can veto/override the AI; compromise or malfunction of the AI cannot breach the hard safety envelope.
- **Auditable actions** — every setpoint change (advisory or autonomous) is logged with the reason and the state that triggered it.

---

## 11. Open questions

| # | Question | Current lean |
|---|---|---|
| 1 | First vertical twin to build | **Cold storage** (simple thermals, painful bills) — then commercial HVAC, then edge DC |
| 2 | MPC-first or RL-first to deploy | **MPC first** (safe, explainable, instant win); RL as the upgrade once data accrues |
| 3 | How much accuracy before autonomous control | Long shadow+advisory period per site; autonomous only after verified, stable savings |
| 4 | Gen-UI reliability for safety-critical views | Genfor exploration; **fixed screens** for critical monitoring |
| 5 | Edge hardware spec | Industrial mini-PC that can run Ollama + engine; size per facility |
| 6 | Twin calibration effort per customer | Semi-automated from historical logs; the per-site calibrated twin is the moat |

---

*The engine (twin + control + safe deployment) is the defensible, hard-to-copy core. The generative voice UI is the unforgettable face. Built local-first so it runs anywhere in India, on-prem, offline — optimizing the cooling everyone else ignores.*
