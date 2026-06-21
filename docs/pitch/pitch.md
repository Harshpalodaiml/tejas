# Tejas AI — Complete Pitch Kit

> **Everything you need to sell, demo, fundraise, and close.**  
> Companion docs: [`story.md`](../story.md) (narrative) · [`project.md`](../project.md) (strategy) · [`demo.md`](../demo.md) (two-screen demo) · **Slide deck:** [`Tejas-AI-Pitch-Deck.pptx`](./Tejas-AI-Pitch-Deck.pptx)

---

## 0. Before you open your mouth

| Asset | Where | When to use |
|---|---|---|
| **Slide deck** | `pitch/Tejas-AI-Pitch-Deck.pptx` | Investor meeting, board intro, conference |
| **One-pager** | `pitch/one-pager.md` | Email attachment, WhatsApp, leave-behind |
| **Live demo** | `cd tejas-twin && ./run.sh` → https://localhost:7878 | Every serious meeting — show, don't tell |
| **Story** | `story.md` | Deep-dive with technical buyers, case-study framing |
| **Recorded backup** | Record a perfect 3-min screen capture | Room fights you, bad Wi-Fi, async follow-up |

**Golden rule:** Lead with the **live demo** or a **recorded clip**. The deck supports the demo; it does not replace it.

---

## 1. One line (memorise this)

> **Tejas AI is a self-learning agent that runs a facility's cooling at peak efficiency — cutting energy 20–40% — trained safely on a digital twin, deployed without ripping out hardware, and operated by talking to it.**

**Name:** Tejas (तेजस्) — radiance, sharpness. India's indigenous fighter jet. Built to tame heat.

---

## 2. Elevator pitches

> **★ Product definition (every feature):** [`../PRODUCT.md`](../PRODUCT.md)  
> **★ Best 60-second pitch (30·40·30 + live wow):** [`60-second-elevated-pitch.md`](./60-second-elevated-pitch.md)

### 10 seconds
> "We put an AI brain on top of your existing cooling system. It predicts heat waves, cuts cooling energy 20–40%, and your operator just talks to it — no dashboard training."

### 30 seconds (investor)
> "Cooling is 30–40% of a data center's power bill, and almost all of it runs on 1990s rule-based logic. DeepMind and Phaidra proved AI can do better — but they only serve hyperscalers. Tejas is the on-prem, sovereign cooling brain for everyone else: cold chain, mid-size DCs, factories. We prove savings on a digital twin first, then shadow your real plant read-only for 30 days. Zero capex objection — we take a share of verified savings."

### 30 seconds (customer / facility owner)
> "Your BMS reacts after heat builds. Tejas predicts it — weather, load, thermal drift — and optimises every minute inside your safety band. We connect read-only to what you already have. No rip-and-replace. Month one: shadow mode shows what we would have saved on your actual data. Month two: you decide if you want us to advise or run it. You only pay from money you weren't going to have."

### 2 minutes (full hook — use after demo)
> "Last summer, India's longest heat wave on record had engineers warning of grid blackouts as AC load spiked. In Chennai's data-center corridor, cooling towers were at the edge of their envelope — same physics as a hall trip: ambient up, chiller COP down, margin gone.
>
> The cruel part: every predictive signal was already in the building. BMS trends. Historian data. Weather forecasts. Nobody was reading it as a story.
>
> Tejas reads that story. We build a calibrated digital twin of your facility — racks, chillers, cold rooms, separators — tune it against your historian until simulation matches reality. Then we train the AI in simulation, deploy in shadow mode, and climb a trust ladder: watch → advise → control. The operator asks in English, Hindi, or Tamil: *'What happens if Thursday hits 47 degrees?'* — and gets numbers, not shrugs.
>
> On a 47°C day we hold the same safety band at PUE ~1.30 vs baseline ~1.50. GPU-16-style predictive maintenance flags a degrading rack fourteen months before inspection. Field AR guides the technician to the exact part.
>
> Everything you just saw runs on one laptop, offline. The twin is the method — not a fake. That's how we sell to conservative operators who will never let an unproven AI near critical cooling without proof first."

---

## 3. The opening question (use on slide 1 or as your first words)

> **"What did your building know last night that you didn't?"**

Pause. Let it land. Then:

> "Your BMS knew the chiller was short-cycling. Your historian knew inlet temps were drifting. Your weather feed knew Thursday would be 47°C. The data was there. **The story wasn't.**"

---

## 4. Investor pitch — 12-minute structure

