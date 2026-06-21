# Tejas AI — Runnable Digital Twin

Browser platform + Python server. Live physics twin, 3D hall, voice/chat brain, AR/VR.

**Docs:** [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) · [`../docs/PRODUCT.md`](../docs/PRODUCT.md) · [`../README.md`](../README.md)

**Demo:** [Video](https://accuconsult-my.sharepoint.com/:v:/g/personal/harsh_zenalyst_ai/IQCCDlXCZ5lwR5V-T7A_N7cMAT15xtCeoMB5dCppqR4f2d8?e=lg9S4D) · [Pitch deck](https://canva.link/348k4b76wzcfxen)

---

## Run (one command)

```bash
cd tejas-twin
export OPENAI_API_KEY=sk-...   # optional
./run.sh
# → https://localhost:7878
```

- Auto HTTPS (self-signed) so phone camera works for AR/scan
- Phone on same Wi-Fi: `https://<LAN-IP>:7878` (cert warning → Proceed)
- Plain HTTP: `TEJAS_HTTP=1` (camera falls back to simulated view)
- No pip, no npm. Python 3.8+ + vendored Three.js

### AI brain (auto-fallback)

1. **OpenAI** — if `OPENAI_API_KEY` set
2. **Ollama** — if `localhost:11434` reachable
3. **Built-in parser** — always works offline

---

## Routes

| URL | What |
|---|---|
| `/` | Admin — twin list, create new |
| `/datacenter` | **Flagship** — 3D hall, autonomous cooling, chat, GPU-16 PM |
| `/twin` | Glass console (Analytics · Config · Sim) |
| `/factory` | Factory / plant twin viewer |
| `/build` | Twin Studio — drag/drop or AI layout |
| `/ingest` | Brownfield 6-step wizard |
| `/scan` | Phone video → register twin |
| `/ar` | Field AR — fix GPU-16 or build from camera |
| `/vr` | First-person walk + voice assistant |

---

## 90-second demo

1. Open `/datacenter` — point at **Autonomous Control** + **PUE ~1.3 vs ~1.5**
2. Weather → **47°C** (or ask *"heat wave, push to 47"*) — AI holds savings, baseline burns power
3. *"How much electricity?"* — answers from live state
4. *"Is any machine going down?"* → **GPU-16** red pulse, work order + parts + email draft
5. *"Project savings across 50 sites"* — fleet panel

Voice: press **`T`** or tap 🧠 to talk. Click any rack to inspect.

---

## Core files

| File | Role |
|---|---|
| `server.py` | HTTP server, `/api/chat`, twin registry, TLS |
| `public/sim.js` | Thermal physics, `Twin`, baseline vs Tejas control |
| `public/app.js` | RAF loop, HUD, panels, chat actions |
| `public/twin3d.js` | Three.js hall, temp colour, airflow |
| `public/genui.js` | Chat client |
| `public/vr.js` / `ar.js` | VR walk · Field AR |

Physics model: air-side ΔT, hot-aisle recirculation, chiller COP vs ambient, fan³ law, ASHRAE A1 band. Production path: EnergyPlus + Sinergym (see [`../docs/architect.md`](../docs/architect.md)).

---

## Phone demos

**Field AR** (`/ar`) — scan QR from datacenter panel:
- **Fix GPU-16** — wayfind → lock rings → 4-step checklist
- **Build twin** — camera → vision API → blueprint overlay + live sensors

**VR** (`/vr`) — joystick walk, reticle inspect, push-to-talk AI assistant.

---

## Tier 3 specs

| Doc | Topic |
|---|---|
| [`ingestion.md`](./ingestion.md) | Brownfield → Twin Spec |
| [`ARCHITECTURE-rack-inspect-fix.md`](./ARCHITECTURE-rack-inspect-fix.md) | Rack inspect red → blue |

**All docs:** [`../docs/README.md`](../docs/README.md) (3-tier index)

---

*तेजस् · Built in India · On-prem*