// Tejas AI — Digital Twin of an AI data-center hall (Layer 1 + Layer 2).
// ---------------------------------------------------------------------------
// A physically-reasonable, dependency-free thermal model of a cooled server
// hall, plus two controllers (a "dumb" baseline BMS and the Tejas AI optimizer).
// Pure ES module — runs in the browser and in Node, fully offline.
//
// In production this lumped model is replaced by an EnergyPlus / Sinergym twin
// and an MPC/RL agent (see architect.md) — same interfaces, higher fidelity.
//
// What is modelled (the "in depth" part):
//   • Many server racks, heterogeneous IT load (incl. high-density GPU/AI racks)
//   • Cold-aisle / hot-aisle airflow:  ΔT_return = Q_IT / (airflow · cp)
//   • Per-rack INLET temperature with hot-air RECIRCULATION that worsens as
//     airflow drops — the real safety/efficiency trade-off
//   • Chiller COP that collapses as ambient rises (air-cooled condenser) and
//     improves as the chilled-water setpoint is raised
//   • Fan power following the affinity (cube) law:  P_fan ∝ fanSpeed³
//   • Envelope heat leak from the (hot Indian) weather
//   • PUE  =  total facility power / IT power
//   • ASHRAE A1 thermal envelope (recommended ≤27 °C, allowable ≤32 °C)
// ---------------------------------------------------------------------------

export const PARAMS = {
  // ---- airflow / air-side ----
  airUA: 12.5,        // aggregate airflow heat-capacity at full fan (kW per °C)
                      //   ΔT_return = Q_IT / (airUA · fanFrac)
  recircBase: 0.06,   // baseline hot-air recirculation fraction at full airflow
  recircGain: 2.0,    // how much recirculation worsens as airflow is starved
  hotGain: 0.16,      // per-rack inlet rise per kW of that rack's own load (hotspot)

  // ---- chiller / water-side ----
  copBase: 4.2,       // nominal chiller COP (cooling kW per electrical kW)
  copAmbRef: 25,      // ambient where COP is nominal (°C)
  copAmbSlope: 0.020, // COP fraction lost per °C of ambient above ref
  copChwRef: 7,       // chilled-water temp where COP is nominal (°C)
  copChwSlope: 0.075, // COP fraction gained per °C the CHW setpoint is raised
  copMin: 1.6, copMax: 8.0,
  coilApproach: 4.0,  // CHW temp tracks supply-air setpoint minus this approach

  // ---- fans / pumps / losses ----
  fanPowerMax: 19.0,  // aggregate CRAC fan power at 100% speed (kW)  (∝ fanFrac³)
  auxFrac: 0.05,      // pumps / UPS / lighting overhead as a fraction of IT
  auxFixed: 4.0,      // fixed parasitic load (kW)

  // ---- envelope ----
  Renv: 2.2,          // thermal resistance to ambient (°C per kW of leak)

  // ---- thermal mass (animation realism) ----
  tauRoom: 0.10,      // room temperature time-constant (relaxation, per tick)
  tauInlet: 0.18,     // rack-inlet temperature time-constant

  // ---- ASHRAE A1 safe envelope for rack INLET air ----
  inletRecMax: 27.0,  // recommended upper limit (°C)
  inletAllowMax: 32.0,// allowable hard limit (°C)
  inletMin: 18.0,     // recommended lower limit (overcooling below = wasted ₹)
  aiMargin: 1.5,      // AI keeps the worst rack this far below the recommended max

  // ---- economics ----
  tariff: 9.0,        // industrial electricity tariff (₹ per kWh)
  co2PerKwh: 0.71,    // kg CO₂ per kWh (India grid average)
};

