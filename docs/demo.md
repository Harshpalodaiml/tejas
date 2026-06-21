# Tejas AI — The Two-Screen Demo

> How to present Tejas AI to anyone — investor, customer, or the internet — **without owning a data center.** Everything here runs on **one laptop, fully offline.** See [`project.md`](./project.md) for the pitch and [`architect.md`](./architect.md) for the system design.

---

## 1. The idea of the demo

You can't bring a 45°C data center into a meeting. So you bring a **digital twin** of one — a real physics simulation — and let the audience watch the AI beat the dumb controller live, and watch *you operate it by voice.*

Two screens tell the whole story:

- **Screen A — THE FACILITY (the digital twin):** a simulated cold store / data center on a hot Chennai day. Temperatures, the AI controller, the old rule-based controller, and energy use — live.
- **Screen B — TEJAS AI (the product):** the voice-driven generative dashboard. You *talk*; it rebuilds itself; the savings number climbs. No mouse, no clicking.

> The "whoa" = both screens at once: you speak to Screen B, and Screen A's world responds while the savings rack up.

---

## 2. What's on each screen

```
 ┌─────────────────────────────────────┐   ┌─────────────────────────────────────┐
 │ SCREEN A — THE FACILITY (twin)       │   │ SCREEN B — TEJAS AI (gen UI + voice) │
 │                                       │   │                                       │
 │  Chennai · June · 43°C outside ☀️     │   │   🎙️ [hold SPACE to talk]             │
 │                                       │   │                                       │
 │  Zone temp (safe 2–8°C)               │   │   ┌─────────────────────────────┐     │
 │   ███ AI: 4.2°C ✓                     │   │   │ (dashboard builds itself      │     │
 │   ███ Baseline: 4.0°C ✓               │   │   │  from what you say)           │     │
 │                                       │   │   └─────────────────────────────┘     │
 │  Energy (kW)                          │   │                                       │
 │   Baseline ▓▓▓▓▓▓▓▓▓                  │   │   last command:                       │
 │   Tejas AI ▓▓▓▓▓▓     ◄ 28% lower     │   │   "show me today's savings"           │
 │                                       │   │                                       │
 │  [outside temp slider: 30 ──●── 48°C] │   │   ► Saved today: ₹4,310 · 312 kWh    │
 └─────────────────────────────────────┘   └─────────────────────────────────────┘
```

- Screen A keeps **both** temperatures safe — the point is *energy*, not safety. The AI's energy bar sits clearly below baseline.
- The **outside-temp slider** lets the audience trigger a heat wave and watch the gap widen.
- Screen B starts nearly empty and **fills in response to your voice.**

---

## 3. The demo script (≈3 minutes, fully rehearsed)

> Hold the push-to-talk key (SPACE) while speaking. Local Ollama parses each command; the dashboard responds.

| # | You say (voice) | What happens |
|---|---|---|
| 1 | *"Tejas, show me the Chennai cold storage, AI versus the old controller."* | Screen B builds the side-by-side comparison; Screen A is already simulating |
| 2 | *"How much are we saving right now?"* | Screen B pops a **BigNumber**: "28% · ₹4,310 today · 312 kWh" |
| 3 | *"It's a heat wave — push the outside temperature to 47 degrees."* | Screen A's weather jumps; **baseline panics and burns energy; the AI adapts smoothly** — the savings gap visibly widens |
| 4 | *"Show me the temperature — are we still safe?"* | Screen B renders the temp gauges: both inside the safe band ✓ ("same safety, far less power") |
| 5 | *"Project this savings across a year for ten facilities."* | Screen B shows the extrapolation: annual ₹ + kWh + tonnes CO₂ |
| 6 | *"Switch this site to advisory mode."* | Mode toggles; Tejas now *recommends* setpoints a human applies — shows the safe deployment story |
| 7 | *(in Hindi/Tamil)* *"आज सबसे गरम यूनिट कौन सी है?"* | Vernacular voice works → surfaces the hottest unit. (Shows the India/operator moat) |

**Closing line (say it out loud):**
> *"Everything you just saw ran on this one laptop, offline. The facility is a physics-accurate digital twin — which is exactly how we build and prove the AI before we ever touch a real site. No data center required to start. And the operator never touched a mouse."*

---

## 4. The honest framing (say this — it builds trust)

Do **not** overclaim. Investors and operators respect the real line:

> *"This is validated in **simulation** on real Indian weather — enough to prove the AI logic and a credible savings range. The **pilot** proves it on a live facility: we connect read-only, shadow the real system for 30 days, and show the savings on *your* actual data before we ever take control."*

That line turns the demo into the natural next step: a **shadow-mode pilot.**

---

## 5. Build checklist (what to actually make)

**The backend (the engine + twin):**
- [ ] Stand up **EnergyPlus + Sinergym**; load the `2ZoneDataCenterHVAC` model (or a cold-storage model).
- [ ] Drop in an **Indian `.epw` weather file** (Chennai/Mumbai).
- [ ] Implement the **baseline rule-based controller** (the "dumb thermostat").
- [ ] Implement the **Tejas controller** — start with **MPC** (fast win, no long training); add an RL agent later.
- [ ] Run both; log temps + energy → compute % savings and ₹ (use a real tariff).

**Screen A (the facility / twin view):**
- [ ] Live charts: zone temp (AI + baseline, with safe band), energy (AI vs baseline), savings counter.
- [ ] Outside-temperature **slider** wired to the sim.

**Screen B (Tejas gen-UI + voice):**
- [ ] **Ollama** running locally (Llama 3.x / Qwen) as the UI controller.
- [ ] Component registry: `LineChart, BigNumber, Comparison, Gauge, Table, Alert, ModeSwitch`.
- [ ] LLM loop: prompt + UI state + data schema → tool call and/or UI spec (JSON) → render.
- [ ] **Push-to-talk** (hold SPACE) → mic → **STT** (Whisper/Vosk local) → text → Ollama.
- [ ] (Optional) **TTS** (Piper) for spoken replies; vernacular STT for the Hindi/Tamil moment.

**Glue:**
- [ ] One backend feeds both screens (shared sim state over websockets).
- [ ] Everything offline on one laptop + external monitor (or two browser windows).

**Realistic effort:** a focused solo build in ~2–4 weeks. MPC-vs-baseline on the twin is the hard-but-bounded part; the gen-UI/voice layer is mostly wiring Ollama + STT to a component renderer.

---

## 6. Failure-proofing the live demo

- **Voice flakes?** Every voice command also works as a **typed prompt** — same Ollama loop. Demo never dies on a bad mic.
- **Pre-warm the sim** so charts are populated when you start (don't present an empty screen).
- **Rehearse the exact command list** in §3 — generative UI is probabilistic, so test that *those* phrasings reliably produce the intended views; keep the fixed-screen fallback one keypress away.
- **Have a recorded screen-capture** of the perfect run as a backup to play if the room's setup fights you — and as the clip you post online to "break through the internet."

---

## 7. Why this demo wins

- **It makes the invisible visible.** Cooling savings are abstract; watching the AI's energy line dive below the dumb controller on a heat-wave day is visceral.
- **It proves the "no hardware needed" story** — the twin *is* the method, not a fake.
- **It's unforgettable and shareable** — "the AI you *talk to* that slashes cooling energy" is a 30-second clip that spreads.
- **It sets up the sale** — the honest "now let's shadow your real facility" close is the obvious next step.

> One laptop. Two screens. A simulated 45°C day. An AI that beats the dumb thermostat — and rebuilds its own dashboard when you talk to it. That's the whole company, demonstrable today, with no data center in sight.
