# Tejas AI — Complete User Flow

End-to-end flow from launch to every feature. **Ingestion excluded.**  
Use these diagrams in Mermaid Live Editor, draw.io, or any flow-chart tool.

**Run:** `cd tejas-twin && ./run.sh` → https://localhost:7878

---

## 1. Master flow (top → bottom)

Copy this for your main flow-chart:

```mermaid
flowchart TB
    START(["🚀 START<br/>./run.sh → localhost:7878"])

    START --> ADMIN["🏠 ADMIN PANEL<br/>/"]

    ADMIN --> FILTER["Filter twins<br/>All · Data Centers · Factories · Plants"]
    ADMIN --> HERO_VR["🥽 Walk in VR<br/>/vr"]
    ADMIN --> CREATE["＋ Create new twin"]

    ADMIN --> DC_CARD["Click: Chennai AI Data Center"]
    ADMIN --> FAC_CARD["Click: Smart Factory"]
    ADMIN --> PLANT_CARD["Click: Nuclear · Geothermal · Solar"]
    ADMIN --> USER_CARD["Click: User-created twin<br/>from scan / blueprint / studio"]

    DC_CARD --> DATACENTER["🖥️ DATA CENTER TWIN<br/>/datacenter"]
    FAC_CARD --> FACTORY["🏭 FACTORY / PLANT TWIN<br/>/factory"]
    PLANT_CARD --> FACTORY
    USER_CARD --> FACTORY

    CREATE --> C_SCAN["📷 Scan with phone"]
    CREATE --> C_BP["🖼️ Upload blueprint"]
    CREATE --> C_STUDIO["✏️ Twin Studio"]

    C_SCAN --> SCAN_PHONE["Phone: /scan<br/>9s video → AI reconstruct"]
    SCAN_PHONE --> API_TWIN["POST /api/twins"]
    API_TWIN --> ADMIN

    C_BP --> BP_BUILD["AI reads image<br/>Build twin"]
    BP_BUILD --> API_TWIN

    C_STUDIO --> BUILD["Twin Studio /build"]
    BUILD --> API_TWIN

    DATACENTER --> DC_FEATURES
    FACTORY --> FAC_FEATURES
    HERO_VR --> VR
    DATACENTER --> AR
    DATACENTER --> VR
    FACTORY --> AR
    FACTORY --> VR

    subgraph DC_FEATURES["Data Center — feature boxes"]
        direction TB
        D3D["3D Hall<br/>racks glow by temp"]
        D_ENV["Environment<br/>Weather · Load sliders"]
        D_MODE["Control mode<br/>Tejas AI ↔ Baseline"]
        D_AUTO["Autonomous card<br/>policy · confidence"]
        D_CHAT["Tejas Assistant<br/>chat + voice T"]
        D_PANELS["Gen-UI panels<br/>savings · power · PUE…"]
        D_RACK["Click rack"]
        D_TOUR["▶ Guided tour"]
        D_ARQR["📱 AR QR"]
        D_VRQR["🥽 VR QR"]
    end

    subgraph FAC_FEATURES["Factory / Plant — feature boxes"]
        direction TB
        F3D["3D scene<br/>machines animate"]
        F_SENS["Live sensors"]
        F_CTRL["Power · speed controls"]
        F_CHAT["Chat brain"]
        F_VR["VR walk link"]
        F_AR["Field AR link"]
    end

    subgraph AR["Field AR /ar"]
        direction TB
        AR_CHOICE{"Choose mode"}
        AR_FIX["🔧 Fix GPU-16<br/>navigate → lock → 4-step fix"]
        AR_BUILD["✨ Build from camera<br/>vision → blueprint overlay"]
    end

    subgraph VR["VR Walkthrough /vr"]
        direction TB
        VR_WALK["Joystick walk<br/>gyro look"]
        VR_PICK["Reticle pick rack"]
        VR_INFO["Inspect card<br/>temp · load · status"]
        VR_AI["💬 Ask Tejas<br/>push-to-talk T"]
    end

    D_RACK --> INSP["Inspector panel"]
    INSP --> DETAIL["Full inspect screen<br/>tabs · fix · chat dock"]
    DETAIL --> REDBLUE["Move & Correct<br/>red → blue"]

    D_CHAT --> BRAIN["POST /api/chat"]
    D_TOUR --> BRAIN
    VR_AI --> BRAIN
    BRAIN --> ACTIONS["Actions on twin<br/>weather · load · panels · focus rack"]
```

