# Tejas AI — 60-Second Elevated Pitch
## The 30 · 40 · 30

> **60 seconds total.** Three acts. One laptop. One wow moment.  
> **30%** = Hook (18 sec) · **40%** = Wow (24 sec) · **30%** = Close (18 sec)

---

## The structure (why this works)

| Act | Time | % | Job |
|---|---|---|---|
| **HOOK** | 0:00 → 0:18 | **30%** | One question. One real crisis. They feel the pain before you name the product. |
| **WOW** | 0:18 → 0:42 | **40%** | **Show, don't tell.** Heat wave. AI beats dumb BMS. Live. Their jaw drops here. |
| **CLOSE** | 0:42 → 1:00 | **30%** | Proof frame. Zero risk. One line they'll repeat in the elevator. |

**Rule:** The wow act is **live demo** — not a slide. You talk *while* the twin moves.

---

## THE SCRIPT — word for word (~155 words · ~60 sec)

*Stage directions in italics. Bold = punch the word.*

---

### ACT 1 — HOOK · 30% · 0:00–0:18

*Stand still. Eye contact. No laptop yet.*

> **"What did your building know last night — that you didn't?"**
>
> *Pause. Two beats.*
>
> Your BMS knew the chiller was dying. Your weather feed knew **Thursday is forty-seven degrees.** Chennai. Cold storage. Factory floor. **Same story.**
>
> The data was there. **The story wasn't.**

*Turn to screen. Hand on keyboard. Energy shifts.*

---

### ACT 2 — WOW · 40% · 0:18–0:42

*Open https://localhost:7878/datacenter — sim already running*

> This is **Tejas** — तेजस् — the AI brain for cooling. **Watch.**

*Drag weather to **47°C** — or say aloud:*

> **"Heat wave. Push outside to forty-seven."**

*Sky turns red. Baseline power bar spikes. Tejas bar stays low. Point at the gap.*

> See that gap? **Same safety band. Twenty-eight percent less power.** The dumb controller panics. **Tejas predicts.**

*Type or say:*

> **"Is any machine going down?"**

*GPU-16 rack pulses red in 3D. Service email appears.*

> Rack sixteen — dying **fourteen months** before your inspector walks the floor. **Parts list. Work order. Done.**

*This is the wow. Don't rush it. Let the gap breathe for one second.*

---

### ACT 3 — CLOSE · 30% · 0:42–1:00

*Step back from screen. Back to eye contact.*

> Everything you just saw — **one laptop. Fully offline.** We prove it on **your** data first: thirty days, read-only, zero rip-and-replace.
>
> We don't sell dashboards. **We sell rupees off your power bill** — before the outage, before the inspection, before two fourteen AM.
>
> **What did your building know last night?** Let's make sure you know it **tonight.**

*Stop. Silence. Don't fill it.*

---

## Timing card (rehearse with a phone timer)

```
0:00  "What did your building know last night..."
0:05  "...that you didn't?"  [PAUSE]
0:08  BMS · 47° · Chennai · same story
0:15  "The story wasn't."  → open laptop
0:18  "This is Tejas. Watch."
0:22  Drag to 47°C / voice command
0:26  Point at savings gap — HOLD 1 SEC
0:30  "Is any machine going down?"
0:35  GPU-16 red · parts · work order
0:42  "One laptop. Fully offline."
0:48  "Your data. Thirty days. Read-only."
0:52  "Rupees off your power bill"
0:57  "What did your building know last night?"
1:00  STOP.
```

---

## The wow moment — exactly what must land

If they remember **one thing**, it's this:

```
┌─────────────────────────────────────────────────────────┐
│  47°C outside  →  baseline PANICS  →  power bar SPIKES │
│                  Tejas HOLDS       →  gap WIDENS       │
│                                                         │
│  Same green safety band. 28% less energy.               │
│  + GPU-16 pulsing red. "Fourteen months early."         │
└─────────────────────────────────────────────────────────┘
```

**Pre-load before you speak:** sim warm, PUE visible, weather at 43°C so the jump to 47°C is instant.

---

## Elevated delivery notes

| Do | Don't |
|---|---|
| Pause after the opening question | Rush into product name |
| **Point** at the savings gap — physical gesture | Read slides |
| Let silence sit 2 sec after GPU-16 reveal | Apologise for the demo |
| Say "Watch" once — then **show** | Explain MPC, BACnet, twin architecture |
| End on the **same question** you opened with (bookend) | Trail off with "happy to answer questions" |

**Vocal rhythm:** Hook = slow, low. Wow = energy up, short sentences. Close = slow again, certainty.

---

## One-breath version (if cut to 45 sec)

> What did your building know last night that you didn't? Your BMS knew the chiller was dying. The data was there — the story wasn't. *[demo: 47°C, gap widens, GPU-16 red]* Same safety. Twenty-eight percent less power. One laptop. We prove it on your data in thirty days, read-only. We sell rupees off your power bill — before two fourteen AM.

---

## Variants

### Investor (swap one line in CLOSE)

> Phaidra proved AI-run cooling works — for hyperscalers. **We're the on-prem brain for everyone they ignore.** Savings-share. You pay only from money you weren't going to have.

### Customer / facility head (swap one line in HOOK)

> **What was your power bill last July — and what almost tripped?** Your BMS knew. The story wasn't.

### Hindi closer (optional last 5 sec — only if audience is Hindi-first)

> *"आज रात आपकी बिल्डिंग क्या जानती है — जो आप नहीं?"*

---

## Pre-flight (non-negotiable)

- [ ] `./run.sh` tested **same day**
- [ ] Weather slider at **43°C** before you walk in
- [ ] Chat tested: *"Is any machine going down?"* → GPU-16
- [ ] Phone timer rehearsed **5×** — you finish at 0:58–1:02
- [ ] Recorded backup clip if the room kills Wi-Fi

---

## The line they repeat

> **"What did your building know last night that you didn't?"**

That's the pitch. Everything else is proof.

---

*Pair with: [`pitch.md`](./pitch.md) (full playbook) · [`Tejas-AI-Pitch-Deck.pptx`](./Tejas-AI-Pitch-Deck.pptx) (slide 2 = this hook)*