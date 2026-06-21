# Tejas AI — Digital Twin Platform

> **Full system architecture:** [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) — complete technical reference (simulation, AI, rack inspect, ingestion, AR/VR, APIs).  
> **Product definition:** [`../docs/PRODUCT.md`](../docs/PRODUCT.md) · **All docs:** [`../docs/`](../docs/)

A browser platform with an **Admin Panel** that manages multiple digital twins:

- **🖥️ Data Center twin** — a live **3D data-center hall** the AI **autonomously
  cools, optimises, and maintains** (drive weather/load, ask it questions, watch it
  flag a machine for service with a ready-to-send work order, and a guided voice tour).
- **🏭 Factory twins** — create a twin of **any machine** two ways:
  **📷 scan it with your phone** (guided video → the AI reconstructs it), or
  **🖼️ upload a blueprint** (the AI reads it). The new twin appears on the dashboard
  with **live sensors you can control**.
- **📱 Field AR** — scan a QR, your phone navigates a technician to the faulty machine
  and overlays the fix in AR.

Routes:
- `/` — **Admin panel** (landing): your twins + create-new
- `/datacenter` — the flagship 3D data-center twin (autonomous cooling, savings, predictive maintenance, voice tour, AR fix)
- `/twin` — alternate **glass console** view (Analytics · Configurator · Simulations) of the same engine
- `/factory` — a created factory twin (renders the designed structure + live sensors + control + chat)
- `/build` — **Twin Studio** (drag/drop or prompt-build a twin on a land plot)
- `/ingest` — **Brownfield ingestion wizard** (connect → discover → layout & cooling topology → AI clarifies → calibrate → shadow live)
- `/scan` — phone: build a twin from a camera video
- `/ar` — phone: AR field repair assistant (fix GPU-16)
- `/vr` — phone/desktop: walk **inside** the twin (joystick + gyro + cardboard VR) with a built-in **AI voice assistant** — tap-to-talk, OpenAI-powered, knows the whole hall and goes deeper on the rack you're inspecting

