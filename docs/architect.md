# Tejas AI — Layer Architecture

> **This content lives in [`ARCHITECTURE.md`](./ARCHITECTURE.md).**  
> That doc covers physics, four layers, fleet topology, prototype, and APIs in one place.

## Four layers (summary)

```
L4  Gen-UI + voice      Ollama on-prem · talk → dashboard builds
L3  Trust ladder         twin → shadow → advisory → supervised → autonomous
L2  Optimisation         MPC day-one · RL in Sinergym · feed-forward control
L1  Digital twin         sim.js (demo) → EnergyPlus + Sinergym (production)
```

**Principle:** Train on the twin, never on live critical hardware first. UI is replaceable; **calibrated twin + safe policy + site data** is the moat.

## Where to read more

| Topic | Section |
|---|---|
| Governing equations | `ARCHITECTURE.md` §2 |
| Fleet / edge services | `ARCHITECTURE.md` §3 |
| Runnable prototype | `ARCHITECTURE.md` §4 + `../tejas-twin/README.md` |
| Ingestion pipeline | `../tejas-twin/ingestion.md` |
| Two-screen demo | `demo.md` |

**Demo:** [Video](https://accuconsult-my.sharepoint.com/:v:/g/personal/harsh_zenalyst_ai/IQCCDlXCZ5lwR5V-T7A_N7cMAT15xtCeoMB5dCppqR4f2d8?e=lg9S4D) · [Deck](https://canva.link/348k4b76wzcfxen)