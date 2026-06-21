# Tejas AI — The Autonomous Brain for Cooling & Energy

> *Tejas* (तेजस्) — Sanskrit for radiance, sharpness, fire-energy. Also India's indigenous fighter jet. A fitting name for an AI built to tame heat and energy, made in India.

> Companion docs: [`PRODUCT.md`](./PRODUCT.md) (every feature, depth + future) · [`ARCHITECTURE.md`](./ARCHITECTURE.md) (complete technical reference) · [`architect.md`](./architect.md) (layer design) · [`demo.md`](./demo.md) (two-screen demo).

---

## 1. One line

**Tejas AI is a self-learning AI agent that runs a facility's cooling system at peak efficiency — cutting energy 20–40% — trained safely on a digital twin, deployed without ripping out existing hardware, and operated just by talking to it.**

---

## 2. The problem

**Cooling is one of the largest and fastest-growing energy drains on earth — and it is run by dumb, decades-old logic.**

- A data center can spend **30–40% of its total energy just on cooling.** Cold storage, commercial buildings, and industrial plants are similar or worse.
- Almost all of it is controlled by **fixed rule-based logic** ("if temp > X, turn on chiller") set up once at install and never touched. It reacts *after* heat builds up, over-cools "just to be safe," and wastes enormous power.
- The people running these systems are **operators, not data scientists.** They can't tune a controller; they can barely navigate the building-management dashboard.

**Why this is a five-alarm problem specifically in India:**

| Factor | Why it makes cooling a national-scale problem here |
|---|---|
| **Extreme, rising heat** | 40–48°C summers mean cooling runs harder, longer — and climate change is making it worse every year. |
| **Expensive, unreliable power** | Industrial power is costly and grid-stressed; every wasted kWh hurts twice (cost + grid load). |
| **Water scarcity** | Many cooling systems are water-hungry; optimization cuts water too. |
| **Exploding demand** | India is in a **data-center building boom** (every hyperscaler is here), a cold-chain expansion (₹-lakh-crore food-waste problem), and a commercial-real-estate surge — all heat-intensive. |
| **Nobody is optimizing it** | The hyperscalers will buy Phaidra. The **thousands of cold stores, buildings, hospitals, edge DCs, and factories** have *no one* optimizing their cooling. |

> **The cost of dumb cooling in India is paid in rupees, in grid blackouts, in spoiled food, and in carbon — every single hot day.**

---

## 3. The solution

Tejas AI replaces "dumb thermostat" logic with a **learning agent** that does three things rule-based control can't:

1. **Predicts instead of reacts.** It uses leading indicators (incoming load, weather forecast, thermal mass) to cool *ahead* of the heat — not after temperatures already spiked. *(This feed-forward approach is exactly what Phaidra proved on NVIDIA AI factories — predicting from rack power and acting in <10 seconds.)*
2. **Optimizes continuously.** It finds the setpoints, fan speeds, and chiller staging that hold the *safe* temperature using the *least* energy — and keeps re-learning as the facility and seasons change.
3. **Is operated by voice and natural language.** No dashboard training. The operator just says *"show me which unit is running hottest"* or *"how much did we save today?"* and the interface builds the answer itself.

And critically — **it trains and proves itself on a digital twin before it ever touches real hardware**, then deploys in a safe, trust-building sequence (watch → advise → control). This is what makes it sellable to conservative operators who would never let an unproven AI near critical cooling.

---

## 4. Why we are better

### vs. the status quo (rule-based BMS / building automation)
- They **react**; we **predict**. They're **static**; we **learn**. Result: 20–40% less cooling energy for the same safety.
- We sit **on top of** existing controls (no rip-and-replace) — we send better setpoints to the hardware they already have.

### vs. Phaidra / foreign players
- **They chase the hyperscalers** (NVIDIA AI factories, CoreWeave). That leaves the **entire mid-market — India's cold chain, buildings, hospitals, edge DCs, factories — wide open.**
- **Sovereignty + cost:** Indian facilities want a system that runs **on-prem, in their control, affordably** — not a premium foreign cloud service. Tejas runs **fully local** (on-device LLM via Ollama, on-prem optimization), so data and control never leave the site. That's a moat foreign vendors structurally can't match for cost-sensitive, sovereignty-minded Indian buyers.
- **India-tuned:** trained on Indian weather, Indian load patterns, Indian operator workflows (vernacular voice).

### vs. building it in-house
- A cold-storage chain or a mid-size DC has neither the ML talent nor the simulation infrastructure. We are the **off-the-shelf cooling brain**, proven on a twin, with measurable savings from day one.