| Min | Section | You say | Show |
|---|---|---|---|
| 0:00 | **Hook** | Opening question + Chennai heat-wave context | Slide 2–3 or jump straight to demo |
| 1:00 | **Problem** | 30–40% of DC power is cooling; dumb BMS; India 40–48°C; Phaidra ignores mid-market | Problem slides |
| 2:30 | **Live demo** | 90-second datacenter tour (see §8) | `/datacenter` — weather to 47°C, GPU-16, fleet |
| 4:00 | **Solution** | Predict + optimise + explain + act; twin-first; trust ladder | Trust ladder slide |
| 5:00 | **Product** | Platform: DC, factory, geothermal, cold chain, AR, VR, ingestion | Admin panel quick tour |
| 6:30 | **Traction / proof** | Simulation validated; real anchors (Chennai, Geysers, Renesas); pilot-ready ingestion wizard | story.md anchors |
| 7:30 | **Market** | India cold chain + DC boom + buildings; global extension | Market slide |
| 8:30 | **Business model** | Savings-share primary; SaaS; twin-build engagement | Pricing slide |
| 9:30 | **Moat** | Calibrated twin + safe control policy + per-site operational data; on-prem sovereign | Competition slide |
| 10:30 | **GTM** | Demo wedge → shadow pilot → savings-share → partnerships (BEE, ESCOs, cold-chain assoc.) | GTM slide |
| 11:30 | **The ask** | [Fill in: round size, use of funds, milestones] | Ask slide |
| 12:00 | **Close** | "We sell rupees off the power bill — for everyone the giants ignore." | Title slide |

**Honest framing (say it — builds trust):**
> "The demo is validated in simulation on real Indian weather. The pilot proves it on your facility: read-only shadow for 30 days, savings on your data, before we ever touch a setpoint."

---

## 5. Customer pitch — 20-minute structure

| Min | Section | Goal |
|---|---|---|
| 0:00 | **Their pain** | Ask: "What was your worst cooling incident / power bill surprise last summer?" Listen. |
| 3:00 | **Mirror** | Reflect their answer with Chennai / cold-chain / fab story from `story.md` |
| 5:00 | **Demo** | Full 3-minute script (§8) tailored to their vertical |
| 8:00 | **How we'd deploy here** | Shadow → advisory → control; BACnet/Modbus/Redfish; no rip-and-replace |
| 12:00 | **ROI** | Their numbers: MW, tariff, cooling %, downtime cost → §9 calculator |
| 15:00 | **Pilot proposal** | 30-day shadow, deliverables, success criteria (§11) |
| 18:00 | **Pricing** | Savings-share: "You pay only from money you weren't going to have" |
| 20:00 | **Next step** | Calendar hold for site walk + historian export checklist |

**Discovery questions (write answers on the call):**
1. Facility type? MW / tons cooling? Air vs liquid?
2. BMS vendor? Historian? Last calibration?
3. Biggest pain: energy bill, downtime, water, staffing, SLA?
4. Who signs? Who operates daily?
5. Any incident in last 24 months? Cost?
6. Current PUE or refrigeration kWh/ton if known?

---

## 6. Real-world anchors (credibility — with links)

Use these to ground the story. Demo characters (GPU-16, SEP-2, PRESS-7) are **composites**, not claims about one specific incident.