// ---------------------------------------------------------------------------
// Rack layout: two pods, each pod is two rows facing a shared cold aisle.
// A handful of racks are high-density "AI / GPU" racks — they run hottest and
// become the star of the "show me the hottest rack" moment.
// ---------------------------------------------------------------------------
export function buildRacks() {
  const rows = 4, perRow = 6;     // 24 racks
  const racks = [];
  // which (row,col) are GPU racks — clustered so a hotspot is visible
  const gpu = new Set(['1-2', '1-3', '2-2', '2-3', '0-5']);
  // One rack carries a developing COOLING FAULT (partially blocked airflow /
  // clogged filter) — it runs hotter than its load explains. This is the seed
  // of the predictive-maintenance story: the AI spots it and recommends service.
  const faultKey = '2-3';
  let id = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < perRow; c++) {
      const isGpu = gpu.has(`${r}-${c}`);
      const ratedKw = isGpu ? 14 : 6;            // nameplate IT power
      // base utilisation varies rack-to-rack so the field looks alive
      const util = 0.55 + 0.35 * Math.abs(Math.sin((id + 1) * 1.7));
      const faulted = `${r}-${c}` === faultKey;
      const rack = {
        id, row: r, col: c, isGpu,
        ratedKw,
        utilBase: util,        // 0..1 nominal utilisation for this rack
        load: ratedKw * util,  // current IT power (kW) — updated each tick
        inlet: 22,             // current inlet air temp (°C) — relaxed each tick
        faultRise: faulted ? 3.4 : 0,  // extra inlet °C from a cooling fault
        faulted,
        name: (isGpu ? 'GPU-' : 'R-') + String(id + 1).padStart(2, '0'),
      };
      // a machine the twin has watched slowly degrade — the maintenance story
      if (faulted) {
        rack.service = {
          degradingMonths: 14,
          startedFrom: 'CRAC-2 supply filter + this rack’s rear fan tray',
          rootCause: 'Progressive airflow restriction: filter loading on CRAC-2 plus a rear fan-tray bearing wearing out. Inlet air now arrives ~3.4 °C hotter than this rack’s load alone explains, and it has crept up steadily over 14 months.',
          parts: [
            'CRAC-2 air filter set (MERV-13) ×1',
            'Rear hot-swap fan tray (4-fan, 120 mm) ×1',
            'Blanking panels for 6U of open slots ×6',
          ],
          action: 'Swap the CRAC-2 filter, replace the rear fan tray, fit blanking panels to stop hot-air recirculation. ~25 min on-site.',
          tech: { name: 'R. Kumar', role: 'Facilities / HVAC technician' },
        };
      }
      racks.push(rack);
      id++;
    }
  }
  return { rows, perRow, racks };
}

// Chiller COP: worse in heat, better when the chilled-water setpoint is raised.
export function chillerCOP(Tamb, Tchw, p = PARAMS) {
  const cop = p.copBase
    * (1 - p.copAmbSlope * (Tamb - p.copAmbRef))
    * (1 + p.copChwSlope * (Tchw - p.copChwRef));
  return Math.max(p.copMin, Math.min(p.copMax, cop));
}

// ---------------------------------------------------------------------------
// Steady-state evaluation: given the environment (ambient, IT load) and a set
// of control setpoints, compute every temperature and every power term.
// `racks` carries each rack's current load; we return its steady inlet temp.
// ---------------------------------------------------------------------------
export function evaluate(env, controls, racks, p = PARAMS) {
  const { Tamb } = env;
  const { Tsup, fanFrac } = controls;

  // total IT heat to remove
  let Pit = 0;
  for (const r of racks) Pit += r.load;

  // air-side: return (hot-aisle) temperature rises as airflow is starved
  const dTreturn = Pit / (p.airUA * Math.max(0.15, fanFrac));
  const Treturn = Tsup + dTreturn;

  // hot-air recirculation grows as airflow drops below design
  const recirc = p.recircBase * (1 + p.recircGain * (1 - fanFrac));

  // per-rack inlet temperature = supply + recirculated hot air + own hotspot
  // (+ any fault-induced rise — a blocked filter / failing fan runs that rack hot)
  const inlets = racks.map(r => Tsup + recirc * dTreturn + p.hotGain * r.load + (r.faultRise || 0));
  let worstInlet = -Infinity, worstIdx = 0;
  inlets.forEach((t, i) => { if (t > worstInlet) { worstInlet = t; worstIdx = i; } });

  // water-side: CHW tracks supply-air setpoint; COP follows ambient + CHW
  const Tchw = Math.max(4, Math.min(18, Tsup - p.coilApproach));
  const cop = chillerCOP(Tamb, Tchw, p);

  // cooling load = IT heat + heat leaking in from the hot outdoors
  const Troom = (Tsup + Treturn) / 2;
  const Qleak = Math.max(0, (Tamb - Troom) / p.Renv);
  const Qcool = Pit + Qleak;

  // electrical power terms
  const Pchiller = Qcool / cop;
  const Pfans = p.fanPowerMax * Math.pow(fanFrac, 3);   // affinity (cube) law
  const Paux = p.auxFrac * Pit + p.auxFixed;
  const Pcool = Pchiller + Pfans + Paux;                 // non-IT ("overhead")
  const Ptotal = Pit + Pcool;
  const PUE = Ptotal / Pit;

  return {
    Pit, Pchiller, Pfans, Paux, Pcool, Ptotal, PUE,
    Tsup, Tchw, fanFrac, cop, Treturn, Troom, recirc,
    inlets, worstInlet, worstIdx, Qcool, Qleak,
    safe: worstInlet <= p.inletAllowMax,
    withinRecommended: worstInlet <= p.inletRecMax,
  };
}

