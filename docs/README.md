# Tejas AI — Documentation

Scalable doc map. Start at tier 1; go deeper only when you need to.

**Run app:** `cd tejas-twin && ./run.sh` → https://localhost:7878  
**Demo:** [Video](https://accuconsult-my.sharepoint.com/:v:/g/personal/harsh_zenalyst_ai/IQCCDlXCZ5lwR5V-T7A_N7cMAT15xtCeoMB5dCppqR4f2d8?e=lg9S4D) · [Deck](https://canva.link/348k4b76wzcfxen)

---

## Tier 1 — Start here (everyone)

| Doc | Lines | Purpose |
|---|---|---|
| [`../README.md`](../README.md) | ~75 | Project entry: problem, stack, demo links |
| [`PRODUCT.md`](./PRODUCT.md) | ~130 | What we build: features, status, roadmap |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | ~210 | Physics model, 4 layers, fleet scale, APIs |
| [`demo.md`](./demo.md) | ~70 | 90s live demo script |

---

## Tier 2 — Go deeper (build & sell)

| Doc | Purpose |
|---|---|
| [`project.md`](./project.md) | Market, GTM, pricing, competitive position |
| [`story.md`](./story.md) | Sales narrative + real-world anchors |
| [`pitch/`](./pitch/) | Decks, 60s script, one-pager, playbooks |
| [`../tejas-twin/README.md`](../tejas-twin/README.md) | App routes, run, core files |

---

## Tier 3 — Specs (engineering)

| Doc | Purpose |
|---|---|
| [`../tejas-twin/ingestion.md`](../tejas-twin/ingestion.md) | Brownfield ingestion → Twin Spec |
| [`../tejas-twin/ARCHITECTURE-rack-inspect-fix.md`](../tejas-twin/ARCHITECTURE-rack-inspect-fix.md) | Rack inspect red → blue |
| [`architect.md`](./architect.md) | Pointer → four-layer detail in ARCHITECTURE |

---

## Repo layout

```
minmo/
├── README.md                 # Tier 1 entry
├── docs/                     # Product + architecture + pitch
│   ├── README.md             # This index
│   ├── ARCHITECTURE.md       # System design
│   ├── PRODUCT.md            # Feature map
│   ├── project.md · story.md · demo.md
│   └── pitch/                # Sales materials + PDFs
└── tejas-twin/               # Runnable app
    ├── README.md             # App guide
    ├── server.py · public/
    ├── ingestion.md          # Tier 3 spec
    └── ARCHITECTURE-rack-inspect-fix.md
```

---

## Quick reference

| Question | Read |
|---|---|
| What is Tejas? | `../README.md` |
| How does physics + scale work? | `ARCHITECTURE.md` |
| What features exist today? | `PRODUCT.md` § status matrix |
| How do I demo? | `demo.md` + `../tejas-twin/README.md` |
| How do we sell? | `pitch/` + `story.md` |
| How do we ingest a real DC? | `../tejas-twin/ingestion.md` |

*Hook: "What did your building know last night that you didn't?"*