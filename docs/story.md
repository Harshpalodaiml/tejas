# Tejas AI — The Story

> *What if the machine told you it was dying — three weeks before it took your data center down?*
>
> This is the story Tejas AI is built to tell. Every scene below maps to something the platform already does today: a live digital twin, an autonomous cooling brain, predictive maintenance, field AR, and enterprise ingestion — not a slide deck, a running system.

---

## Prologue: The Invisible Crisis

Cooling is the largest energy bill most facilities never think about.

A data center spends **30–40% of its electricity** just removing heat. A cold-storage warehouse bleeds rupees every summer night. A geothermal plant can lose megawatts when reinjection water runs too hot. A factory press vibrates for months before anyone walks the floor with a clipboard.

The equipment that runs all of this was programmed once — often decades ago — with fixed rules:

> *If temperature > X, turn on the chiller. If still hot, turn on harder.*

It reacts **after** heat builds. It over-cools "just to be safe." It cannot see a clogged filter degrading for fourteen months. It cannot predict a Chennai summer heat wave. It cannot draft a work order, guide a technician in AR, or tell you how much money you are wasting while you sleep.

**Tejas AI** (तेजस् — radiance, sharpness) replaces that dumb logic with a self-learning agent that **predicts, optimises, explains, and acts** — trained safely on a digital twin before it ever touches your hardware.

This is that story.

---

## Real-world anchors (every chapter is grounded here)