// ---------------------------------------------------------------------------
// Controller A — BASELINE ("dumb" rule-based BMS).
// Overcools to a tight cold supply temp, oversupplies airflow "to be safe",
// and only reacts AFTER an inlet gets hot. Cheap to build, expensive to run.
// ---------------------------------------------------------------------------
export function baselineControl(env, racks, p = PARAMS) {
  let Tsup = 16.0;       // cold fixed supply — classic over-provisioning
  let fanFrac = 0.95;    // fans nearly maxed regardless of load
  // reactive safety bump (it only looks at the present, never ahead)
  let m = evaluate(env, { Tsup, fanFrac }, racks, p);
  let guard = 0;
  while (m.worstInlet > p.inletRecMax - 0.5 && guard++ < 12) {
    Tsup -= 0.5; fanFrac = Math.min(1, fanFrac + 0.02);
    m = evaluate(env, { Tsup, fanFrac }, racks, p);
  }
  return { Tsup, fanFrac, label: 'baseline' };
}

// ---------------------------------------------------------------------------
// Controller B — TEJAS AI (the optimizer / moat).
// Searches supply-air temp and fan speed for the LEAST total power that keeps
// the worst rack inlet safely inside the recommended band — i.e. it runs the
// hall as WARM and with as LITTLE airflow as it safely can. Feed-forward: it
// optimises against the *current* ambient + load every step, so when a heat
// wave hits or load spikes it re-solves instead of blindly reacting.
// (A transparent stand-in for the production MPC/RL agent.)
// ---------------------------------------------------------------------------
export function tejasControl(env, racks, p = PARAMS) {
  const limit = p.inletRecMax - p.aiMargin;   // hold worst inlet below this
  let best = null;
  for (let Tsup = 26; Tsup >= 13; Tsup -= 0.5) {
    for (let fanFrac = 1.0; fanFrac >= 0.4; fanFrac -= 0.05) {
      const m = evaluate(env, { Tsup, fanFrac }, racks, p);
      if (m.worstInlet > limit) continue;       // safety constraint (hard)
      if (!best || m.Ptotal < best.Ptotal) best = { Tsup, fanFrac, Ptotal: m.Ptotal };
    }
  }
  // Fallback (extreme heat / overload): no setpoint satisfies the margin →
  // go to max safe cooling (the hard envelope still protects the racks).
  if (!best) best = { Tsup: 13, fanFrac: 1.0 };
  return { Tsup: best.Tsup, fanFrac: best.fanFrac, label: 'tejas' };
}

