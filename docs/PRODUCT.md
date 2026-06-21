# Tejas AI — Product

On-prem platform: **calibrated physics twin** + **autonomous cooling brain** + **voice/AR** for heat-intensive facilities. Cuts cooling energy **20–40%**; predicts faults before outages.

**Demo:** [Video](https://accuconsult-my.sharepoint.com/:v:/g/personal/harsh_zenalyst_ai/IQCCDlXCZ5lwR5V-T7A_N7cMAT15xtCeoMB5dCppqR4f2d8?e=lg9S4D) · [Deck](https://canva.link/348k4b76wzcfxen)  
**Tech:** [`ARCHITECTURE.md`](./ARCHITECTURE.md) · **Run:** `cd tejas-twin && ./run.sh`

---

## What we are (and are not)

| We are | We are not |
|---|---|
| Cooling brain that **acts** on setpoints | Generic IoT dashboard |
| Digital-twin platform (DC, cold chain, plants) | BMS rip-and-replace |
| Shadow → advise → control deployment | Hyperscaler-only cloud SaaS |
| Voice + vernacular for operators | Drawing tool as enterprise truth |

> *"What did your building know last night that you didn't?"*

---

## Five pillars

| # | Pillar | Outcome |
|---|---|---|
| 1 | Calibrated twin | Model matches site within ±1°C |
| 2 | Autonomous brain | 20–28% less cooling ₹, same SLA |
| 3 | Predict & fix | GPU-16 flagged months before trip |
| 4 | Talk to building | Operator never touches a mouse |
| 5 | Deploy safely | 30-day shadow before any write |

---

## Product map

```
Admin → Datacenter (flagship) · Twin Pro · Ingest · Studio · Scan
                    ↓
        Factory/Plant twins · VR · Field AR
```

| Route | Surface |
|---|---|
| `/` | Command centre — all twins |
| `/datacenter` | 3D hall, autonomous cooling, chat, GPU-16 |
| `/twin` | Analytics console |
| `/ingest` | Brownfield 6-step wizard |
| `/build` | Twin Studio |
| `/scan` | Phone → twin |
| `/ar` | Field repair + build-from-camera |
| `/vr` | First-person walk + voice AI |
| `/factory` | Factory / nuclear / geothermal / solar |

---

## Feature status

| # | Feature | Status | Route / file |
|---|---|---|---|
| F1 | Admin panel | **Live** | `/` `admin.js` |
| F2 | Data center twin | **Live** | `/datacenter` |
| F3 | Thermal simulation | **Live** | `sim.js` |
| F4 | Autonomous cooling | **Live** | `sim.js` `app.js` |
| F5 | Predictive PM (GPU-16) | **Live** | `sim.js` |
| F6 | Rack inspect red→blue | **Modules live** | `status.js` `components.js` — UI wiring next |
| F7 | AI chat & voice | **Live** | `genui.js` `tour.js` |
| F8 | Gen-UI panels | **Live** | `app.js` |
| F9 | Savings & fleet projection | **Live** | `app.js` |
| F10 | Electrical single-line | **Live** | `app.js` |
| F11 | Brownfield ingest | **UI live** | `/ingest` — connectors sim |
| F12 | Twin Studio | **Live** | `/build` |
| F13 | Phone scan | **Live** | `/scan` — sim reconstruct |
| F14 | Field AR | **Live** | `/ar` |
| F15 | VR walkthrough | **Live** | `/vr` |
| F16 | Plant twins (4 types) | **Live** | `plants.js` |
| F17 | Twin Pro | **Live** | `/twin` |
| F18 | Cross-device sync | **Twins live** | `/api/twins` — components next |
| F19 | On-prem stack | **Live** | `server.py` |
| F20 | Safety Supervisor | **Roadmap** | spec in ARCHITECTURE |

---

## Verticals

| Vertical | Value | Demo anchor |
|---|---|---|
| Data center | PUE 1.3 vs 1.5 at 47°C | Chennai OMR · GPU-16 |
| Cold chain | 2–8°C band, −15–25% refrigeration | ₹92k Cr spoilage problem |
| Factory | PRESS-7 vibration early warning | Renesas-class outage pattern |
| Geothermal | SEP-2 separator drift | The Geysers reinjection |
| Buildings | HVAC 40–50% of energy | Advisory-mode entry |

---

## Trust ladder (deployment product)

```
TWIN → SHADOW → ADVISORY → SUPERVISED → AUTONOMOUS
```

Never skip a rung. Never promise autonomous on uncalibrated twin.

| Phase | Risk | Commercial |
|---|---|---|
| Twin | None | Paid on-ramp |
| Shadow | None | Pilot → credit |
| Advisory | Low | Savings-share starts |
| Supervised | Medium | SaaS + share |
| Autonomous | Managed | Premium share |

---

## Packaging (future)

| Edition | Target |
|---|---|
| Demo | Investors, conferences — one laptop |
| Shadow | Read-only pilot + M&V report |
| Advisory | Recommendations, no writes |
| Control | Safety Supervisor + BACnet write |
| Fleet | Multi-site admin + aggregate M&V |

---

## Roadmap

| When | Milestone |
|---|---|
| **Now** | Flagship DC, GPU-16, chat/voice, AR/VR, ingest UI, rack modules |
| **0–3 mo** | Rack inspect E2E · `/api/components` · first shadow pilot |
| **3–9 mo** | BACnet read · historian calibrate · 3 advisory customers |
| **9–18 mo** | Safety Supervisor · supervised write · EnergyPlus backend |
| **18+ mo** | RL per-site · connector SDK · vernacular STT/TTS |

---

## Success metrics

| Metric | Target |
|---|---|
| Cooling reduction (M&V) | 20–28% |
| Twin calibration | ±1°C, ±8% energy |
| Shadow → advisory conversion | >60% when savings >15% |
| Demo: 47°C savings visible | <5 sec |

---

*Strategy: [`project.md`](./project.md) · Narrative: [`story.md`](./story.md) · Pitch: [`pitch/`](./pitch/)*