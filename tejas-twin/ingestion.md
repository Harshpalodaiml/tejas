# Tejas AI — Ingestion Spec

How a customer's facility becomes a **calibrated, controllable** digital twin.

**UI:** `/ingest` · **Architecture:** [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md)

---

## Verdict

**Drawing is not enterprise truth.** A billable twin needs quantitative data from BMS/DCIM/historian — not a hand sketch. Drawing = greenfield/review lane only.

| | Brownfield | Greenfield |
|---|---|---|
| Source | BMS, DCIM, historian | Design intent |
| Telemetry | Yes → calibratable | Physics-only → advisory |
| Savings M&V | Yes | Estimate only |

---

## What ingestion produces

1. **Twin Spec** — typed graph (racks, CRAHs, chillers, loops, actuators)  
2. **Telemetry binding** — BACnet/Modbus/Redfish tag map  
3. **Calibration dataset** — historian export → tune until sim ≈ measured  
4. **Safety model** — actuators, hard limits, fallback controller  

---

## Ingestion lanes (ranked)

| Lane | Fidelity | When |
|---|---|---|
| A. Connector import (DCIM/BMS) | Highest | Brownfield default |
| B. CAD/CFD/SLD extraction | High | Fill gaps |
| C. CSV bulk import | High | Fast bootstrap |
| D. Drawing canvas | Low–Med | Greenfield / review |
| E. Walk-through scan | Med geometry | Future |

All lanes → same **Twin Spec** graph.

---

## Wizard UI (6 steps — `/ingest`)

| Step | What | Demo |
|---|---|---|
| 1 Connect | BACnet, Modbus, Redfish, historian | UI only |
| 2 Discover | Asset enumeration | Simulated |
| 3 Layout | Rows, racks, CRAH, CDU, kW/rack | **Real** topology |
| 4 Clarify | AI questions `/api/ingest/questions` | **Real** LLM |
| 5 Calibrate | Match sim to historian | Simulated |
| 6 Activate | `POST /api/twins` brownfield | **Real** |

---

## Twin Spec (outline)

**Nodes:** rack, row, hall, CRAH, CDU, chiller, pump, UPS, PDU  
**Edges:** power feed, air loop, liquid loop, control signal  
**Per rack:** kW, cooling interface (air/DLC/immersion), inlet limits (ASHRAE)  
**Per CRAH/chiller:** capacity curve, COP vs ambient, setpoint range  

Full node schema evolves in production connector SDK.

---

## Production pipeline

```
Discover → Normalise → Historian export → Draft spec → AI clarify →
Validate → Calibrate → (optional CFD) → Shadow twin → Control ladder
```

**Calibration gate:** ‖y_sim − y_meas‖ &lt; ε before advisory; stricter before write.

---

## Connectors (v1 target)

| Protocol | Assets |
|---|---|
| BACnet/IP | CRAH, chillers, valves |
| Modbus TCP | CDU, meters |
| Redfish | Rack power |
| OPC-UA | Plant SCADA (v2) |

---

*App guide: [`README.md`](./README.md) · Product: [`../docs/PRODUCT.md`](../docs/PRODUCT.md)*