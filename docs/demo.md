# Tejas AI — Demo Script

Present on **one laptop**, fully offline-capable. No data center required.

**Run:** `cd tejas-twin && ./run.sh` → https://localhost:7878  
**Video reference:** [SharePoint walkthrough](https://accuconsult-my.sharepoint.com/:v:/g/personal/harsh_zenalyst_ai/IQCCDlXCZ5lwR5V-T7A_N7cMAT15xtCeoMB5dCppqR4f2d8?e=lg9S4D)

---

## Two-screen story (ideal)

| Screen A — Twin | Screen B — Tejas |
|---|---|
| 3D hall, weather, PUE live | Voice/chat builds panels |
| Baseline vs AI energy bars | Savings ₹ climbs as you speak |

**Whoa moment:** you talk on B; A responds in real time.

Single-screen works too: `/datacenter` has twin + chat side by side.

---

## 90-second script

| # | Say / do | What happens |
|---|---|---|
| 1 | Open `/datacenter` — point at Autonomous card | PUE ~1.3 vs ~1.5, policy live |
| 2 | Weather → **47°C** or *"heat wave push to 47"* | Baseline panics; AI holds savings |
| 3 | *"How much electricity?"* | Answers from live state |
| 4 | *"Is any machine going down?"* | **GPU-16** red pulse, work order + email |
| 5 | *"Project across 50 sites"* | Fleet savings panel |
| 6 | Press **`T`** or tap 🧠 — vernacular OK | Voice works offline |

**Close:** *"All of this ran on this laptop. The twin is physics-accurate — exactly how we prove the AI before touching a real site."*

---

## Honest framing (builds trust)

> *"This is validated in simulation on Indian weather. The pilot connects read-only, shadows your BMS 30 days, and shows savings on **your** data before we take control."*

---

## Phone extras (optional wow)

- **AR** (`/ar`) — QR from datacenter → fix GPU-16 checklist  
- **VR** (`/vr`) — walk the hall, ask AI about a rack  

---

## Checklist before presenting

- [ ] `./run.sh` running, `/datacenter` loads  
- [ ] Weather slider works; GPU-16 visible on ask  
- [ ] Phone on same Wi-Fi if showing AR (HTTPS cert accepted)  
- [ ] `OPENAI_API_KEY` or Ollama or offline parser — chat never dead  

---

*Full app guide: [`../tejas-twin/README.md`](../tejas-twin/README.md) · Strategy: [`project.md`](./project.md)*