# Tejas AI — AI Factory Elevated Pitch
## Test autonomous control in the twin · Repair in VR · Deploy to real on your terms

> **Audience:** AI factory operators, GPU colo builders, hyperscaler-adjacent edge DCs, NVIDIA-class training halls.  
> **Angle:** Phaidra proved AI factories need autonomous cooling — but nobody lets you **practice** before you touch live hardware. Tejas is the **testing environment**. VR repair cuts downtime and cost.  
> **Demo:** `cd tejas-twin && ./run.sh` → `/datacenter` + `/vr?enter=1`

---

## The one line (new)

> **Tejas gives every AI factory a full digital twin testing ground — train autonomous cooling, stress heat waves, and repair faults in VR — so your team graduates to the real hall with proof, not prayer.**

---

## Why this pitch is different

| Old pitch | **AI Factory pitch** |
|---|---|
| "We save 20% cooling ₹" | "Your AI factory **requires** autonomous control — we let you **test it safely first**" |
| Chennai heat-wave story | **GPU hall at 47°C** — same physics as H100/B200 training load |
| AR fix as side feature | **VR repair is the hero** — less downtime, less cost, technician never lost |
| We deploy for you | **You test in twin → shadow → you own the real env** when ready |

---

## The elevated narrative (3 beats)

```
1. AI FACTORIES CHANGED THE RULES
   Rack power is a leading indicator. Autonomous control in <10s.
   Phaidra runs NVIDIA halls. Everyone else is still on 1990s BMS logic.

2. YOU CANNOT LEARN ON LIVE GPUs
   One wrong setpoint = millions in failed jobs.
   Tejas = the testing environment: twin → shadow → advise → control.
   Break chillers, heat waves, GPU-16 faults — in simulation. Zero risk.

3. REPAIR IN VR = LESS DOWNTIME, LESS COST
   Don't fly a senior tech across the country for a filter.
   Walk the hall in VR, inspect the rack, see the exploded design,
   fix in AR — 25 minutes, not 25 hours of outage.
```

---

# SLIDE DECK — 14 slides (copy to PowerPoint or use `Tejas-AI-Factory-Deck.pptx`)

---

## Slide 1 — TITLE
**Visual:** Dark navy. Single glowing rack line receding into VR perspective.

**Headline:**
# TEJAS AI
### The AI factory testing environment

**Sub:**
Train autonomous control · Stress the twin · Repair in VR · Deploy to real when you're ready

**Footer:** तेजस् · On-prem · Sovereign · Built for GPU halls

**Speaker note:** Don't open with savings. Open with fear: *you cannot learn autonomous cooling on live H100s.*

---

## Slide 2 — THE AI FACTORY PROBLEM
**Headline:** AI factories broke the old playbook

**Bullets:**
- Rack power spikes **before** inlet temp moves — you have **seconds**, not minutes
- Training jobs run **weeks** — one cooling trip = **₹2+ Cr** in lost compute + SLA hell
- Phaidra proved autonomous control works — on **NVIDIA-scale** AI factories
- Everyone else still runs **rule-based BMS** set in the 1990s

**Stat box:** `30–40%` of hall power = cooling · `47°C` ambient = margin gone

**Speaker note:** "The giants proved it works. The mid-market has no way to **practice** before they flip the switch."

---

## Slide 3 — YOU CANNOT TEST ON LIVE SILICON
**Headline:** The real hall is not a lab

**Three columns:**

| Test on live hall | Test on Tejas twin |
|---|---|
| ❌ Failed job = customer churn | ✅ Heat wave in one drag |
| ❌ Wrong CHW setpoint = chip throttle | ✅ Chiller trip — recover in sim |
| ❌ No rollback story for the board | ✅ Shadow mode: log would-do vs BMS |
| ❌ Insurance / MoC nightmare | ✅ Trust ladder with hard revert |

**Pull quote:**
> *"Would you let an untested AI drive your GPUs on Thursday's 47°C day? Neither would we."*

---

## Slide 4 — TEJAS = THE TESTING ENVIRONMENT
**Headline:** A full AI factory — on one laptop — before you touch hardware

**Diagram:**
```
YOUR REAL HALL          TEJAS TESTING ENV           GRADUATION PATH
─────────────          ─────────────────           ───────────────
BMS (read-only)   →    Digital twin (physics)  →   You run shadow
Historian export  →    Autonomous brain        →   You approve advise
GPU telemetry     →    47°C stress tests       →   You take control
                       VR walk + repair            when YOUR data proves it
```

**What they get day one:**
- Calibrated twin (topology + historian — not a drawing toy)
- AI vs baseline running **live** — PUE 1.3 vs 1.5 at 47°C
- **Zero write access** until they choose to graduate

**Speaker note:** "We don't ask you to trust us. We give you a **sandbox** that looks like your hall."

---

## Slide 5 — LIVE DEMO BREAK
**Visual:** Full-bleed screenshot placeholder. Big text: **DEMO NOW — 2 minutes**