---

## 2. Entry → Admin (level 1)

```mermaid
flowchart TD
    A(["User opens browser"]) --> B["https://localhost:7878"]
    B --> C["server.py serves admin.html"]
    C --> D["🏠 ADMIN PANEL /"]

    D --> E1["See built-in twins"]
    D --> E2["See twins from /api/twins<br/>phone scan · blueprint · studio"]
    D --> E3["Filter: All | DC | Factory | Plants"]
    D --> E4["Brain status pill<br/>OpenAI · Ollama · local"]

    E1 --> F1["🖥️ Chennai Data Center → /datacenter"]
    E1 --> F2["🏭 Smart Factory → /factory"]
    E1 --> F3["☢️ Nuclear → /factory?type=nuclear"]
    E1 --> F4["🌋 Geothermal → /factory?type=geothermal"]
    E1 --> F5["🔆 Solar → /factory?type=solar"]

    D --> G["＋ Create new twin"]
    G --> G1["📷 Phone scan"]
    G --> G2["🖼️ Blueprint"]
    G --> G3["✏️ Twin Studio → /build"]

    D --> H["🥽 VR hero link → /vr"]
```

---

## 3. Create new twin (no ingestion)

```mermaid
flowchart LR
    subgraph Admin
        C["＋ Create"]
    end

    subgraph Method1["📷 Phone Scan"]
        C --> QR["Show QR code"]
        QR --> PH["Phone opens /scan"]
        PH --> REC["Record 9s walk-around"]
        REC --> RECON["AI reconstruct animation"]
        RECON --> POST1["POST /api/twins"]
    end

    subgraph Method2["🖼️ Blueprint"]
        C --> DROP["Drop blueprint image"]
        DROP --> AI_READ["AI extracts layout"]
        AI_READ --> POST2["POST /api/twins"]
    end

    subgraph Method3["✏️ Twin Studio"]
        C --> STU["/build"]
        STU --> DRAG["Drag components OR AI prompt"]
        DRAG --> ACT["⚡ Activate"]
        ACT --> POST3["POST /api/twins"]
    end

    POST1 --> CARD["New card on Admin<br/>poll every 5s"]
    POST2 --> CARD
    POST3 --> CARD
    CARD --> OPEN["Open → /factory?id=…"]
```

---

## 4. Data Center twin — complete feature flow

**This is the flagship path.** Everything connects from `/datacenter`.