| Chapter | Real place / incident | Why it matters for Tejas | Source |
|---|---|---|---|
| **1 · Data center** | **Chennai** — India's fastest-growing DC corridor (OMR, Siruseri, Ambattur); operators like [CtrlS Chennai](https://www.ctrls.com/data-centers/chennai/) | Cooling + power stress during India's brutal summers | Facility + climate |
| **1 · Heat backdrop** | **[2024 Indian heat wave](https://en.wikipedia.org/wiki/2024_Indian_heat_wave)** — longest on record; engineers warned of **grid blackouts** as AC load spiked | Same physics as a hall trip: ambient ↑ → chiller COP ↓ → margin gone | [The Guardian, Jun 2024](https://www.theguardian.com/world/article/2024/jun/18/india-engineers-blackouts-heatwave-north) · [CNBC](https://www.cnbc.com/2024/06/14/pictures-india-records-longest-heatwave-delhi-faces-water-crisis.html) |
| **2 · Geothermal** | **[The Geysers](https://en.wikipedia.org/wiki/The_Geysers)** — world's largest geothermal field (California); steam production **fell after 1999**; **reinjection** of treated wastewater since 1997 keeps the reservoir alive | Reinjection temperature & separator health = slow field death, not one alarm | Wikipedia · Calpine operations |
| **3 · Factory** | **Renesas Naka fab fire, March 2021** — plant supplied **~30% of global automotive microcontroller** capacity; **100+ days** to normal production | One undetected fault → global supply chain stop | [2020–2023 global chip shortage](https://en.wikipedia.org/wiki/2020%E2%80%932023_global_chip_shortage#Fires_at_facilities) |
| **4 · Cold chain** | India's **₹92,651 crore** annual post-harvest loss from missing cold infrastructure | Refrigeration = #1 warehouse cost; spoilage is national scale | [IBEF cold chain blog](https://www.ibef.org/blogs/from-farms-to-fridges-how-cold-chain-infrastructure-is-transforming-india-s-agriculture) · [ICRIER Policy Brief 20](https://icrier.org/pdf/Policy_Brief_20.pdf) |

> **Note:** GPU-16, SEP-2, and PRESS-7 in the Tejas demo are **named characters** in the twin — composite scenarios inspired by the incidents above, not claims about one specific rack on one specific night.

---

## Chapter 1 — Chennai, 2:14 AM: The Data Center Almost Went Down

### What happened (the real problem)

**Chennai · OMR corridor** — a live AI training hall in the same belt as hyperscale builds along the Old Mahabalipuram Road and Siruseri SIPCOT, where operators like [CtrlS run Tier-IV-grade facilities in Chennai](https://www.ctrls.com/data-centers/chennai/). Three hundred twelve racks. Mixed cooling: air on legacy rows, direct-to-chip liquid on the GPU block.

Outside, Tamil Nadu was inside India's **[2024 heat wave](https://en.wikipedia.org/wiki/2024_Indian_heat_wave)** — the country's **longest on record**, the **third consecutive year** of extreme summer heat, with power engineers publicly warning that surging AC load could trigger **[prolonged blackouts](https://www.theguardian.com/world/article/2024/jun/18/india-engineers-blackouts-heatwave-north)** across the north and stress the grid everywhere cooling runs hard.

In our composite hall, ambient had sat above **42°C** for weeks. Wet-bulb was punishing. Cooling towers were at the edge of their envelope. Water mattered — the same summer that put Delhi on **[water-crisis tanker duty](https://www.cnbc.com/2024/06/14/pictures-india-records-longest-heatwave-delhi-faces-water-crisis.html)** was squeezing **WUE** (litres per kWh rejected) in every facility still running wet cooling.

At **2:14 AM**, Hall A tripped — in the story we tell to operators. In too many real halls, something like this already happened or came close.

Not because the GPUs failed. Not because power failed. Because **cooling lost the race against physics**.

The sequence — reconstructed from BMS logs, DCIM records, and a post-mortem no CFO wants to fund:

1. **6:00 PM (previous evening)** — Ambient crossed 44°C. The baseline BMS pushed chilled-water setpoints colder and spun fans harder. Chiller COP collapsed. Facility draw climbed **18%** above the weekly average. Night shift watched green dashboards. Every rack was still "in band."

2. **11:30 PM** — GPU load spiked. A training job landed on the liquid-cooled rows. CDU return temperature crept up. Air-cooled rows on the east side pulled hotter return air — **hot-aisle recirculation** worsened as airflow dropped below design.

3. **1:45 AM** — Rack inlets on Row 7 brushed the ASHRAE allowable ceiling. The BMS did what it was told: more cooling. More power. More water through the towers.

4. **2:14 AM** — Chiller #2 short-cycled on low turndown. Chiller #1 took full load at the worst ambient. Supply air to the GPU block went **3.2°C above** what those racks' IT load alone predicted. Two racks throttled. One job failed. Protective shutdown.

**Downtime cost (composite):** **₹2+ crore** in lost compute, SLA penalties, and emergency contractors — before reputational damage.

**The cruel part:** every predictive signal was already in the building. BMS trends. Redfish power telemetry. CDU flow and return temps. Historian data. Forecasts showing the heat wave **days out** — the same class of forecast that fed national **[heat action plans](https://india.mongabay.com/2024/09/the-climate-drivers-behind-southwest-indias-intensifying-heat-waves/)** across southwest India.

The data existed. **Nobody was reading it as a story.**

### What Tejas would have done — three weeks earlier

Tejas does not wait for 2:14 AM.

**Week −3 · Shadow mode (read-only, zero risk)**

An operator connects Tejas to the existing systems — BACnet BMS, Redfish IT telemetry, CDU REST APIs, SNMP on PDUs, historian export. No rip-and-replace. The write path stays dark. Tejas builds a **calibrated digital twin** of Hall A: every rack, every CRAH, every CDU, every chilled-water loop, every cold aisle and hot aisle — **topology**, not just asset counts.

The twin is tuned against 90 days of historian data until simulated temperatures match measured reality within **±1°C** and energy within **±8%**. Now Tejas can run the hall in simulation faster than real time — heat waves, load spikes, chiller trips — and log what it **would** have done.

**Week −2 · The AI sees the heat wave coming**

The operator asks — in plain English, in Hindi, in Tamil:

> *"What happens if outside hits 47 degrees next Thursday?"*

Tejas does not shrug. It runs the twin forward against **Chennai climate data** (Indian `.epw` weather — the same files the demo loads). It answers with numbers:

- Baseline BMS would push facility draw to **~14.2 MW** — breaching the demand-charge tier.
- PUE would climb from **1.42 → 1.61**.
- Two chillers would short-cycle. CDU return on the liquid rows would approach the chip-temp envelope.
- **Row 7 east** would see inlet temps **2.8°C hotter** than load predicts — the signature of worsening recirculation, not a sudden GPU fault.

It recommends: pre-stage supply-air setpoints warmer (recover chiller COP), trim fan speeds to the least-energy point inside the band, stage chiller #2 off the short-cycle window, and **schedule a filter inspection on CRAC-4** before the heat arrives.

**Week −1 · Predictive maintenance — no inspection tour needed**

Tejas has been watching **GPU-16** for fourteen months.

Not with a clipboard. With physics.

GPU-16's inlet temperature runs **3.4°C hotter** than its IT load alone explains. That gap has crept up steadily — the fingerprint of a **progressive airflow restriction**: a loading filter on CRAC-2 and a rear fan-tray bearing wearing out.

A human inspection might miss it. The rack is "still in band." The BMS is green.

Tejas flags it anyway. It drafts the service email:

```
To: R. Kumar (Facilities / HVAC)
Subject: Service needed — GPU-16 (cooling fault, est. ₹8,27,820/yr waste)

Likely cause: Progressive airflow restriction — filter loading on CRAC-2
plus rear fan-tray bearing wear.

Please bring:
  • CRAC-2 air filter set (MERV-13) ×1
  • Rear hot-swap fan tray (4-fan, 120 mm) ×1
  • Blanking panels for 6U of open slots ×6

On-site fix: ~25 minutes.
```

The technician does not need to "understand the hall." Tejas already did.

**Day 0 · The heat wave hits — autonomous control holds**

Outside: **47°C**. Sky turns red in the 3D twin. The baseline controller panics — fans max, chilled water coldest, power climbing.

Tejas runs supply air **warmer**, trims fans to the cube-law minimum, lifts chilled-water temperature to recover COP — and holds every rack inside the ASHRAE band at **PUE ~1.30** vs baseline **~1.50**.

Same safety. **20–28% less cooling energy.** ₹4,310 saved today. 312 kWh. The operator never touched a mouse. They asked:

> *"How much electricity are we using?"*

Tejas answered from live state and opened the power panel.

**2:14 AM · The outage that didn't happen**

Chiller #2 never short-cycles into the trap — Tejas staged around it Tuesday. GPU-16 was fixed Wednesday — twenty-five minutes, three parts. Row 7 recirculation was corrected before the heat wave. The hall never tripped.

**That is the product.** Not a dashboard. Not a report. A brain that reads the building like a story — and writes the next chapter before it becomes a disaster.

---

## Chapter 2 — The Geysers, California: When Reinjection Water Runs Too Hot

### What happened (the real problem)

**[The Geysers](https://en.wikipedia.org/wiki/The_Geysers)** in Sonoma and Lake County, California — the **world's largest developed geothermal field**. Eighteen power plants. More than 350 wells. ~1,590 MW. The loop every brochure simplifies:

> production wells → cyclone **separators** → steam turbine → condenser → cooling towers → **reinjection** back into the reservoir

The constraint operators learn the hard way: **you cannot take steam out forever without putting water back — and the water you put back must stay cool enough not to cook the field.**

By **1999**, decades of extraction had **depleted steam pressure and production** at The Geysers. Output was falling. The fix was not a bigger turbine. It was **reinjection** — since **October 1997**, treated wastewater has been piped in from Lake County and Santa Rosa (tens of millions of gallons per day), converting waste into renewable electricity and protecting local waterways. Read the full operations history: [Wikipedia — The Geysers](https://en.wikipedia.org/wiki/The_Geysers).

That is the real-world version of "geothermal water inside running too hot": separator efficiency, brine temperature, condenser approach, and **reinjection pond temperature** are coupled. Drift in any one shows up months later as **MW you no longer have**.

In the Tejas demo plant, **Separator SEP-2** (at `x === -7` in `plants.js`) is the story's stand-in for this class of fault — the same role a mist-carryover or brine-level drift plays at a real cyclone separator:

- Steam outlet temperature creeps while wellhead pressure looks stable.
- Reinjection pond temperature inches up.
- Condenser approach worsens in hot weather.
- Monthly inspection checklists get signed. SCADA stays green. **Nobody connects fluid + thermal + mechanical in one view.**

Emergency reservoir studies cost **millions of dollars and months of PhD-hours** — because the data lived in separate historians, not in one **physics-linked twin**.

### What Tejas would have done — month 1

Open the geothermal twin in the admin panel → walk it in **VR** (`/vr?type=geothermal`): production wells, **SEP-1…SEP-4**, steam header, turbine hall, condenser, cooling towers, reinjection pumps, reinjection wells — the exact layout in `plants.js`.

1. **Ingestion** — Modbus on wellheads/separators/turbine, historian export, P&ID upload. AI clarifies: *"Reinjection hard limit?"* *"Separator efficiency — measured or nameplate?"*

2. **Live twin** — Click **SEP-2**. Sensors: steam temp, wellhead pressure, reinjection °C, turbine RPM, grid MW.

3. **SEP-2 flagged early** — Pulsing red in 3D. Tejas correlates rising reinjection temperature with separator performance — **no deck walk required**.

4. **Field AR** — Technician scans QR → navigates to SEP-2 → checklist fix on the flagged separator. Desktop and phone stay synced.

**The sell:** the same platform that cools a Chennai GPU hall also guards the **closed water loop** that keeps a geothermal field alive for decades.

---

## Chapter 3 — Renesas Naka, Japan: One Fire, the World Stops Making Cars

### What happened (the real problem)

**19 March 2021** — a fire tore through a clean room at **Renesas Electronics' Naka fab** in Hitachinaka, Ibaraki. The plant made **automotive microcontroller units** — chips that sit in engine controls, airbags, and braking systems. Renesas supplied roughly **30% of the global market** for those MCUs.

Renesas said restart would take **at least 100 days**. Toyota, Nissan, Honda, and Ford adjusted production worldwide. The fire was one of several **fab fires** that deepened the **[2020–2023 global chip shortage](https://en.wikipedia.org/wiki/2020%E2%80%932023_global_chip_shortage#Fires_at_facilities)** — a crisis that hit **169 industries** and cost automakers an estimated **$210 billion** in 2021 revenue alone.

Nobody needed to "understand the whole fab" after the fact. They needed something that **saw abnormal thermal / electrical / vibration signatures before the fire** — or at minimum, a twin that let recovery teams know **exactly which line, which tool, which part** was lost.

The Tejas demo maps this story onto **PRESS-7** in `plants.js` — a machine station flagged `faulted: true` on the Smart Factory floor — but the **real lesson is Renesas-scale**: undetected degradation → catastrophic stop → planetary supply chain.

### What Tejas would have done

**Day 1 · Build the twin in minutes**

| Method | How | Time |
|---|---|---|
| **📷 Phone scan** (`/scan`) | Video walk-around → AI reconstruction → twin registered on server | ~10 min |
| **🖼️ Blueprint upload** | P&ID image → component + sensor extraction | ~5 min |
| **✏️ Twin Studio** (`/build`) | Drag CNC, motor, conveyor, vibration sensors — or prompt-build | ~15 min |

**Week 2 · PRESS-7 (demo) / Line 3 etcher (real) flagged**

Motor temp **64°C** (warn 75°C). Vibration **4.9 mm/s** (warn 4.5). Machine glows red in `factory3d.js`. Tejas drafts the work order. **Field AR** (`/ar`) rings the exact part.

Fix in a **planned 45-minute window** — not **100 days** of global allocation meetings.

---

## Chapter 4 — Chennai Cold Storage: ₹8 Crore on the Power Bill

### What happened (the real problem)

A cold-chain warehouse outside Chennai. Product band: **2–8°C**. Outside: **43°C** for weeks. Refrigeration is **45% of the electricity bill** — ₹65 lakh per month.

The compressors run hard all night. The defrost cycle fights the cooling cycle. Nobody tunes setpoints — the contractor set them in 2019 and left.

**Food spoilage** from missing cold infrastructure costs India an estimated **[₹92,651 crore (US$ 10.78 billion) every year](https://www.ibef.org/blogs/from-farms-to-fridges-how-cold-chain-infrastructure-is-transforming-india-s-agriculture)** — not a marketing number; it's the scale of harvest that never reaches a fridge. Research body **[ICRIER](https://icrier.org/pdf/Policy_Brief_20.pdf)** has documented how fragmented cold chain keeps farmer incomes and export quality underwater. Uttar Pradesh alone holds **~38% of India's cold-storage capacity**; most warehouses still run **dumb refrigeration logic** set years ago.

A room that drifts to 9°C for six hours can lose a full container of vaccine or seafood.

### What Tejas would have done

1. **Twin the facility** — compressors, evaporators, cold rooms, doors, sensors. Calibrate against historian data.

2. **Autonomous control** — Tejas holds the cold band at the **warmest safe point** — not the coldest nervous point. Compressor staging, defrost timing, fan speeds — optimised every minute.

3. **Heat-wave drill** — Operator drags weather to **47°C** (or says it aloud). Watch baseline burn power. Watch Tejas hold the band and widen the savings gap.

4. **Fleet projection** — *"Project this across 50 sites."* Tejas multiplies verified savings: annual ₹, MWh, tonnes CO₂. That is the boardroom slide that signs the contract.

5. **Savings-share pricing** — Customer pays **only from money they were not going to have**. No capex fight. No "trust us" — shadow mode proved it on their data first.

---

## Chapter 5 — How It Works: The Trust Ladder

Conservative operators will never let an unproven AI near critical cooling. Tejas is built for that reality.

```
  PHASE 0          PHASE 1           PHASE 2            PHASE 3            PHASE 4
  ─────────        ─────────         ─────────          ─────────          ─────────
  Build twin       Shadow            Advisory           Supervised         Autonomous
  Train AI in      Read-only.        AI recommends.     AI writes.         AI runs
  simulation.      Log would-do      Human applies.     Human confirms.    closed-loop.
  Zero hardware.   vs reality.       Build trust.       MoC sign-off.      Hard safety
                   Prove savings.                                            envelope +
                                                                             instant revert.
```

| Phase | Risk to customer | What they get |
|---|---|---|
| **Twin** | None | A physics model of their facility — demoable today on one laptop |
| **Shadow** | None | "Here is what we would have saved on your last 30 days" |
| **Advisory** | Low | Optimal setpoints on screen; human clicks "apply" |
| **Supervised** | Medium | AI writes setpoints; operator approves each change |
| **Autonomous** | Managed | Closed-loop control inside hard limits; instant fallback to baseline |

**Safety is not a feature. It is architecture.**

- A separate **Safety Supervisor** clamps every command outside the AI.
- Rate limits on setpoint changes — no thrashing.
- Sensor dropout or anomaly → **instant revert** to the proven baseline controller.
- Every action logged: who, what, why, what state triggered it.
- On-prem by default. Data never leaves the site. Local LLM (Ollama) for voice and chat.

The facility is **never worse off** than before Tejas.

---

## Chapter 6 — The Platform: What You Are Buying

This is not one product for one building. It is a **digital twin platform** with an AI brain that scales from a single press to a global fleet.

### The Admin Panel — your command centre

One landing page. Every twin. One click to open.

| Twin | What it models | Live capabilities |
|---|---|---|
| **🖥️ Data Center** | 24-rack AI hall, cold/hot aisles, chillers, CRACs, GPU density | Autonomous cooling, PUE optimisation, predictive maintenance, voice tour |
| **🏭 Smart Factory** | Production floor, conveyors, AGVs, workers | Live sensors, machine control, fault flagging (PRESS-7) |
| **☢️ Nuclear Plant** | Reactor, turbine hall, cooling towers | Safe-band monitoring, coolant flow, containment |
| **🌋 Geothermal Plant** | Wells, separators (SEP-2), turbine, reinjection loop | Steam/brine thermal balance, reinjection limits |
| **🔆 Solar Farm** | Tracking PV arrays, inverters | Yield optimisation, panel temperature, irradiance |

### The Data Center Twin — flagship experience

**3D hall** — racks coloured by live temperature. Airflow particles. Chiller loop. Sky shifts with weather. Faulted rack pulses red. Click any rack to inspect: inlet temp, load, airflow CFM, vibration, status.

**Autonomous control card** — policy version, steps learned, confidence score, explainable decision log. Every move has a one-sentence rationale:

> *"Heat wave (47°C): chiller COP is collapsing, so I raised chilled-water by running supply air 3°C warmer and trimmed fans 12% — holding the band while cutting 28 kW vs baseline."*

**Chat / voice console** — ask anything:

- *"What's happening right now?"*
- *"How much electricity are we using?"*
- *"Is any machine going down?"*
- *"It's a heat wave — push outside to 47."*
- *"Project savings across 50 sites."*
- *"आज सबसे गरम यूनिट कौन सी है?"* (Hindi — today's hottest unit?)

The AI answers from **live state** and **acts on the twin** — changes weather, switches control mode, reveals panels, focuses racks, projects fleet savings.

**Panels that build themselves:**

| Panel | What it shows |
|---|---|
| **Savings** | ₹/day, ₹/year, kWh, CO₂ — AI vs baseline |
| **Power** | Total facility draw, cooling power, IT load |
| **Efficiency** | PUE — Tejas vs baseline |
| **Racks** | Heat map of all 24 racks |
| **Alerts** | Cooling advisories + maintenance flags |
| **Service** | Work order + drafted email for GPU-16 |
| **Fleet** | Multiply one site's savings across N facilities |
| **Autonomy** | Live control decisions + learning metrics |
| **Single-line** | Electrical diagram: grid → transformer → UPS → PDU → GPU racks |

**Guided voice tour** — press ▶ and Tejas walks a visitor through the entire platform in three minutes. Heat wave demo. GPU-16 story. Fleet projection. No presenter required.

### Enterprise ingestion — brownfield data centers

For real facilities, drawing is not enough. The moat is the **calibrated twin**.

Six-step wizard:

1. **Connect** — BACnet, Modbus, OPC-UA, Redfish, SNMP, CDU REST, historian. Read-only.
2. **Discover** — auto-enumerate racks, CRAHs, chillers, CDUs, UPS, 8,000+ points.
3. **Layout & cooling topology** — define rows, cold aisles, liquid vs air rows, kW/rack.
4. **AI clarifies** — asks only what changes energy or safety. Assumptions ledger. Confidence gate.
5. **Calibrate** — tune against historian until sim ≈ reality (±1°C, ±8% energy).
6. **Shadow live** — twin runs read-only; logs what AI would have done vs what BMS did.

### Field AR — the technician's phone

Scan a QR. Two modes:

1. **🔧 Fix** — AR navigation to the flagged machine (GPU-16, SEP-2, PRESS-7). Lock on. See fault. Step-by-step repair. Ringed part highlighted.
2. **✨ Build** — Point camera at any machine. AI scans, draws blueprint wireframe, attaches live sensors, gives a control panel.

Desktop fix syncs to phone. Phone fix turns the rack **blue** on the laptop.

### VR walkthrough

Put on a headset (or open the browser VR view). Walk inside the data center, factory, or geothermal plant. First-person. Reticle-pick machines. Same twin, same sensors, same faults.

### The AI brain — three tiers, always on

1. **OpenAI** — richest understanding (if API key set).
2. **Ollama** — fully local, sovereign, offline.
3. **Built-in parser** — demo never dies, even with no model.

Override nothing. It picks the best available automatically.

---

## Chapter 7 — The Numbers That Close Deals

### Energy

| Metric | Baseline BMS | Tejas AI | Delta |
|---|---|---|---|
| PUE (47°C day) | ~1.50 | ~1.30 | **−13%** |
| Cooling power | Higher | 20–28% lower | **Same safety band** |
| Response to heat wave | Reactive (minutes) | Predictive (<10s) | **Leading indicators** |

### Money (single 12 MW hall, India tariff)

| | Annual |
|---|---|
| Cooling energy saved | **~₹1.8–3.2 crore** |
| Avoided downtime (1 incident) | **₹2+ crore** |
| GPU-16 fault waste eliminated | **₹8.3 lakh/yr** |
| Fleet of 50 halls | **₹90–160 crore/yr** |

### Water

Chennai-class climates: optimising tower approach and chiller staging cuts **WUE** — litres per kWh rejected. In a water-stressed city, that is not an efficiency metric. It is a **license to operate**.

### Carbon

At 0.71 kg CO₂/kWh (India grid): **hundreds of tonnes per hall per year** — auditable, IPMVP-style, tied to savings-share billing.

### Pricing

| Model | Who it fits |
|---|---|
| **Savings-share** (20–40% of verified savings) | Brownfield DCs, cold chain — zero capex objection |
| **SaaS per facility** | Predictable recurring once trust is built |
| **Twin-build engagement** | Paid on-ramp that funds the pilot and produces the ROI case |

---

## Chapter 8 — Why Now, Why India, Why the World

**The science is proven.** DeepMind cut Google's cooling ~40%. Phaidra runs NVIDIA AI factories in production. AI-run cooling is validated — not speculative.

**The giants chase hyperscalers.** Phaidra, Schneider, Vertiv — they aim at the top 50 global data centers. That leaves **thousands** of cold stores, hospitals, edge DCs, factories, and geothermal plants with nobody optimising their heat.

**India is the perfect storm.** 40–48°C summers. Expensive, stressed grid. Water scarcity. Exploding data-center and cold-chain buildout. Dumb 1990s BMS logic on 2026 infrastructure.

**But the problem is global.** A colo in Frankfurt. A food warehouse in São Paulo. A desalination plant in Dubai. A chip fab in Taiwan. Every facility that removes heat with rule-based logic is bleeding the same way — just in different currencies.

Tejas is built **local-first**: on-prem, offline, sovereign. Ollama on a laptop. Ollama on an edge box. Vernacular voice. Indian weather files. Global physics.

---

## Epilogue: The Question We Ask Every Buyer

> *"What did your building know last night that you didn't?"*

Your BMS knew the chiller was short-cycling. Your historian knew GPU-16's inlet gap had widened 0.3°C since March. Your weather feed knew Thursday would be 47°C. Your CDU knew reinjection was drifting.

The data was there. **The story wasn't.**

Tejas AI reads that story — predicts the next chapter, optimises every page, flags the machines dying in the margins, guides the technician to the exact part, and proves the savings on your numbers before it ever touches a setpoint.

```
  You don't need to own a data center to see it work.
  You don't need a PhD to operate it.
  You don't need to trust us — shadow mode proves it on your data.

  One laptop. One heat wave. One rack that was dying for fourteen months.
  One Geysers separator drifting toward reinjection failure.
  One Renesas-class fab one spark away from a global shortage.

  Tejas saw all of it.
  Before the outage.
  Before the inspection.
  Before the emergency study.

  That is what we sell.
```

---

## Appendix — Feature map + source links

| Story moment | Real-world anchor | Platform feature | Code |
|---|---|---|---|
| Chennai heat-wave stress | [2024 Indian heat wave](https://en.wikipedia.org/wiki/2024_Indian_heat_wave) · [Guardian blackouts warning](https://www.theguardian.com/world/article/2024/jun/18/india-engineers-blackouts-heatwave-north) | Weather slider + AI feed-forward control | `sim.js`, `app.js`, `twin3d.js` |
| Chennai DC corridor | [CtrlS Chennai](https://www.ctrls.com/data-centers/chennai/) | 6-step brownfield ingestion wizard | `ingest.html`, `ingest.js` |
| GPU-16 degrading 14 months | Composite (airflow restriction pattern) | Predictive maintenance + work order + email | `sim.js`, `app.js` |
| PUE 1.30 vs 1.50 | Composite savings band | Dual-controller twin (AI vs baseline) | `sim.js` `tejasControl()` |
| The Geysers reinjection | [The Geysers, CA](https://en.wikipedia.org/wiki/The_Geysers) | Geothermal plant twin + SEP-2 fault | `plants.js`, `factory3d.js`, `vr.js?type=geothermal` |
| Renesas Naka fire | [Chip shortage — fab fires](https://en.wikipedia.org/wiki/2020%E2%80%932023_global_chip_shortage#Fires_at_facilities) | Smart Factory + PRESS-7 fault | `plants.js`, `factory.js` |
| India cold-chain loss | [IBEF](https://www.ibef.org/blogs/from-farms-to-fridges-how-cold-chain-infrastructure-is-transforming-india-s-agriculture) · [ICRIER](https://icrier.org/pdf/Policy_Brief_20.pdf) | Cold-storage sensor presets in `factory.js` | `factory.js` `presetFor()` |
| Technician AR repair | — | Field AR navigate + fix + build | `ar.js`, `ar.html` |
| Phone scan → new twin | — | Video scan + server registration | `scan.js`, `server.py` |
| Talk to the building | — | Context-aware chat + voice | `server.py`, `genui.js`, `app.js` |
| Walk inside in VR | — | First-person DC / plant walkthrough | `vr.js`, `vr.html` |
| Fleet of 50 sites | — | Fleet projection panel | `app.js` `renderFleet()` |
| Safe deployment | — | Shadow → advisory → control ladder | `architect.md`, `ingestion.md` |
| Explain the platform | — | Guided voice tour | `app.js`, `tour.js` |
| Build any facility | — | Twin Studio drag/prompt | `builder.js`, `builder.html` |
| Glass console view | — | Analytics · Configurator · Simulations | `twinpro.html` |

---

*Tejas AI — the autonomous brain for cooling and energy. Built in India. Ready for the world.*

*Run it today: `cd tejas-twin && ./run.sh` → https://localhost:7878*