**Demo script (in order):**
1. `/datacenter` — Autonomous Control card · PUE live
2. Weather → **47°C** — baseline panics, Tejas holds
3. *"Is any machine going down?"* → **GPU-16** pulses red
4. Open **VR QR** on phone → `/vr?enter=1`

**Say:** "This is the testing environment. Same physics. Your GPUs are not at risk."

---

## Slide 6 — AUTONOMOUS CONTROL (THE REQUIREMENT)
**Headline:** What the testing environment trains

**Bullets:**
- **Feed-forward control** — acts on rack power + weather **before** inlet spikes
- Grid-search today → MPC/RL in production — **same trust ladder**
- Explains every move: *"Heat wave: running supply warmer to protect COP"*
- Dual run: **Tejas vs dumb BMS** — savings gap visible in real time

**Comparison table:**

| | Baseline BMS | Tejas in twin |
|---|---|---|
| 47°C response | Reactive · power spike | Predictive · holds band |
| PUE | ~1.50 | ~1.30 |
| Operator | Dashboard training | *"Push outside to 47"* |

**Future in real hall:** Shadow 30 days → they see **their** numbers → they flip control themselves.

---

## Slide 7 — THE TRUST LADDER (YOU GRADUATE, NOT US)
**Headline:** From testing env to real hall — on your schedule

```
TWIN          SHADOW           ADVISORY         SUPERVISED        AUTONOMOUS
(test here)   (read-only)      (you apply)      (you confirm)     (you own it)
     │              │                │                │                 │
  Break things   Your historian   Your operator    Your MoC         Your control
  in sim         proves ₹         clicks apply     sign-off         policy
```

**Key line:**
> **We hand you the keys when your data says yes — not when our sales deck says yes.**

**Commercial:** Shadow pilot = low fee or free · Savings-share only after **they** choose advisory+

---

## Slide 8 — HERO: REPAIR IN VR
**Headline:** Less downtime. Less cost. The technician never walks blind.

**Visual:** Split — left: empty aisle + flight ticket ₹₹₹ / right: phone VR + GPU-16 reticle

**The cost of the old way:**
| Old repair path | Tejas VR + AR path |
|---|---|
| Alarm at 2:14 AM | GPU-16 flagged **14 months early** |
| Senior tech on a plane | **VR walk** to exact rack — any junior on site |
| Open the rack blind | **Exploded design** — filter, fan tray, busbar |
| 4-hour diagnosis | **25-minute** fix with parts list pre-staged |
| ₹2+ Cr outage | **Planned window** — hall never tripped |

**Stat:** `14 months` early detection · `25 min` on-site fix · `₹8.3L/yr` waste eliminated per rack-class fault

**Speaker note:** THIS is the emotional peak. Put the phone in their hand. Let them **stand inside** the hall.

---

## Slide 9 — VR REPAIR FLOW (SHOW THIS LIVE)
**Headline:** Walk in · Pick · Inspect · Fix · Blue

**Steps (match product):**
1. **Scan QR** → stand inside the live twin (`/vr`)
2. **Joystick walk** to Row 2 — GPU-16 pulsing red
3. **Reticle pick** → SERVICE NEEDED · inlet · load · CFM
4. **Aspect lenses** → Cooling: CRAC-2 filter + fan tray highlighted
5. **Field AR** (`/ar`) → 4-step checklist on the **real** machine
6. Rack turns **blue** — work order closed — desktop syncs

**Say:**
> *"Your tech in Chennai doesn't need a senior from Frankfurt. They **walked the fault in VR** last Tuesday."*

**Downtime math (say aloud):**
- Unplanned GPU hall trip: **₹2+ Cr**
- VR-guided planned fix: **25 min** · parts known · **zero** surprise

---

## Slide 10 — PREDICT BEFORE THE TRIP
**Headline:** GPU-16 — the story every AI factory has, but doesn't see

**Bullets:**
- Inlet **3.4°C hotter** than load explains — 14-month creep
- Root cause: CRAC-2 filter + rear fan-tray bearing
- Tejas drafts the **work order + email** with exact parts
- Caught in the **testing twin** first — then validated on real historian in shadow

**Chat line:** *"Is any machine going down?"*

**VR line:** Reticle on GPU-16 → *"SERVICE NEEDED"*

**Link to repair:** Prediction in twin → practice fix in VR → execute in AR on site

---

## Slide 11 — NUMBERS (AI FACTORY SCALE)
**Headline:** What the testing environment proves — before one setpoint hits silicon

**12 MW GPU hall · India tariff:**

| Line | Annual |
|---|---|
| Cooling energy saved (20–28%) | **₹1.8–3.2 Cr** |
| One avoided outage | **₹2+ Cr** |
| One VR-guided fix vs emergency | **₹8.3L+** waste cut |
| Fleet of 50 AI halls | **₹90–160 Cr** |

**Water / WUE:** Chennai-class — licence to operate, not just efficiency

**Say:** "Shadow mode puts **your** historian on this slide — not our simulation."

---

## Slide 12 — WHO THIS IS FOR
**Headline:** Built for the halls Phaidra doesn't serve — yet