// ---------------------------------------------------------------------------
// The live Twin: holds the shared environment + both controllers' state, and
// steps forward in time with thermal-mass relaxation so the 3D world feels
// alive when you drag the weather/load sliders or the AI re-optimises.
// ---------------------------------------------------------------------------
export class Twin {
  constructor(p = PARAMS) {
    this.p = p;
    const layout = buildRacks();
    this.rows = layout.rows; this.perRow = layout.perRow;
    // independent rack arrays for the two parallel worlds (AI / baseline)
    this.aiRacks = layout.racks.map(r => ({ ...r }));
    this.baseRacks = layout.racks.map(r => ({ ...r }));
    this.layout = layout.racks;     // canonical geometry for the 3D scene

    this.env = { Tamb: 38, loadFrac: 0.8 };  // live, slider-controlled
    this.aiOn = true;                         // is the Tejas AI in control?

    this.ai = null; this.base = null;         // latest evaluated metrics
    this.energy = { ai: 0, base: 0, hours: 0 };
    this.history = [];                        // rolling samples for charts
    this.maxHistory = 240;

    // ---- autonomous control + online learning (the Phaidra-style story) ----
    this.policyVersion = 3;                   // control policy revision
    this.controlSteps = 12840;               // steps the agent has learned from
    this.confidence = 0.93;                   // grows as it keeps holding the band
    this.decisions = [];                      // explainable action log (newest first)
    this._lastCtl = null;
    this._lastLogAmb = 38;
    // seed a little history so the autonomy panel reads as a running agent
    this.decisions = [
      { step: this.controlSteps - 240, Tsup: 24.5, fan: 0.62, Tchw: 20.5, why: 'Morning load ramp: pre-trimmed airflow as racks woke up — least-energy point inside the band.' },
      { step: this.controlSteps - 90, Tsup: 25.5, fan: 0.58, Tchw: 21.5, why: 'Ambient eased: raised supply air to lift chilled-water temperature and recover chiller COP.' },
    ];

    // prime the world so nothing renders empty
    this._applyLoads();
    this._control();
    this.ai = evaluate(this.env, this.aiCtl, this.aiRacks, p);
    this.base = evaluate(this.env, this.baseCtl, this.baseRacks, p);
    for (let i = 0; i < this.aiRacks.length; i++) {
      this.aiRacks[i].inlet = this.ai.inlets[i];
      this.baseRacks[i].inlet = this.base.inlets[i];
    }
  }

  setAmbient(t) { this.env.Tamb = Math.max(28, Math.min(50, t)); }
  setLoad(f)    { this.env.loadFrac = Math.max(0.3, Math.min(1.1, f)); }
  setAI(on)     { this.aiOn = on; }

  // distribute the global utilisation across racks (GPU racks swing hardest)
  _applyLoads() {
    const f = this.env.loadFrac;
    for (const arr of [this.aiRacks, this.baseRacks]) {
      for (const r of arr) {
        const u = Math.max(0.12, Math.min(1.0, r.utilBase * f));
        r.load = r.ratedKw * u;
      }
    }
  }

  _control() {
    this.aiCtl = this.aiOn ? tejasControl(this.env, this.aiRacks, this.p)
                           : baselineControl(this.env, this.aiRacks, this.p);
    this.baseCtl = baselineControl(this.env, this.baseRacks, this.p);
  }

  // advance one tick. dtHr = simulated hours elapsed (for energy integration).
  tick(dtHr = 0.05) {
    this._applyLoads();
    this._control();
    const ai = evaluate(this.env, this.aiCtl, this.aiRacks, this.p);
    const base = evaluate(this.env, this.baseCtl, this.baseRacks, this.p);

    // relax each rack inlet toward its steady target (thermal mass)
    const ka = this.p.tauInlet;
    for (let i = 0; i < this.aiRacks.length; i++) {
      this.aiRacks[i].inlet += (ai.inlets[i] - this.aiRacks[i].inlet) * ka;
      this.baseRacks[i].inlet += (base.inlets[i] - this.baseRacks[i].inlet) * ka;
    }
    this.ai = ai; this.base = base;

    // integrate energy (kWh)
    this.energy.ai += ai.Ptotal * dtHr;
    this.energy.base += base.Ptotal * dtHr;
    this.energy.hours += dtHr;

    // rolling history for live charts
    this.history.push({ aiP: ai.Ptotal, baseP: base.Ptotal, aiPUE: ai.PUE, basePUE: base.PUE, Tamb: this.env.Tamb });
    if (this.history.length > this.maxHistory) this.history.shift();

    // ---- online learning + explainable decision log ----
    if (this.aiOn) {
      this.controlSteps += 1;
      // confidence drifts up while the band is held, dips if a rack is hot
      const target = ai.withinRecommended ? 0.985 : 0.8;
      this.confidence += (target - this.confidence) * 0.02;
      // log a decision only when the AI meaningfully moves a setpoint
      const c = this.aiCtl, prev = this._lastCtl;
      const moved = !prev || Math.abs(c.Tsup - prev.Tsup) >= 1 || Math.abs(c.fanFrac - prev.fanFrac) >= 0.1
        || Math.abs(this.env.Tamb - this._lastLogAmb) >= 3;   // also log on weather shifts
      if (moved) {
        this.decisions.unshift({
          step: this.controlSteps,
          Tsup: c.Tsup, fan: c.fanFrac, Tchw: ai.Tchw,
          why: this._rationale(ai, base),
        });
        if (this.decisions.length > 8) this.decisions.pop();
        this._lastCtl = { Tsup: c.Tsup, fanFrac: c.fanFrac };
        this._lastLogAmb = this.env.Tamb;
      }
    }

    return this.summary();
  }