```mermaid
flowchart TB
    ENTER(["Open /datacenter"])

    ENTER --> LOOP["Live loop 50Hz<br/>sim.js physics → twin3d.js → HUD"]

    ENTER --> LEFT["LEFT PANEL"]
    ENTER --> CENTER["CENTER — 3D HALL"]
    ENTER --> RIGHT["RIGHT PANEL"]
    ENTER --> TOP["TOP KPI STRIP"]
    ENTER --> DECK["FLOATING PANELS deck"]

    subgraph LEFT[" "]
        L1["🌡️ Weather slider 28–50°C"]
        L2["⚡ IT load slider 30–110%"]
        L3["Control: Tejas AI | Baseline BMS"]
        L4["Autonomous Control card<br/>policy v3 · steps · confidence"]
        L5["Trust ladder roadmap"]
        L6["📱 Open Field AR — QR"]
        L7["🥽 Walk in VR — QR"]
        L8["▶ Explain the platform tour"]
    end

    subgraph CENTER[" "]
        C1["Orbit · zoom 3D hall"]
        C2["Racks colour by inlet temp"]
        C3["Airflow particles"]
        C4["GPU-16 pulses red if faulted"]
        C5["CLICK RACK"]
    end

    subgraph RIGHT[" "]
        R1["Chat log"]
        R2["Type command OR chips"]
        R3["Send → /api/chat"]
        R4["🧠 Voice — press T"]
    end

    subgraph TOP[" "]
        T1["PUE Tejas vs Baseline"]
        T2["Cooling % saved"]
        T3["₹/day savings"]
        T4["Outside temp"]
        T5["ASHRAE safe ✓"]
    end

    C5 --> INSP["INSPECTOR popup<br/>temp · load · airflow · status"]
    INSP --> BTN["🔍 Inspect & fix →"]
    BTN --> DETAIL["FULL DETAIL SCREEN"]

    subgraph DETAIL["Rack inspect"]
        D1["Tabs: Overview · Electrical · Cooling · Mechanical · Controls · Everything"]
        D2["3D exploded view / SVG schematic"]
        D3["🛠 Move & Correct<br/>drag part → snap → red→blue"]
        D4["Detail chat dock 🧠/T<br/>scoped to this rack"]
    end

    R3 --> ACT{"AI returns actions"}
    ACT --> A1["setWeather"]
    ACT --> A2["setLoad"]
    ACT --> A3["setMode ai/baseline"]
    ACT --> A4["show panels"]
    ACT --> A5["focusRack GPU-16"]
    ACT --> A6["setFleet 1–500 sites"]

    A1 --> LOOP
    A2 --> LOOP
    A3 --> LOOP
    A4 --> DECK
    A5 --> C5

    subgraph DECK["Gen-UI panels — chat reveals"]
        P1["💰 savings"]
        P2["⚡ power + sparkline"]
        P3["📊 efficiency PUE"]
        P4["🗺️ racks heatmap"]
        P5["⚠️ alerts"]
        P6["🔧 service / work order GPU-16"]
        P7["🌐 fleet projection"]
        P8["🤖 autonomy decision log"]
        P9["🔌 electrical single-line"]
    end

    L6 --> AR_FLOW
    L7 --> VR_FLOW
    L8 --> TOUR

    subgraph TOUR["Guided tour steps"]
        TS1["Autonomy panel"]
        TS2["Savings + efficiency"]
        TS3["47°C heat wave"]
        TS4["Rack heat map"]
        TS5["GPU-16 service"]
        TS6["Fleet ×50 sites"]
    end
```

---

## 5. Field AR flow (`/ar`)

```mermaid
flowchart TD
    AR_IN(["/ar on phone<br/>from QR or link"])

    AR_IN --> CAM["Open camera<br/>HTTPS required"]
    CAM --> INTRO{"What do you want?"}

    INTRO -->|Fix| FIX
    INTRO -->|Build| BUILD

    subgraph FIX["Mode 1 — Fix GPU-16"]
        F1["Wayfinding arrow<br/>distance to rack"]
        F2["Reticle scan → lock"]
        F3["AR rings on fault"]
        F4["Fault card + parts list"]
        F5["4-step checklist"]
        F6["✅ Success overlay"]
        F6 -.->|"target"| SYNC["Desktop rack → blue"]
    end

    subgraph BUILD["Mode 2 — Build twin from camera"]
        B1["Point at machine · tap"]
        B2["POST /api/vision"]
        B3["Blueprint wireframe overlay"]
        B4["Live sensor chips"]
        B5["Power · speed controls"]
    end
```

---

## 6. VR flow (`/vr`)

```mermaid
flowchart TD
    VR_IN(["/vr<br/>?type=datacenter|factory|nuclear|geothermal|solar"])

    VR_IN --> ENTER["Intro → Enter walkthrough"]
    ENTER --> MOVE["Joystick walk · drag look · rise/duck"]
    MOVE --> RET["Center reticle on rack/machine"]

    RET --> CARD["Info card<br/>name · temp · load · SERVICE?"]
    CARD --> ASK["💬 Ask AI about this rack"]
    CARD --> ASST["Open full assistant overlay"]

    ASST --> PTT["🎙️ Push-to-talk or T key"]
    PTT --> CHAT["POST /api/chat<br/>+ facility spec context"]
    CHAT --> SPEAK["Spoken reply"]

    VR_IN --> CARDBOARD["Cardboard mode<br/>split-screen stereo"]
```

---

## 7. Factory / Plant twin flow (`/factory`)

