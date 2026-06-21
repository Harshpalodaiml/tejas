# Tejas AI — The Story

> *What if the machine told you it was dying — weeks before it took your facility down?*

Every scene maps to the **running demo** — not slides. `cd tejas-twin && ./run.sh`

**Demo:** [Video](https://accuconsult-my.sharepoint.com/:v:/g/personal/harsh_zenalyst_ai/IQCCDlXCZ5lwR5V-T7A_N7cMAT15xtCeoMB5dCppqR4f2d8?e=lg9S4D)

---

## Real-world anchors

| Chapter | Anchor | Tejas maps to |
|---|---|---|
| **Data center** | [Chennai DC corridor](https://www.ctrls.com/data-centers/chennai/) + [2024 heat wave](https://en.wikipedia.org/wiki/2024_Indian_heat_wave) | 47°C demo · PUE gap · GPU-16 |
| **Geothermal** | [The Geysers](https://en.wikipedia.org/wiki/The_Geysers) reinjection | SEP-2 separator drift in VR |
| **Factory** | [Renesas Naka 2021](https://en.wikipedia.org/wiki/2020%E2%80%932023_global_chip_shortage#Fires_at_facilities) | PRESS-7 vibration warning |
| **Cold chain** | [₹92,651 Cr spoilage](https://www.ibef.org/blogs/from-farms-to-fridges-how-cold-chain-infrastructure-is-transforming-india-s-agriculture) | Band-holding at warmest safe point |

*GPU-16, SEP-2, PRESS-7 are named characters in the twin — composite scenarios, not one specific incident.*

---

## Chapter 1 — Chennai, 2:14 AM (data center)

312 racks. Mixed air + liquid. Ambient **42°C+** for weeks — chiller COP collapses, recirculation worsens, one rack (**GPU-16**) has been drifting **+3.4°C** for 14 months (clogged filter + fan bearing).

**Baseline BMS:** reacts late, over-cools, burns power.  
**Tejas:** predicted the spike, warmed supply to protect COP, flagged GPU-16 with parts list + drafted email to R. Kumar.

**In the demo:** `/datacenter` → 47°C → *"is any machine going down?"* → red pulse → service panel.

---

## Chapter 2 — The Geysers (geothermal)

Separator **SEP-2** drifts — reinjection temperature creeps. Slow field death, not one alarm.

**In the demo:** `/vr?type=geothermal` → reticle on SEP-2.

---

## Chapter 3 — Naka lesson (factory)

One undetected press fault → **100+ days** lost production globally.

**In the demo:** **PRESS-7** motor temp + vibration in factory twin.

---

## Chapter 4 — Cold chain (India)

Refrigeration = **15–25%** of warehouse cost. Operators over-cool "to be safe."

**Tejas:** hold 2–8°C at the **warmest safe point** — same safety, less ₹.

---

## Demo → story mapping

| Story beat | Demo action |
|---|---|
| Heat wave | Weather slider 47°C |
| AI beats baseline | PUE 1.3 vs 1.5 |
| Invisible fault | GPU-16 chat query |
| Technician knows what to bring | Work order + AR fix |
| Scale the win | Fleet projection panel |
| Operator never touched mouse | Voice `T` key |

---

## Closing line

> *"Your building already knows. Tejas makes it speak — in the operator's language, on your machine, before the bill and before the trip."*

---

*Pitch kit: [`pitch/`](./pitch/) · Product: [`PRODUCT.md`](./PRODUCT.md)*