**The defensibility (the lesson we're not repeating):** the moat is **not** the dashboard or the voice — those are features anyone can copy. The moat is the **domain engine** (the calibrated digital twin + the safe control policy + the proprietary operational data we accumulate per facility) and the **trust to run critical cooling.** The flashy gen-UI rides *on top of* that hard core — never instead of it.

---

## 5. Target users

**Beachhead (where we start):** facilities that are *desperate, accessible, and underserved* — in priority order:

1. **Cold storage / cold chain** — refrigeration is their #1 cost; spoilage is a national problem; fragmented operators hungry for savings; easy to get into.
2. **Commercial buildings** (malls, offices, hospitals) — HVAC is 40–50% of building energy; thousands of buyers; brutal Indian heat.
3. **Edge / mid-size data centers & colos** — India's DC boom is minting hundreds of smaller operators the hyperscalers ignore.

**Who signs the cheque:** the facility owner / operations head / energy manager — someone who reads an electricity bill and feels the pain.
**Who uses it daily:** the on-site operator / technician — hands full, not technical, perfect fit for voice + generative UI.

---

## 6. How it works (the four phases)

```
  PHASE 0 — TWIN          PHASE 1 — SHADOW         PHASE 2 — ADVISE        PHASE 3 — CONTROL
  ───────────────         ─────────────────        ────────────────        ─────────────────
  Build a digital twin    Connect to the real      The AI tells the         The AI takes the
  of the facility.        facility, READ only.     operator the optimal     controls (closed-loop),
  Train + prove the AI    Compare AI's would-be    setpoints in real time.  with hard safety limits
  in simulation. No       actions vs reality.      Human applies them.      and instant human
  hardware needed.        Prove the savings.       Builds trust + ROI.      override.
```

Each phase de-risks the next. Phase 0 needs **zero physical access** — it's how we build and demo the whole thing today (see [`demo.md`](./demo.md)).

---

## 7. How we break through (go-to-market)

The category is technical and conservative — so we lead with **proof and spectacle**, not cold sales.

1. **The unforgettable demo (our wedge into attention).** A live, two-screen, voice-controlled demo (digital twin on one screen, Tejas gen-UI on the other) where the AI visibly beats a dumb controller on a simulated 45°C Indian day. It's *shareable* — investors, operators, and the internet remember "the AI you talk to that slashes cooling energy." This is how we break through online: **clip it, post it, let the wow spread.**
2. **Advisory-mode pilots (our wedge into revenue).** "Let us read your sensor data for 30 days and show you, on *your* numbers, what we'd have saved — zero risk, you don't change anything." Almost-free yes → undeniable ROI → paid control contract.
3. **Savings-share pricing (our wedge past procurement).** Charge a slice of the energy we save. The customer pays *only* out of money they weren't going to have. No capex argument to win.
4. **Content + credibility.** Publish the digital-twin results, the methodology, an open benchmark. Become the visible Indian authority on AI cooling optimization. Ride the Phaidra/NVIDIA "AI factory" wave — the world now knows AI-run cooling works; we're the ones who bring it to everyone Phaidra ignores.
5. **Partnerships.** Cold-chain associations, DC operators, energy-efficiency/ESCO firms, and state energy-efficiency programs (BEE) as distribution.

---

## 8. Business model

- **Savings-share** (e.g., 20–40% of verified energy savings) — aligns incentives, kills the capex objection. *Primary.*
- **SaaS per facility / per ton of cooling** — predictable recurring revenue once trust is established.
- **Twin-build + advisory engagement** — a paid on-ramp that funds the pilot and produces the ROI case.

Land one facility in a chain → expand across all their sites (the twin and playbook replicate). Net-revenue-retention engine.

---

## 9. Why now

- **The science is proven.** DeepMind cut Google's cooling energy ~40%; Phaidra is now doing it on NVIDIA AI factories in production. AI-run cooling is no longer speculative — it's *validated*, which de-risks the whole category for buyers.
- **The tools are free and mature.** Open-source digital twins (EnergyPlus, **Sinergym** — which ships a data-center HVAC model) let us build and prove the AI with no hardware.
- **Local LLMs got good.** Ollama + small models run the voice/gen-UI layer **on a laptop, offline** — perfect for sovereign, on-prem industrial deployment.
- **India is heating, building, and electrifying** all at once — cooling demand is exploding while the grid strains. The pain is growing every summer.

---

## 10. The bet, in one breath

> **The world just proved that AI can run cooling far better than humans — but the people doing it are aiming at a handful of hyperscale AI factories. India has thousands of cold stores, buildings, hospitals, and data centers cooking in 45°C heat on dumb 1990s logic, bleeding power and money. Tejas AI is the cooling brain for all of them: trained on a digital twin so we need no hardware to start, deployed safely watch→advise→control, run fully on-prem, and operated by simply talking to it. We don't sell a dashboard. We sell rupees off the power bill — and we do it for everyone the giants ignore.**