```mermaid
flowchart TD
    F_IN(["/factory"])

    F_IN --> SCENE["factory3d.js + plants.js<br/>animated scene"]

    SCENE --> S1["Live sensor readouts"]
    SCENE --> S2["Control sliders<br/>power · speed"]
    SCENE --> S3["Chat → /api/chat"]
    SCENE --> S4["Fault LEDs<br/>PRESS-7 · SEP-2"]

    F_IN --> L1["🥽 VR → /vr?type=…"]
    F_IN --> L2["🛠️ AR → /ar"]
    F_IN --> BACK["‹ Back → /admin"]
```

---

## 8. Twin Studio flow (`/build`)

```mermaid
flowchart LR
    B_IN["/build"] --> PAL["Palette<br/>rack · CRAC · chiller · pump…"]
    PAL --> CANVAS["Drag onto canvas"]
    B_IN --> PROMPT["OR describe in prompt"]
    PROMPT --> API_D["POST /api/design"]
    CANVAS --> ACT["⚡ Activate"]
    API_D --> ACT
    ACT --> POST["POST /api/twins"]
    POST --> FAC["Redirect /factory"]
```

---

## 9. AI brain flow (under every chat/voice)

```mermaid
flowchart LR
    USER["Operator types or speaks"] --> CTX["Inject live context<br/>PUE · power · alerts · GPU-16"]
    CTX --> API["POST /api/chat"]

    API --> T1{"OpenAI key?"}
    T1 -->|yes| OAI["GPT-4o-mini"]
    T1 -->|no| T2{"Ollama up?"}
    T2 -->|yes| OLL["Qwen local"]
    T2 -->|no| LOC["localParse offline"]

    OAI --> JSON["reply + actions[]"]
    OLL --> JSON
    LOC --> JSON

    JSON --> APP["app.js applyActions"]
    APP --> TWIN["Twin · scene · panels update"]
```

---

## 10. Physics + control loop (what runs under the hood)

```mermaid
flowchart TB
    RAF["requestAnimationFrame loop"] --> TICK["Twin.tick() sim.js"]
    TICK --> PHYS["Physics<br/>ΔT · recirc · COP · fan³ · PUE"]
    PHYS --> CTRL{"Mode?"}
    CTRL -->|ai| TEJ["tejasControl grid search"]
    CTRL -->|baseline| BASE["baselineControl reactive BMS"]
    TEJ --> STATE["env + racks state"]
    BASE --> STATE
    STATE --> RENDER["twin3d.js update colours · airflow"]
    STATE --> HUD["KPI · panels · inspector"]
```

---

## 11. One-page linear journey (for slides)

```
START → ./run.sh
  ↓
ADMIN /  ─────────────────────────────────────────────┐
  │                                                    │
  ├─→ DATACENTER /datacenter  ← flagship              │
  │     ├─ sliders (weather · load)                     │
  │     ├─ mode (AI vs baseline)                      │
  │     ├─ chat / voice (T) → panels open             │
  │     ├─ click rack → inspect → fix → blue          │
  │     ├─ tour (6 steps)                             │
  │     └─ QR → AR or VR                              │
  │                                                    │
  ├─→ FACTORY /factory  (smart · nuclear · geo · solar)│
  │     └─ sensors · controls · VR · AR               │
  │                                                    │
  ├─→ CREATE +                                         │
  │     ├─ phone /scan → twin card                     │
  │     ├─ blueprint upload → twin card                │
  │     └─ /build studio → twin card                  │
  │                                                    │
  └─→ VR /vr  (from admin hero or any twin)            │
        └─ walk · pick · Ask Tejas                     │
                                                       │
AR /ar ← from datacenter or factory QR ────────────────┘
  ├─ fix GPU-16
  └─ build from camera
```

---

## 12. Route map (quick reference)

| Step | URL | You click / do |
|---|---|---|
| 1 | `/` | Land on Admin |
| 2a | `/datacenter` | Open data-center card |
| 2b | `/factory?type=…` | Open factory/plant card |
| 2c | `/build` | Twin Studio from create |
| 2d | `/scan` | Phone scan (from create QR) |
| 3 | `/datacenter` | Chat, sliders, click rack |
| 4 | `/ar` | Field AR from QR |
| 5 | `/vr` | VR from QR or admin |
| 6 | `/twin` | Optional glass console |

---

*No ingestion in this flow. For system architecture see [`ARCHITECTURE.md`](./ARCHITECTURE.md).*