  // a short, human rationale for the current control move (explainability)
  _rationale(ai, base) {
    const warmer = (ai.Tsup - base.Tsup).toFixed(0);
    const fanCut = ((base.fanFrac - ai.fanFrac) * 100).toFixed(0);
    const save = (base.Pcool - ai.Pcool).toFixed(0);
    if (this.env.Tamb >= 44)
      return `Heat wave (${this.env.Tamb.toFixed(0)}°C): chiller COP is collapsing, so I raised chilled-water by running supply air ${warmer}°C warmer and trimmed fans ${fanCut}% — holding the band while cutting ${save} kW vs baseline.`;
    if (this.env.loadFrac >= 0.95)
      return `Load near peak: kept supply air as warm as the worst rack allows and lifted airflow just enough to stop recirculation — ${save} kW leaner than baseline.`;
    return `Conditions mild: supply air ${ai.Tsup.toFixed(1)}°C, fans ${(ai.fanFrac * 100).toFixed(0)}%, chilled water ${ai.Tchw.toFixed(1)}°C — least-energy point that holds every inlet inside the band (${save} kW saved).`;
  }

  // the predictive-maintenance work order + drafted service email for the
  // machine the twin has watched degrade. This is the "beyond cooling" story.
  workOrder() {
    const r = this.aiRacks.find(x => x.faulted);
    if (!r || !r.service) return null;
    const s = r.service;
    // estimated energy wasted: the fault forces the whole hall colder to protect
    // this one rack — roughly faultRise °C of extra lift across the cooling plant.
    const wasteKw = +(r.faultRise * 3.1).toFixed(1);
    const wasteYearRs = Math.round(wasteKw * 24 * 365 * this.p.tariff);
    return {
      rack: r.name, id: r.id,
      degradingMonths: s.degradingMonths,
      rootCause: s.rootCause,
      parts: s.parts, action: s.action, tech: s.tech,
      wasteKw, wasteYearRs,
      email: {
        to: `${s.tech.name} <facilities@site.in>`,
        subject: `Service needed — ${r.name} (cooling fault, est. ₹${wasteYearRs.toLocaleString('en-IN')}/yr waste)`,
        body:
`Hi ${s.tech.name.split(' ')[0]},

Tejas AI has flagged ${r.name} for service. It has been degrading for ${s.degradingMonths} months — inlet air now runs about ${r.faultRise.toFixed(1)}°C hotter than its IT load explains.

Likely cause: ${s.rootCause}

Estimated impact: ~${wasteKw} kW of extra cooling (≈ ₹${wasteYearRs.toLocaleString('en-IN')}/yr) because the hall is being held colder to protect this one rack.

Please bring:
${s.parts.map(p => '  • ' + p).join('\n')}

On-site fix (~25 min): ${s.action}

The exact rack, location and history are pre-loaded in the twin — you can confirm in minutes on arrival.

— Tejas AI (autonomous), ${this.env ? 'Chennai · AI Data Center A' : ''}`,
      },
    };
  }