| Buyer | Why Tejas testing env |
|---|---|
| **GPU colo / edge AI DC** | Can't afford a Phaidra pilot · need sovereign on-prem |
| **Enterprise AI lab** | Internal team must **own** control policy — we train them in twin |
| **DC operator adding GPU block** | Liquid + air mixed — test before go-live |
| **ESCO / integrator** | White-label testing sandbox for customers |

**Not for:** Greenfield with no telemetry yet (advisory-only twin first)

---

## Slide 13 — COMMERCIAL
**Headline:** Pay for proof — not promises

| Phase | What they buy | Price logic |
|---|---|---|
| **Testing env / twin build** | Calibrated sandbox + VR + AR | Paid on-ramp (credited to Y1) |
| **Shadow (30 days)** | Read-only · would-do report | Low / free — proves ₹ |
| **Advisory + control** | They graduate when ready | **Savings-share 20–40%** |

**Land-and-expand:** One hall testing env → campus → fleet panel (50 sites)

---

## Slide 14 — CLOSE
**Visual:** Dark. VR silhouette in aisle. Blue corrected rack glow.

**Headline:**
# Don't learn autonomous cooling on live GPUs.
# Learn it in the twin. Repair it in VR. Own the real hall when you're ready.

**Three lines:**
1. **Test** autonomous control — heat waves, load spikes, chiller trips — zero risk
2. **Repair** in VR — less downtime, less cost, parts before the plane ticket
3. **Graduate** on your data — shadow → advise → control — you flip the switch

**CTA:**
> *"Give us 30 days read-only on your historian. We'll show you the testing environment built from your hall — and one GPU rack you'd have lost on a 47°C Thursday."*

**Contact:** [email] · [calendar]

---

# 60-SECOND ELEVATED SCRIPT (AI Factory + VR)

### HOOK (0:00–0:18)
> Every AI factory now needs **autonomous cooling** — rack power moves in seconds, not minutes. Phaidra proved it on NVIDIA halls. But **you cannot practice that on live GPUs** — one wrong setpoint kills a three-week training job.

### WOW (0:18–0:42)
> *Open `/datacenter` then hand them VR.*
> Tejas is the **testing environment** — a full physics twin on one laptop. Watch: **47 degrees** — baseline panics, our brain holds PUE 1.3. *"Is any machine going down?"* — GPU-16, fourteen months early. Now **stand inside** — scan this QR — you're in the hall. Walk to the red rack. **That's the repair before the outage** — exploded design, exact parts, twenty-five minutes, not two fourteen AM.

### CLOSE (0:42–1:00)
> Test autonomous control here. Graduate to your real hall when **your** shadow data says yes. Repair in VR — **less downtime, less cost**. We don't sell dashboards. We sell **the sandbox where your team earns the right to flip the switch.**

---

# 3-MINUTE MEETING FLOW

| Min | Do | Say |
|---|---|---|
| 0:00 | Slide 2–3 | AI factory problem · can't test on live silicon |
| 0:45 | Slide 4 | Tejas = testing environment |
| 1:00 | **Demo** datacenter 47°C + GPU-16 | Autonomous control in twin |
| 1:45 | **Demo VR** — hand phone, walk to GPU-16 | Repair hero moment |
| 2:15 | Slide 8–10 | Downtime cost · VR flow · predict |
| 2:45 | Slide 11 + 13 | Numbers · shadow pilot CTA |
| 3:00 | Slide 14 | Close · calendar |

---

# DEMO CHECKLIST (AI Factory pitch)

- [ ] `run.sh` same day · weather pre-loaded 43°C
- [ ] GPU-16 fault visible before VR handoff
- [ ] **VR QR ready** on laptop screen (`/vr` link from datacenter)
- [ ] Phone on same Wi-Fi · HTTPS cert accepted
- [ ] Optional: AR QR for fix checklist after VR pick
- [ ] Shadow pilot one-pager printed with **their** hall name
- [ ] Backup screen recording if room Wi-Fi fails

---

# OBJECTION HANDLERS (AI Factory specific)

| Objection | Response |
|---|---|
| "We already have Phaidra / Schneider" | "They run production. We give your **internal team a testing sandbox** + VR repair — sovereign, on-prem, before you depend on anyone." |
| "We won't let AI near GPUs" | "Neither would we — **day one is read-only shadow**. The testing env breaks things in **simulation**, not silicon." |
| "VR is a gimmick" | "A single unplanned trip is **₹2 Cr**. VR is how your Chennai tech **practices** the fix before Frankfurt gets on a plane." |
| "Our team will build this" | "Build the twin infra + safety supervisor + VR repair loop — or **start testing Monday** on one laptop and graduate on your historian in 30 days." |

---

*Deck file:* [`Tejas-AI-Factory-Deck.pptx`](./Tejas-AI-Factory-Deck.pptx)  
*Pair with:* [`60-second-elevated-pitch.md`](./60-second-elevated-pitch.md) (general) · [`pitch.md`](./pitch.md) (full playbook)