```
┌──────────────────────────────────────────────────────────────┐
│  3D HALL (racks glow by temperature · airflow · sky = weather) │
│  ┌────────────┐                              ┌──────────────┐  │
│  │ Environment│   PUE · Savings · Safety     │  Tejas       │  │
│  │ Autonomy   │   ───────────────────────    │  Assistant   │  │
│  │ Roadmap    │   [ savings | power | pue |   │  (chat)      │  │
│  └────────────┘     racks | alerts | service ]└──────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## Run it (one command)

```bash
cd tejas-twin
export OPENAI_API_KEY=sk-...     # optional but recommended (best chat)
./run.sh
```

It auto-generates a self-signed cert and serves over **HTTPS** (so the phone
camera works). Open **https://localhost:7878** on the laptop, and
**https://<your-lan-ip>:7878** on the phone (same Wi-Fi). First visit shows a
certificate warning → **Advanced → Proceed** (it's your own machine). The server
prints both URLs on start. Force plain http with `TEJAS_HTTP=1` (camera then
falls back to a simulated view).

You land on the **Admin Panel** — click a twin to open it, or **＋ Create new**.

> No `pip install`, no `npm install`. Pure Python standard library + a vendored,
> offline copy of Three.js. Python 3.8+.

### The AI brain (3 tiers, automatic)
1. **OpenAI** — if `OPENAI_API_KEY` is set (richest, context-aware answers).
2. **Ollama** (local) — if running at `localhost:11434` (fully offline / sovereign).
3. **Built-in parser** — always there, so the chat works even with no model at all.

Override the model with `OPENAI_MODEL` (default `gpt-4o-mini`) or `TEJAS_MODEL`
for Ollama.

> ⚠ **Security:** prefer setting the key as an environment variable. If you hardcode
> it in `server.py`, treat that file as a secret and rotate the key before sharing.

## What to show the judges (90-second script)

1. **It's already running it.** Point at the **Autonomous Control** card — policy
   version, steps learned, confidence — and the live **PUE 1.3 vs 1.5 baseline**.
2. **Stress it.** Drag **Weather → 47°C** (or type *“it's a heat wave, push outside
   to 47”*). The sky turns red; the baseline's power climbs; the AI runs the supply
   air warmer and **holds the savings**.
3. **Ask it.** Type *“how much electricity are we using?”* and *“what's happening?”* —
   it answers from the live state.
4. **Beyond cooling.** Type *“is any machine going down?”* → it surfaces **GPU-16**
   (degrading 14 months), shows the **root cause + parts + a drafted service email**,
   and highlights that rack pulsing red in 3D. *“The technician arrives knowing
   exactly what to fix.”*
5. **Scale.** *“Project savings across 50 sites.”*

Click any rack in the 3D scene to inspect it. Drag to orbit, scroll to zoom.

## How it works

| Layer | File | What it does |
|---|---|---|
| **Twin physics** | `public/sim.js` | Multi-rack thermal model: per-rack inlet temps, hot-air recirculation, chiller COP vs ambient, fan affinity (cube) law, envelope leak, **PUE**, ASHRAE safe band. Two controllers (baseline BMS vs the Tejas optimiser), online-learning + explainable decision log, and the predictive-maintenance work order. |
| **3D scene** | `public/twin3d.js` | Three.js hall — racks coloured by live temperature, CRAC airflow particles, chiller loop, a sky/sun that shifts with the weather, the faulted rack pulsing, orbit camera + click-to-inspect. |
| **Chat brain** | `server.py`, `public/genui.js` | Context-aware assistant — answers in plain English **and** acts on the twin (change weather/load, switch control, reveal panels, focus a rack). |
| **Tej · voice** | `public/app.js`, `datacenter.html` | Hands-free voice for the existing chat console — a 🧠 logo + **press `T` to talk** (push-to-talk). Your words fill the chat box; the reply shows in the console and is **spoken aloud only when you asked by voice** (typed chat stays silent). The logo **glows while speaking — tap it / press `T` to mute**. Context is spec-aware (hall size, racks, GPU models, power, PUE, savings) and goes **deeper while a rack's detail screen is open**. The **rack-detail screen has its own 💬 chat dock** (type, or 🧠/`T` voice) scoped to that rack — ask "how do I fix it?", root cause, PUE impact. OpenAI via `/api/chat`, local fallback. |
| **VR walk + voice AI** | `public/vr.js`, `public/vr.html` | First-person walkthrough (joystick/gyro/cardboard) with an in-world **OpenAI voice assistant**: push-to-talk (tap to talk, tap to send), spoken replies, fed a live facility spec (size, racks, GPU models, kW, PUE, savings, the GPU-16 fault) — plus an **"Ask AI about this rack"** entry that goes deep on the inspected unit. Falls back to the local brain offline. |
| **App shell** | `public/app.js`, `index.html`, `styles.css` | Live loop, HUD, panels, inspector, decision log, work order. |

This is the **demonstrable** form of the system in [`../docs/architect.md`](../docs/architect.md):
the in-browser model stands in for the production EnergyPlus/Sinergym twin + MPC/RL
agent, with the same shape and interfaces.

## 📱 Field AR (phone) — the QR demo

Click **“📱 Open Field AR — scan QR”** (left panel, Roadmap card). A QR appears
encoding your laptop's **LAN URL** (`http://<your-ip>:7878/ar`). Scan it with a
phone on the **same Wi-Fi**. The phone opens an AR assistant with **two modes**:

1. **🔧 Fix the flagged machine** — navigates you to **GPU-16** (wayfinding arrow +
   distance), you tap to **lock AR rings** onto it, and it shows the fault + the
   exact step-by-step fix (the ringed part to replace).
2. **✨ Build a twin from camera** — point at **any** machine (a bottle works as a
   stand-in), tap it, and the AI "scans the video", draws a **blueprint wireframe**
   over it, attaches **live sensors** (temp, vibration, RPM, load…), and gives you a
   **control panel** (power + speed) the sensors respond to. *"This is how any
   factory becomes a controllable digital twin."*

> **Camera:** the server runs HTTPS by default, so the **live phone camera works** —
> accept the one-time certificate warning. If you forced `TEJAS_HTTP=1`, the camera
> pages fall back to a simulated view with the same overlays so the demo never fails.

## ✏️ Twin Studio (build any twin)

Admin → **Create new → Twin Studio** (`/build`). An open canvas where you:
- **search** the palette (compressor, chiller, CRAC, cooler, pump, CNC, sensors…) and
  **drag** components onto the canvas, move and configure them;
- or **describe it in a prompt** ("cold storage with 2 compressors and 3 coolers") and
  the AI lays it out;
- **detect your location** to pull live temperature + **wind flow** (a wind arrow on the
  canvas) so cooling is placed sensibly;
- hit **⚡ Activate** to turn the design into a live, controllable factory twin.

## Roadmap (shown in the UI)
- **Now** — AI data-center hall: autonomous cooling + predictive maintenance.
- **Next** — the same brain into manufacturing hubs & normal factories; **build a
  twin of any machine from the camera**, with sensors you can control.
- **V2 📱** — field AR repair guidance: *“rotate this / replace that”* on the machine.