  // Advisories the AI surfaces on its own — cooling optimisation AND, beyond
  // cooling, predictive maintenance (a rack that needs service). This is what
  // makes Tejas more than a thermostat: it watches the whole hall and speaks up.
  alerts() {
    const p = this.p, out = [];
    // 1) predictive maintenance: a rack running hotter than its load explains
    for (const r of this.aiRacks) {
      if (r.faultRise && r.faultRise > 1.5) {
        out.push({
          level: 'service', rack: r.name, id: r.id,
          title: `${r.name} needs service`,
          detail: `Inlet ${r.inlet.toFixed(1)}°C — about ${r.faultRise.toFixed(1)}°C above what its ${r.load.toFixed(0)} kW load predicts. Signature of a restricted airflow path (clogged filter / failing fan). Recommend inspection before it forces the whole hall colder.`,
        });
      }
    }
    // 2) safety: any rack near / over the recommended ASHRAE limit
    const hot = this.aiRacks.filter(r => r.inlet > p.inletRecMax - 0.5);
    if (hot.length) {
      const w = this.hottestRack('ai');
      out.push({
        level: w.inlet > p.inletAllowMax ? 'critical' : 'warning',
        rack: w.name, id: w.id,
        title: `${hot.length} rack${hot.length > 1 ? 's' : ''} near the thermal limit`,
        detail: `Hottest is ${w.name} at ${w.inlet.toFixed(1)}°C (ASHRAE recommended ≤ ${p.inletRecMax}°C). AI is holding the safe envelope.`,
      });
    }
    // 3) optimisation headline (only meaningful when the AI is in control)
    if (this.aiOn && this.base && this.ai) {
      const pct = ((this.base.Pcool - this.ai.Pcool) / this.base.Pcool) * 100;
      if (pct > 4) out.push({
        level: 'optimise', rack: null, id: null,
        title: `Cooling running ${pct.toFixed(0)}% leaner than baseline`,
        detail: `PUE ${this.ai.PUE.toFixed(2)} vs ${this.base.PUE.toFixed(2)}. Supply air ${this.ai.Tsup.toFixed(1)}°C, fans ${(this.ai.fanFrac * 100).toFixed(0)}%, chilled water ${this.ai.Tchw.toFixed(1)}°C.`,
      });
    }
    // 4) if AI is OFF, point out the opportunity being left on the table
    if (!this.aiOn) out.push({
      level: 'optimise', rack: null, id: null,
      title: 'Running on the baseline controller',
      detail: `PUE ${this.base.PUE.toFixed(2)}. Hand control to Tejas to cut cooling energy without touching the safe band.`,
    });
    return out;
  }

  // hottest rack right now (for "what's running hottest?")
  hottestRack(which = 'ai') {
    const arr = which === 'base' ? this.baseRacks : this.aiRacks;
    let h = arr[0];
    for (const r of arr) if (r.inlet > h.inlet) h = r;
    return h;
  }

  // headline numbers (instantaneous power + cumulative-energy savings)
  summary() {
    const p = this.p;
    const ai = this.ai, base = this.base;
    // instantaneous overhead (cooling) saving
    const coolSaveNow = base.Pcool - ai.Pcool;
    const coolPctNow = base.Pcool > 0 ? (coolSaveNow / base.Pcool) * 100 : 0;
    const totalSaveNow = base.Ptotal - ai.Ptotal;
    const totalPctNow = base.Ptotal > 0 ? (totalSaveNow / base.Ptotal) * 100 : 0;
    // cumulative energy saved (kWh) projected to ₹ / CO₂
    const kwhSaved = this.energy.base - this.energy.ai;
    // daily-rate projection from the *current* saving (₹/day, ₹/yr, t CO₂/yr)
    const savedKw = totalSaveNow;                  // kW saved right now
    const rupeesDay = savedKw * 24 * p.tariff;
    const rupeesYear = rupeesDay * 365;
    const co2Year = savedKw * 24 * 365 * p.co2PerKwh / 1000; // tonnes
    return {
      ai, base,
      aiPUE: ai.PUE, basePUE: base.PUE,
      coolSaveNow, coolPctNow, totalSaveNow, totalPctNow,
      kwhSaved, rupeesDay, rupeesYear, co2Year, savedKw,
      worstInletAI: ai.worstInlet, worstInletBase: base.worstInlet,
      safeAI: ai.withinRecommended, safeBase: base.withinRecommended,
      aiCtl: this.aiCtl, baseCtl: this.baseCtl,
      env: { ...this.env }, aiOn: this.aiOn,
      policyVersion: this.policyVersion, controlSteps: this.controlSteps,
      confidence: this.confidence, decisions: this.decisions,
    };
  }
}

// Project a single hall's current ₹/day saving across a fleet of N facilities.
export function fleetProjection(rupeesDay, co2YearOne, kwhPerDay, facilities = 10) {
  return {
    facilities,
    rupeesYear: rupeesDay * 365 * facilities,
    co2Year: co2YearOne * facilities,
    mwhYear: (kwhPerDay * 365 * facilities) / 1000,
  };
}
