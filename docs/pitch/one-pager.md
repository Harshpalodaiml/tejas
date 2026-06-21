# TEJAS AI — One Pager

**The autonomous brain for cooling & energy** · तेजस् — radiance, sharpness · Built in India

---

## The problem

- **30–40%** of data-center power is cooling. Cold storage, hospitals, factories: similar or worse.
- Almost all run on **1990s rule-based BMS logic** — react after heat builds, over-cool "to be safe."
- **India:** 40–48°C summers, stressed grid, water scarcity, DC + cold-chain boom — **nobody optimises the mid-market.**

## The solution

**Tejas AI** replaces dumb thermostats with a self-learning agent that **predicts, optimises, explains, and acts** — on a **calibrated digital twin** before it ever touches your hardware.

| Capability | Outcome |
|---|---|
| Predict heat waves & load spikes | Act in <10s, not after trip |
| Optimise setpoints continuously | **20–28%** less cooling energy, same safety band |
| Predictive maintenance | Flag GPU-16-class faults months early |
| Voice + vernacular | Operator asks; dashboard builds itself |
| Field AR | Technician navigates to exact part |

## Proof anchors (real world)

| Vertical | Anchor |
|---|---|
| Data center | [Chennai DC corridor](https://www.ctrls.com/data-centers/chennai/) + [2024 heat wave](https://en.wikipedia.org/wiki/2024_Indian_heat_wave) |
| Geothermal | [The Geysers, CA](https://en.wikipedia.org/wiki/The_Geysers) — reinjection |
| Factory | [Renesas Naka fire 2021](https://en.wikipedia.org/wiki/2020%E2%80%932023_global_chip_shortage#Fires_at_facilities) |
| Cold chain | [₹92,651 Cr annual loss](https://www.ibef.org/blogs/from-farms-to-fridges-how-cold-chain-infrastructure-is-transforming-india-s-agriculture) |

## Deploy safely

```
Twin → Shadow (read-only) → Advisory → Supervised → Autonomous
```

On-prem. Ollama local LLM. Safety Supervisor. Instant revert to baseline.

## ROI (12 MW hall, India)

| | Annual |
|---|---|
| Cooling energy saved | ₹1.8–3.2 Cr |
| One avoided outage | ₹2+ Cr |
| 50-site fleet | ₹90–160 Cr |

*Shadow pilot validates on your historian and tariff.*

## Business model

**Savings-share (primary)** · SaaS per site · Twin-build engagement

## vs competition

| | Phaidra / hyperscaler AI | Tejas |
|---|---|---|
| Target | NVIDIA-scale factories | Cold chain, edge DCs, factories |
| Deploy | Cloud / premium | **On-prem, sovereign** |
| Pricing | Enterprise licence | **Savings-share** |

## Live demo (today)

```bash
cd tejas-twin && ./run.sh
```

→ https://localhost:7878 — 3D data center, autonomous cooling, GPU-16 maintenance, fleet projection, AR/VR

## Next step

**30-day shadow pilot** — read-only on your BMS/historian. Savings report on your data. Zero rip-and-replace.

---

**Contact:** [Name] · [email] · [phone] · [calendar link]

*What did your building know last night that you didn't?*