| Vertical | Real anchor | Link |
|---|---|---|
| **Data center** | Chennai OMR/Siruseri corridor; CtrlS Tier-IV | [CtrlS Chennai](https://www.ctrls.com/data-centers/chennai/) |
| **Heat stress** | 2024 Indian heat wave — longest on record | [Wikipedia](https://en.wikipedia.org/wiki/2024_Indian_heat_wave) · [Guardian](https://www.theguardian.com/world/article/2024/jun/18/india-engineers-blackouts-heatwave-north) |
| **Geothermal** | The Geysers, CA — reinjection after steam depletion | [Wikipedia](https://en.wikipedia.org/wiki/The_Geysers) |
| **Factory** | Renesas Naka fab fire, Mar 2021 | [Chip shortage](https://en.wikipedia.org/wiki/2020%E2%80%932023_global_chip_shortage#Fires_at_facilities) |
| **Cold chain** | ₹92,651 crore annual post-harvest loss | [IBEF](https://www.ibef.org/blogs/from-farms-to-fridges-how-cold-chain-infrastructure-is-transforming-india-s-agriculture) · [ICRIER](https://icrier.org/pdf/Policy_Brief_20.pdf) |

---

## 7. Competitive positioning

| vs | Their weakness | Tejas answer |
|---|---|---|
| **Status quo BMS** | Reacts; static rules; no story | Predicts; learns; explains every action |
| **Phaidra / foreign AI** | Hyperscaler-only; cloud; premium | Mid-market; on-prem; savings-share; India-tuned |
| **Schneider / Vertiv** | Hardware + dashboards | AI control layer on top — no rip-and-replace |
| **Build in-house** | No twin infra, no ML ops | Off-the-shelf brain; shadow proof in 30 days |
| **ESCO / audit-only** | Report, no closed loop | Twin + autonomous control + AR field execution |

**Moat (what they cannot copy in a quarter):**
1. Calibrated digital twin per facility (topology, not asset count)
2. Safe control policy + Safety Supervisor architecture
3. Proprietary operational data accumulated per site
4. Vernacular voice + on-prem sovereign stack

---

## 8. Demo scripts

### 8A. Flagship — 90 seconds (investor / judge)

**Prep:** `cd tejas-twin && ./run.sh` → https://localhost:7878 → Admin → **Data Center**

| Step | Action | Say |
|---|---|---|
| 1 | Point at **Autonomous Control** card | "It's already running. Policy version, confidence, live PUE **1.3 vs 1.5** baseline." |
| 2 | Drag **Weather → 47°C** (or type in chat) | "Heat wave. Sky goes red. Baseline panics. Tejas holds the band and widens savings." |
| 3 | Chat: *"How much electricity are we using?"* | "Answers from live state — not a script." |
| 4 | Chat: *"Is any machine going down?"* | "GPU-16 — degrading 14 months. Root cause, parts list, drafted service email. Rack pulses red in 3D." |
| 5 | Chat: *"Project savings across 50 sites."* | "Fleet panel — boardroom slide that signs the contract." |
| 6 | Close | "One laptop. Offline. Twin is how we prove before we touch your hardware." |

### 8B. Full — 3 minutes (customer)

| # | Say (voice or chat) | What happens |
|---|---|---|
| 1 | *"Show me Chennai data center, AI versus baseline."* | Comparison view; sim running |
| 2 | *"How much are we saving right now?"* | Savings panel: ₹/day, kWh, CO₂ |
| 3 | *"Heat wave — push outside to 47 degrees."* | Baseline power climbs; AI adapts; gap widens |
| 4 | *"Are we still safe?"* | Racks in band; "same safety, less power" |
| 5 | *"Is any machine going down?"* | GPU-16 story + service email |
| 6 | *"Project across 50 sites."* | Fleet projection |
| 7 | *(Hindi)* *"आज सबसे गरम यूनिट कौन सी है?"* | Vernacular works |
| 8 | Open **Field AR** on phone (optional) | QR → navigate to GPU-16 → fix steps |
| 9 | Close | Shadow-mode pilot on their data — zero risk |

### 8C. Vertical shortcuts

| Vertical | Route | Hero moment |
|---|---|---|
| **Brownfield DC** | `/ingest` | 6-step wizard: connect → discover → calibrate → shadow |
| **Factory** | `/factory` or `/scan` | Phone scan → twin in 10 min; PRESS-7 fault |
| **Geothermal** | `/vr?type=geothermal` | Walk to SEP-2; reinjection story |
| **Cold chain** | Weather + savings on factory preset | 2–8°C band hold at 47°C ambient |
| **VR wow** | `/vr` | First-person hall walk; reticle-pick GPU-16 |

### 8D. Failure-proofing

- Voice fails → **type the same commands** in chat (built-in parser always works)
- Pre-warm sim before the meeting
- Rehearse exact phrases in §8B
- Keep recorded backup clip ready
- `TEJAS_HTTP=1` only if HTTPS cert blocks you (camera AR needs HTTPS)

---

## 9. ROI talk track (fill on the call)

**Single 12 MW hall, India industrial tariff (~₹8–12/kWh blended):**

| Line item | Conservative | Aggressive |
|---|---|---|
| Cooling energy saved (20–28%) | ₹1.8 crore/yr | ₹3.2 crore/yr |
| One avoided outage | ₹2+ crore | ₹5+ crore |
| One predictive fix (GPU-16 class) | ₹8.3 lakh/yr waste eliminated | — |
| **Fleet of 50 halls** | **₹90 crore/yr** | **₹160 crore/yr** |

**Cold storage (₹65 lakh/month refrigeration bill):**
- 15–25% optimisation → **₹12–20 lakh/month** → **₹1.4–2.4 crore/year**
- Spoilage reduction is upside on top (national scale: [IBEF](https://www.ibef.org/blogs/from-farms-to-fridges-how-cold-chain-infrastructure-is-transforming-india-s-agriculture))

**Water (Chennai-class):** Lower WUE = licence to operate, not just efficiency.

**Carbon:** ~0.71 kg CO₂/kWh India grid → hundreds of tonnes/hall/year — auditable for ESG.

**Say:** "We'll give you a number on *your* historian in shadow mode — these are the class of outcomes we see in simulation."

---

## 10. Trust ladder (deployment — draw this live)

```
PHASE 0          PHASE 1           PHASE 2            PHASE 3            PHASE 4
─────────        ─────────         ─────────          ─────────          ─────────
Build twin       Shadow            Advisory           Supervised         Autonomous
Train in sim.    Read-only.        AI recommends.     AI writes.         AI runs
Zero hardware.   Log would-do      Human applies.     Human confirms.    closed-loop.
                 vs reality.       Build trust.       MoC sign-off.      Hard limits +
                                                                      instant revert.
```

| Phase | Customer risk | Deliverable |
|---|---|---|
| Twin | None | Physics model — demoable today |
| Shadow | None | "What we would have saved — last 30 days" |
| Advisory | Low | Optimal setpoints on screen |
| Supervised | Medium | AI writes; human approves each change |
| Autonomous | Managed | Closed-loop inside envelope; revert to baseline on anomaly |

---

## 11. Pilot proposal template (copy-paste to PDF/email)

**Tejas AI — 30-Day Shadow Pilot**

**Scope:** [Facility name], [city] — [DC / cold chain / plant type]

**Week 1 — Connect (read-only)**
- BACnet / Modbus / OPC-UA / Redfish / SNMP / historian export
- No write access to BMS
- Asset discovery + topology map

**Week 2–3 — Calibrate twin**
- Tune simulation vs measured temps (target ±1°C) and energy (±8%)
- Assumptions ledger + confidence gate

**Week 4 — Shadow report**
- AI vs baseline: kWh, ₹, PUE, peak demand
- Identified anomalies (e.g. airflow drift, short-cycling)
- Recommended actions (not executed without approval)

**Success criteria:**
- [ ] Credible savings range on customer's actual tariff
- [ ] At least one predictive maintenance flag validated by facilities team
- [ ] Customer sign-off to proceed to advisory phase

**Commercials:** Pilot fee ₹[X] credited toward first year **OR** pure savings-share after advisory phase — customer choice.

**Data:** On-prem only. No cloud egress. NDA standard.

---

## 12. Objection handling

| Objection | Response |
|---|---|
| **"We already have a BMS."** | "Perfect — we sit on top. We send better setpoints to hardware you already own. Month one is read-only." |
| **"AI can't touch critical cooling."** | "Agreed. That's why we shadow first, then advise, then control — with a Safety Supervisor and instant revert to your proven baseline." |
| **"Show me real savings, not a demo."** | "The demo proves the logic. The pilot proves your numbers. 30 days read-only on your historian — zero risk." |
| **"Phaidra already does this."** | "For NVIDIA-scale AI factories. Who optimises your cold stores and mid-size colos? We're on-prem, India-tuned, savings-share." |
| **"Too expensive."** | "Savings-share: you pay only from verified savings. If we don't save, you don't pay." |
| **"Our team won't use another dashboard."** | "They talk to it. Hindi, Tamil, English. 'How much did we save today?' — no training." |
| **"What if the AI breaks something?"** | "Rate limits, hard safety envelope, sensor dropout → instant baseline. Every action logged. Facility is never worse off than before Tejas." |
| **"We need integration with [vendor]."** | "BACnet, Modbus, OPC-UA, Redfish, SNMP — we ingest in the wizard. Show us your point list." |
| **"Data sovereignty?"** | "On-prem by default. Ollama local LLM. Data never leaves the site." |

---

## 13. Email templates

### 13A. Cold outreach — data center operator

**Subject:** Chennai heat wave + your chiller short-cycle data

Hi [Name],

India's 2024 heat wave was the longest on record — and facilities in the Chennai corridor are running cooling at the edge of their envelope ([context](https://en.wikipedia.org/wiki/2024_Indian_heat_wave)).

Most halls already have the signals in the BMS: short-cycling chillers, drifting inlet temps, rising WUE. Nobody reads it as a story.

**Tejas AI** is an on-prem cooling brain that:
- Predicts heat waves and load spikes on a calibrated digital twin
- Cuts cooling energy **20–28%** inside your existing safety band
- Starts **read-only shadow mode** — no rip-and-replace

I'd like 20 minutes to show you a live demo on one laptop — then discuss a 30-day shadow pilot on your historian.

[Calendar link]

Best,  
[Name]

### 13B. Cold outreach — cold chain

**Subject:** ₹65L/month refrigeration — what's your 47°C day plan?

Hi [Name],

Refrigeration is often 45% of a cold-storage electricity bill. India's post-harvest loss from missing cold infrastructure is estimated at **[₹92,651 crore/year](https://www.ibef.org/blogs/from-farms-to-fridges-how-cold-chain-infrastructure-is-transforming-india-s-agriculture)** — the room that drifts to 9°C for six hours loses the container.

Tejas AI holds your product band at the **warmest safe point** — not the coldest nervous point — and proves savings in shadow mode before touching setpoints.

Worth a 15-minute demo?

[Calendar link]

### 13C. Post-demo follow-up

**Subject:** Tejas demo + shadow pilot next steps

Hi [Name],

Thanks for your time today. As discussed:

1. **What you saw:** autonomous cooling at 47°C, PUE 1.3 vs 1.5, GPU-16 predictive maintenance, fleet projection
2. **What we'd do on your site:** 30-day read-only shadow on [BMS/historian] — savings report on your tariff
3. **Commercials:** savings-share option — pay only from verified savings

Attached: one-pager + pilot scope.

Can we schedule a 45-minute technical call with your facilities lead and historian export?

Best,  
[Name]

### 13D. Investor follow-up

**Subject:** Tejas AI — demo recording + deck

Hi [Name],

Following our conversation: Tejas is the on-prem cooling brain for the mid-market Phaidra ignores — cold chain, edge DCs, factories — proven twin-first, deployed shadow→control.

**Attached:** pitch deck, one-pager  
**Demo:** [link to recording] or live at your office (one laptop, offline)

**Round:** [Raising ₹X pre-seed/seed] for [pilots / twin engine / GTM]

Happy to dive deeper on the calibrated-twin moat and savings-share unit economics.

Best,  
[Name]

---

## 14. Pricing & packaging

| Model | Who | Pitch line |
|---|---|---|
| **Savings-share (20–40%)** | Brownfield DC, cold chain | "Pay only from money you weren't going to have" |
| **SaaS per facility** | Multi-site chains post-trust | Predictable recurring |
| **Twin-build engagement** | First site in a new logo | Paid on-ramp; funds calibration; produces ROI case |
| **Pilot fee → credit** | Risk-averse enterprise | De-risks procurement; credits to Y1 |

**Land-and-expand:** One hall → whole campus → fleet panel in product is the commercial vision.

---

## 15. Go-to-market sequence

1. **Clip the demo** — 30–60 sec heat-wave moment; post LinkedIn / X / YouTube Shorts
2. **Target list** — Chennai DC operators, cold-chain assoc., hospital estates, food logistics
3. **Shadow pilots** — 3–5 logos; publish anonymised case studies
4. **Partnerships** — BEE, ESCOs, CtrlS-class operators, integrators
5. **Content** — "What your BMS knew last night" blog series; open benchmark methodology

---

## 16. The ask (investor slide — customise)

**Raising:** ₹[X] [pre-seed / seed]

**Use of funds:**
- 40% — Pilot deployments + calibration engineering
- 30% — Twin engine + control policy hardening
- 20% — GTM (demo tour, content, partnerships)
- 10% — Legal, compliance, IP

**12-month milestones:**
- [ ] 5 shadow pilots completed with documented savings ranges
- [ ] 2 paid advisory/control contracts
- [ ] Ingestion wizard production-hardened for BACnet + Redfish
- [ ] ₹[X] ARR or savings-share revenue

---

## 17. Closing lines (pick one)

**Customer:**  
> "Let's shadow your facility for 30 days. Read-only. Your data. Your numbers. Then you decide."

**Investor:**  
> "The giants proved AI-run cooling works. We're bringing it to everyone they ignore — on-prem, in India, starting with a demo you can run on this laptop tonight."

**Universal:**  
> "We don't sell a dashboard. We sell rupees off the power bill — and we prove it before we touch a setpoint."

---

## 18. Checklist — day of the meeting

- [ ] Laptop charged; `tejas-twin/run.sh` tested same day
- [ ] HTTPS cert accepted (or LAN IP for phone AR)
- [ ] OpenAI key or Ollama running (optional; built-in parser as fallback)
- [ ] Deck on USB + cloud
- [ ] One-pager printed or PDF ready
- [ ] Recorded backup clip
- [ ] Discovery questions printed
- [ ] Pilot proposal template with their facility name filled in
- [ ] Calendar link for follow-up open

---

*Tejas AI — the autonomous brain for cooling and energy. Built in India. Ready for the world.*

*Run the demo: `cd tejas-twin && ./run.sh` → https://localhost:7878*