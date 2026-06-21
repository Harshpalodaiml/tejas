// Tejas AI — 3D factory machine for a factory digital twin.
// A generic motor-driven machine: plinth, motor body, rotating shaft + fan,
// coupling, heat glow by load. Orbit camera. Vendored Three.js, offline.

import * as THREE from './vendor/three.module.js';
import { buildPlant, animatePlant, makeSinks } from './plants.js';

export class Factory3D {
  constructor(container) {
    this.container = container;
    const w = container.clientWidth, h = container.clientHeight;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog('#0a1020', 14, 38);
    this.scene.background = new THREE.Color('#0a1224');

    this.camera = new THREE.PerspectiveCamera(46, w / h, 0.1, 100);
    this.target = new THREE.Vector3(0, 1.0, 0);
    this.orbit = { radius: 9, theta: Math.PI * 0.22, phi: Math.PI * 0.42 };
    this._applyCam(); this._wire();

    this._lights();
    this.speed = 0.6; this.power = true; this.heat = 0.3;
    this.layoutMeshes = [];
    // animated populations of the busy factory floor
    this.rotors = [];       // spinning tool heads / fans   {grp, rate}
    this.rollerSets = [];   // conveyor roller groups
    this.convParts = [];    // parts riding the belts       {mesh, min, max}
    this.arms = [];         // working robot arms           {base, upper, phase}
    this.workers = [];      // walking workers              {grp, path, idx, legs, arms, speed, t}
    this.agvs = [];         // automated guided carts       {grp, path, idx, speed, beacon}
    this._tmpV = new THREE.Vector3();
    this._t = 0;
    window.addEventListener('resize', () => this.resize());
  }

  _applyCam() {
    const { radius: r, theta: t, phi: p } = this.orbit;
    this.camera.position.set(
      this.target.x + r * Math.sin(p) * Math.sin(t),
      this.target.y + r * Math.cos(p),
      this.target.z + r * Math.sin(p) * Math.cos(t));
    this.camera.lookAt(this.target);
  }
  _wire() {
    const el = this.renderer.domElement; let drag = false, lx = 0, ly = 0;
    el.addEventListener('pointerdown', e => { drag = true; lx = e.clientX; ly = e.clientY; });
    el.addEventListener('pointermove', e => {
      if (!drag) return; const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
      this.orbit.theta -= dx * 0.006;
      this.orbit.phi = Math.max(0.15, Math.min(Math.PI * 0.49, this.orbit.phi - dy * 0.006));
      this._applyCam();
    });
    window.addEventListener('pointerup', () => drag = false);
    el.addEventListener('wheel', e => { e.preventDefault(); this.orbit.radius = Math.max(5, Math.min(20, this.orbit.radius + e.deltaY * 0.01)); this._applyCam(); }, { passive: false });
  }

  _lights() {
    this.scene.add(new THREE.HemisphereLight('#cfe0ff', '#0a0f18', 1.0));
    const d = new THREE.DirectionalLight('#fff0d8', 1.5); d.position.set(6, 12, 5); d.castShadow = true;
    d.shadow.mapSize.set(1024, 1024); this.scene.add(d);
    const key = new THREE.DirectionalLight('#dcebff', 0.7); key.position.set(-6, 8, 6); this.scene.add(key);
    const fill = new THREE.PointLight('#4da3ff', 0.8, 36); fill.position.set(-4, 5, -3); this.scene.add(fill);
    const warm = new THREE.PointLight('#ffd9a0', 0.6, 30); warm.position.set(4, 5, 4); this.scene.add(warm);
  }
  _floor() {
    const f = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 0.3, 48),
      new THREE.MeshStandardMaterial({ color: '#0e1424', roughness: .9 }));
    f.position.y = -0.15; f.receiveShadow = true; this.scene.add(f);
    const g = new THREE.GridHelper(14, 28, 0x2b3b66, 0x172033); g.position.y = 0.02; this.scene.add(g);
  }

  // A full, BUSY factory hall: rows of machine stations, conveyors with parts
  // flowing, working robot arms, storage shelves, an AGV cart hauling a box, and
  // hard-hat workers walking the aisles. Everything animates with the run state.
  buildMachine() {
    this._factoryEnv(26, 18);

    // the detailed hero machine, centre stage
    this._machine();

    // back row of machine stations
    const stationColors = ['#33466e', '#2a4a5e', '#3a3a6e', '#2a5a4a', '#4a3a5e'];
    [-9, -4.5, 4.5, 9].forEach((sx, i) => this._station(sx, -6, stationColors[i % stationColors.length]));
    // a couple more at the back-centre flanks
    this._station(0, -7.4, '#3a4a2e');

    // front working cells
    this._robotArm(-5, 4.5);
    this._robotArm(5, 4.5, Math.PI);
    this._robotArm(8.5, -1, -Math.PI / 2);

    // conveyors moving parts through the bay
    this._conveyor(-4.5, 1.2);
    this._conveyor(4.5, 1.2);
    this._conveyor(0, 6.2);

    // process tank + control cabinets + storage shelves
    this._tank(11, -6);
    this._cabinets(-11.4, -6.4);
    this._shelves(-12, 0, Math.PI / 2);
    this._shelves(12, 4, -Math.PI / 2);

    // ---- people: hard-hat workers walking the aisles ----
    const P = (x, z) => new THREE.Vector3(x, 0, z);
    this._worker([P(-8, 8), P(8, 8), P(8, 3), P(-8, 3)], '#2ee6a6');
    this._worker([P(-2, 7.5), P(-2, -2), P(2, -2), P(2, 7.5)], '#19c6ff');
    this._worker([P(9, 7), P(9, -3.5), P(2.5, -3.5), P(2.5, 7)], '#ffd34d');
    this._worker([P(-9, -3), P(-9, 7), P(-3, 7), P(-3, -3)], '#ff7a59');
    this._worker([P(6, 8.5), P(-6, 8.5)], '#cfe0ff');

    // ---- an AGV cart hauling a box around the perimeter ----
    this._agv([P(-10, 8.5), P(10, 8.5), P(10, -8), P(-10, -8)]);

    // wide hall overview
    this.target.set(0, 1.0, 0.5);
    this.orbit = { radius: 17, theta: Math.PI * 0.16, phi: Math.PI * 0.40 };
    this._applyCam();
  }

  _factoryEnv(W = 26, D = 18) {
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(W, 0.3, D),
      new THREE.MeshStandardMaterial({ color: '#0e1424', roughness: 0.92, metalness: 0.08 }));
    floor.position.y = -0.15; floor.receiveShadow = true; this.scene.add(floor);
    const grid = new THREE.GridHelper(Math.max(W, D), Math.max(W, D) * 2, 0x2b3b66, 0x172033);
    grid.position.y = 0.02; this.scene.add(grid);

    // glowing aisle guide-paths painted on the floor
    const aisleMat = new THREE.MeshStandardMaterial({ color: '#0c1322', emissive: '#1b6', emissiveIntensity: 0.28 });
    [-3, 3].forEach(z => {
      const a = new THREE.Mesh(new THREE.PlaneGeometry(W - 4, 0.5), aisleMat);
      a.rotation.x = -Math.PI / 2; a.position.set(0, 0.03, z); this.scene.add(a);
    });

    // walls
    const wallMat = new THREE.MeshStandardMaterial({ color: '#0b1322', roughness: 0.95, metalness: 0.05 });
    const back = new THREE.Mesh(new THREE.BoxGeometry(W, 6, 0.3), wallMat); back.position.set(0, 2.8, -D / 2); this.scene.add(back);
    for (const sx of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.BoxGeometry(0.3, 6, D), wallMat); w.position.set(sx * W / 2, 2.8, 0); this.scene.add(w);
    }
    // overhead truss + glowing light bars across the bay
    const trussMat = new THREE.MeshStandardMaterial({ color: '#0c1320', metalness: 0.6, roughness: 0.5 });
    const barMat = new THREE.MeshStandardMaterial({ color: '#0a0f18', emissive: '#bcd4ff', emissiveIntensity: 0.8 });
    for (let z = -D / 2 + 2; z <= D / 2 - 2; z += 4) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(W - 1, 0.16, 0.16), trussMat); beam.position.set(0, 5.6, z); this.scene.add(beam);
      const bar = new THREE.Mesh(new THREE.BoxGeometry(W * 0.5, 0.1, 0.4), barMat); bar.position.set(0, 5.5, z); this.scene.add(bar);
    }
  }

  // a machine station with a spinning tool head + status light
  _station(x, z, color = '#33466e') {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const bodyMat = new THREE.MeshStandardMaterial({ color, metalness: 0.6, roughness: 0.42, emissive: '#0c1830', emissiveIntensity: 0.4 });
    const dark = new THREE.MeshStandardMaterial({ color: '#162039', metalness: 0.5, roughness: 0.5 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.4, 1.5), dark); base.position.y = 0.2; g.add(base);
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.3, 1.3), bodyMat); body.position.y = 1.0; g.add(body);
    // status strip (emissive)
    const strip = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.14, 0.05),
      new THREE.MeshStandardMaterial({ color: '#0c1322', emissive: '#2ee6a6', emissiveIntensity: 1.0 }));
    strip.position.set(0, 1.35, 0.66); g.add(strip);
    // spinning tool head on top
    const rotor = new THREE.Group(); rotor.position.set(0, 1.75, 0); g.add(rotor);
    const steel = new THREE.MeshStandardMaterial({ color: '#9aa8c4', metalness: 0.8, roughness: 0.3 });
    const tool = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.04, 0.7, 12), steel); tool.position.y = 0.35; rotor.add(tool);
    for (let i = 0; i < 3; i++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.1), steel);
      spoke.rotation.y = (i / 3) * Math.PI * 2; rotor.add(spoke);
    }
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    this.rotors.push({ grp: rotor, rate: 8 + Math.random() * 6 });
    this.scene.add(g);
  }

  _conveyor(x, z, rot = 0) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot;
    const frameMat = new THREE.MeshStandardMaterial({ color: '#1a2438', metalness: 0.6, roughness: 0.4 });
    const belt = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 0.9),
      new THREE.MeshStandardMaterial({ color: '#0c1320', roughness: 0.8 }));
    belt.position.y = 0.7; belt.castShadow = true; g.add(belt);
    for (const lx of [-1.5, 1.5]) for (const lz of [-0.45, 0.45]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.7, 0.12), frameMat); leg.position.set(lx, 0.35, lz); g.add(leg);
    }
    const rollers = [];
    for (let i = -1; i <= 1; i++) {
      const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.95, 16), frameMat);
      roller.rotation.x = Math.PI / 2; roller.position.set(i * 1.2, 0.78, 0); g.add(roller); rollers.push(roller);
    }
    // a few parts riding the belt, evenly spaced
    const partMat = new THREE.MeshStandardMaterial({ color: '#8a6a2a', metalness: 0.3, roughness: 0.7 });
    for (let k = 0; k < 3; k++) {
      const part = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.32), partMat.clone());
      part.position.set(-1.5 + k * 1.1, 0.93, 0); part.castShadow = true; g.add(part);
      this.convParts.push({ mesh: part, min: -1.5, max: 1.6 });
    }
    this.rollerSets.push(rollers);
    this.scene.add(g);
  }

  _tank(x, z) {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 2.0, 24),
      new THREE.MeshStandardMaterial({ color: '#21304e', metalness: 0.55, roughness: 0.35 }));
    tank.position.y = 1.1; tank.castShadow = true; g.add(tank);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.75, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: '#2a3a5e', metalness: 0.6, roughness: 0.3 }));
    cap.position.y = 2.1; g.add(cap);
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 12),
      new THREE.MeshStandardMaterial({ color: '#2f6df0', emissive: '#0a2a6b', metalness: 0.6, roughness: 0.3 }));
    pipe.rotation.z = Math.PI / 2; pipe.position.set(0.9, 0.5, 0); g.add(pipe);
    this.scene.add(g);
  }

  _robotArm(x, z, rot = 0) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot;
    const mat = new THREE.MeshStandardMaterial({ color: '#ff7a59', metalness: 0.4, roughness: 0.5 });
    const dark = new THREE.MeshStandardMaterial({ color: '#10182a', metalness: 0.5, roughness: 0.5 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.4, 20), dark); base.position.y = 0.2; g.add(base);
    const armBase = new THREE.Group(); armBase.position.y = 0.4; g.add(armBase);
    const lower = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.1, 0.25), mat); lower.position.y = 0.55; armBase.add(lower);
    const armUpper = new THREE.Group(); armUpper.position.y = 1.1; armBase.add(armUpper);
    const upper = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.0, 0.2), mat); upper.position.y = 0.5; armUpper.add(upper);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.28), dark); grip.position.y = 1.0; armUpper.add(grip);
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    this.arms.push({ base: armBase, upper: armUpper, phase: Math.random() * 6 });
    this.scene.add(g);
  }

  _cabinets(x, z) {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    for (let i = 0; i < 3; i++) {
      const c = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.6, 0.6),
        new THREE.MeshStandardMaterial({ color: '#16223c', metalness: 0.5, roughness: 0.5 }));
      c.position.set(i * 0.74, 0.8, 0); c.castShadow = true; g.add(c);
      const led = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.12),
        new THREE.MeshStandardMaterial({ color: '#0c1322', emissive: i === 1 ? '#ffd34d' : '#2ee6a6', emissiveIntensity: 0.8 }));
      led.position.set(i * 0.74, 1.2, 0.31); g.add(led);
    }
    this.scene.add(g);
  }

  // storage shelving stacked with crates
  _shelves(x, z, rot = 0) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot;
    const frameMat = new THREE.MeshStandardMaterial({ color: '#1a2438', metalness: 0.5, roughness: 0.5 });
    for (const sx of [-1.45, 1.45]) {
      const up = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.3, 0.6), frameMat); up.position.set(sx, 1.15, 0); g.add(up);
    }
    const crates = ['#8a6a2a', '#2a3a5e', '#3a5a3a'].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 }));
    for (let s = 0; s < 3; s++) {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.08, 0.6), frameMat); shelf.position.set(0, 0.5 + s * 0.78, 0); g.add(shelf);
      for (let b = 0; b < 3; b++) {
        if (Math.random() < 0.18) continue;   // a few empty slots looks real
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.46), crates[(s + b) % 3]);
        box.position.set(-1 + b, 0.5 + s * 0.78 + 0.3, 0); box.castShadow = true; g.add(box);
      }
    }
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    this.scene.add(g);
  }

  // a hard-hat worker that walks a looping path with swinging legs & arms
  _worker(path, color = '#2ee6a6') {
    const g = new THREE.Group();
    const skin = new THREE.MeshStandardMaterial({ color: '#d7b48f', roughness: 0.8 });
    const suit = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.1 });
    const hat = new THREE.MeshStandardMaterial({ color: '#ffd34d', roughness: 0.6 });
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.42, 4, 8), suit); torso.position.y = 1.02; g.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), skin); head.position.y = 1.46; g.add(head);
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), hat); helmet.position.y = 1.5; g.add(helmet);
    const limb = (lx, ly, len) => {
      const grp = new THREE.Group(); grp.position.set(lx, ly, 0);
      const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, len, 4, 6), suit); m.position.y = -(len / 2 + 0.07); m.castShadow = true; grp.add(m);
      g.add(grp); return grp;
    };
    const legL = limb(-0.09, 0.74, 0.5), legR = limb(0.09, 0.74, 0.5);
    const armL = limb(-0.26, 1.22, 0.42), armR = limb(0.26, 1.22, 0.42);
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    g.position.copy(path[0]);
    this.scene.add(g);
    this.workers.push({ grp: g, path, idx: 0, t: Math.random() * 6, legs: [legL, legR], arms: [armL, armR], speed: 0.8 + Math.random() * 0.7 });
  }

  // an automated guided cart hauling a crate around a loop, amber beacon flashing
  _agv(path) {
    const g = new THREE.Group();
    const cart = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.3, 0.7),
      new THREE.MeshStandardMaterial({ color: '#ffd34d', metalness: 0.4, roughness: 0.5 })); cart.position.y = 0.22; g.add(cart);
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.55, 0.5),
      new THREE.MeshStandardMaterial({ color: '#8a6a2a', roughness: 0.85 })); box.position.y = 0.65; g.add(box);
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8),
      new THREE.MeshStandardMaterial({ color: '#0c1322', emissive: '#ff7a33', emissiveIntensity: 1 })); beacon.position.set(0.4, 0.5, 0); g.add(beacon);
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    g.position.copy(path[0]);
    this.scene.add(g);
    this.agvs.push({ grp: g, path, idx: 0, speed: 1.6, beacon });
  }

  // advance an entity along its looping waypoint path; returns the heading
  _follow(e, dt, speed) {
    const tmp = this._tmpV;
    const target = e.path[(e.idx + 1) % e.path.length];
    tmp.copy(target).sub(e.grp.position); tmp.y = 0;
    const dist = tmp.length();
    if (dist < 0.08) { e.idx = (e.idx + 1) % e.path.length; return; }
    tmp.normalize();
    e.grp.position.addScaledVector(tmp, Math.min(dist, speed * dt));
    e.grp.rotation.y = Math.atan2(tmp.x, tmp.z);
  }

  // ---- a typed plant scene (nuclear / geothermal / solar) via plants.js ----
  buildPlantScene(type) {
    // large outdoor-ish ground + grid (lights already added in the constructor)
    const ground = new THREE.Mesh(new THREE.BoxGeometry(46, 0.3, 46),
      new THREE.MeshStandardMaterial({ color: '#0e1424', roughness: 0.95, metalness: 0.05 }));
    ground.position.y = -0.16; ground.receiveShadow = true; this.scene.add(ground);
    const grid = new THREE.GridHelper(46, 46, 0x2b3b66, 0x172033); grid.position.y = 0.02; this.scene.add(grid);

    this._sinks = makeSinks();
    buildPlant(this.scene, type, this._sinks);

    const reach = this._sinks.bounds || 18;
    this.target.set(0, 1.3, -1);
    this.orbit = { radius: reach * 1.15, theta: Math.PI * 0.16, phi: Math.PI * 0.40 };
    this._applyCam();
  }

  // ---- render the actual designed structure (Studio components) ----------
  buildLayout(components, bounds) {
    const STYLE = {
      room: { color: '#16223c', base: true }, land: { color: '#10231c', base: true },
      rack: { color: '#10182a', h: 2.0, w: 0.7, d: 1.0, glow: '#19c6ff' },
      crac: { color: '#16223c', h: 2.0, w: 1.0, d: 1.0, glow: '#7fdfff' },
      chiller: { color: '#1a2742', h: 1.6, w: 1.4, d: 1.2, glow: '#2f6df0' },
      compressor: { color: '#2a3a5e', h: 1.2, w: 0.9, d: 0.9, glow: '#ffd34d' },
      cooler: { color: '#13314a', h: 1.0, w: 0.9, d: 0.9, glow: '#19c6ff' },
      fan: { color: '#16223c', h: 0.8, w: 0.8, d: 0.8, glow: '#7fdfff' },
      ac: { color: '#13314a', h: 0.8, w: 1.0, d: 0.6, glow: '#2ee6a6' },
      motor: { color: '#2a3a5e', h: 1.0, w: 0.8, d: 0.8, glow: '#ffd34d' },
      pump: { color: '#21304e', h: 0.9, w: 0.8, d: 0.8, glow: '#19c6ff' },
      cnc: { color: '#1a2438', h: 1.4, w: 1.0, d: 1.0, glow: '#ff7a59' },
      conveyor: { color: '#161f33', h: 0.4, w: 1.6, d: 0.6 },
      temp: { color: '#2ee6a6', h: 0.35, w: 0.28, d: 0.28, sensor: true },
      vib: { color: '#ffd34d', h: 0.35, w: 0.28, d: 0.28, sensor: true },
      flow: { color: '#19c6ff', h: 0.35, w: 0.28, d: 0.28, sensor: true },
      hum: { color: '#7fdfff', h: 0.35, w: 0.28, d: 0.28, sensor: true },
      door: { color: '#0e1626', h: 0.6, w: 0.2, d: 1.0 },
    };
    const bw = (bounds && bounds.w) || 800, bh = (bounds && bounds.h) || 560;
    const scale = 16 / Math.max(bw, bh);
    // ground
    const fw = bw * scale + 3, fd = bh * scale + 3;
    const floor = new THREE.Mesh(new THREE.BoxGeometry(fw, 0.3, fd),
      new THREE.MeshStandardMaterial({ color: '#0e1424', roughness: .95 }));
    floor.position.y = -0.15; floor.receiveShadow = true; this.scene.add(floor);
    const grid = new THREE.GridHelper(Math.max(fw, fd), Math.round(Math.max(fw, fd)), 0x2b3b66, 0x172033);
    grid.position.y = 0.02; this.scene.add(grid);

    // overhead light truss for a "real building" feel, scaled to the layout
    const span = Math.max(fw, fd);
    const barMat = new THREE.MeshStandardMaterial({ color: '#0a0f18', emissive: '#bcd4ff', emissiveIntensity: 0.6 });
    const bars = Math.max(2, Math.round(span / 4));
    for (let i = 0; i < bars; i++) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(span * 0.6, 0.08, 0.3), barMat);
      bar.position.set(0, span * 0.45, -span / 2 + (i + 0.5) * (span / bars)); this.scene.add(bar);
    }

    const cx = bw / 2, cz = bh / 2;
    for (const c of (components || [])) {
      const st = STYLE[c.t]; if (!st) continue;
      const w0 = c.w || 90, h0 = c.h || 70;
      const X = (c.x + w0 / 2 - cx) * scale;
      const Z = (c.y + h0 / 2 - cz) * scale;
      if (st.base) {
        const slab = new THREE.Mesh(new THREE.BoxGeometry(w0 * scale, 0.12, h0 * scale),
          new THREE.MeshStandardMaterial({ color: st.color, emissive: st.color, emissiveIntensity: 0.15 }));
        slab.position.set(X, 0.07, Z); slab.receiveShadow = true; this.scene.add(slab);
        continue;
      }
      const w = st.w || 0.8, d = st.d || 0.9, h = st.h || 1;
      const mat = new THREE.MeshStandardMaterial({
        color: st.color, metalness: 0.5, roughness: 0.5,
        emissive: new THREE.Color(st.glow || '#000000'), emissiveIntensity: st.glow ? 0.5 : 0,
      });
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(X, h / 2 + 0.06, Z); m.castShadow = true; this.scene.add(m);
      this.layoutMeshes.push({ m, sensor: !!st.sensor, glow: !!st.glow, phase: Math.random() * 6 });
    }
    // frame the whole layout
    const reach = Math.max(fw, fd);
    this.target.set(0, 0.8, 0);
    this.orbit.radius = Math.max(8, reach * 0.95);
    this._applyCam();
  }

  _machine() {
    const steel = new THREE.MeshStandardMaterial({ color: '#9aa8c4', metalness: .7, roughness: .32 });
    const body = new THREE.MeshStandardMaterial({ color: '#33466e', metalness: .6, roughness: .4, emissive: '#0c1830', emissiveIntensity: 0.5 });
    const dark = new THREE.MeshStandardMaterial({ color: '#162039', metalness: .5, roughness: .5 });

    // plinth / base
    const base = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.5, 2.2), dark);
    base.position.y = 0.25; base.castShadow = true; base.receiveShadow = true; this.scene.add(base);

    // motor body (cylinder, axis along X)
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 2.2, 32), body);
    motor.rotation.z = Math.PI / 2; motor.position.set(-0.7, 1.3, 0); motor.castShadow = true;
    this.scene.add(motor);
    // cooling fins (rings)
    for (let i = -3; i <= 3; i++) {
      const fin = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.05, 8, 28), steel);
      fin.position.set(-0.7 + i * 0.26, 1.3, 0); fin.rotation.y = Math.PI / 2; this.scene.add(fin);
    }
    // heat glow ring (emissive) — intensity driven by load
    this.heatRing = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.09, 10, 30),
      new THREE.MeshStandardMaterial({ color: '#220', emissive: '#ff5a2a', emissiveIntensity: 0.4 }));
    this.heatRing.position.set(0.45, 1.3, 0); this.heatRing.rotation.y = Math.PI / 2; this.scene.add(this.heatRing);

    // rotating group: shaft + fan + impeller
    this.rotor = new THREE.Group(); this.scene.add(this.rotor);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 3.4, 20), steel);
    shaft.rotation.z = Math.PI / 2; shaft.position.set(0.9, 1.3, 0); this.rotor.add(shaft);
    // fan disc + blades at the right end
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 20), dark);
    hub.rotation.z = Math.PI / 2; hub.position.set(2.5, 1.3, 0); this.rotor.add(hub);
    for (let i = 0; i < 6; i++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.7, 0.22), steel);
      const a = (i / 6) * Math.PI * 2;
      blade.position.set(2.5, 1.3 + Math.cos(a) * 0.45, Math.sin(a) * 0.45);
      blade.rotation.x = a; blade.rotation.z = 0.3; this.rotor.add(blade);
    }
    // coupling guard (static)
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.9, 0.9), dark);
    guard.position.set(0.0, 1.3, 0); this.scene.add(guard);

    // control box on the plinth
    const ctl = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, 0.4), body);
    ctl.position.set(-1.9, 0.95, 0.7); ctl.castShadow = true; this.scene.add(ctl);
  }

  setState({ power, speed, heat }) {
    if (power != null) this.power = power;
    if (speed != null) this.speed = speed;
    if (heat != null) this.heat = heat;
  }

  frame(dt) {
    this._t += dt;
    const rpm = this.power ? this.speed : 0;
    if (this.rotor) this.rotor.rotation.x += rpm * dt * 14;

    // spinning station tool heads
    for (const r of this.rotors) r.grp.rotation.y += rpm * dt * r.rate;
    // conveyors: rollers spin, parts ride the belts
    for (const set of this.rollerSets) for (const r of set) r.rotation.y += rpm * dt * 6;
    for (const p of this.convParts) {
      p.mesh.position.x += rpm * dt * 1.4;
      if (p.mesh.position.x > p.max) p.mesh.position.x = p.min;
    }
    // robot arms working
    for (const a of this.arms) {
      const w = this._t * (0.5 + rpm) * 1.3 + a.phase;
      a.base.rotation.y = Math.sin(w) * 0.6;
      a.upper.rotation.x = Math.sin(w + 1) * 0.5;
    }
    // workers walking the aisles (legs/arms swing only while the plant runs)
    for (const wk of this.workers) {
      const sp = this.power ? wk.speed : 0;
      this._follow(wk, dt, sp);
      wk.t += dt * (sp > 0 ? 1 : 0) * 7;
      const s = Math.sin(wk.t) * 0.55;
      wk.legs[0].rotation.x = s; wk.legs[1].rotation.x = -s;
      wk.arms[0].rotation.x = -s; wk.arms[1].rotation.x = s;
    }
    // AGV carts hauling crates, beacon flashing
    for (const v of this.agvs) {
      this._follow(v, dt, this.power ? v.speed : 0);
      v.beacon.material.emissiveIntensity = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(this._t * 10));
    }
    if (this.heatRing) {
      const h = Math.max(0, Math.min(1, this.heat));
      this.heatRing.material.emissiveIntensity = (this.power ? 0.3 + h * 1.8 : 0.15);
      this.heatRing.material.emissive.set('#ff5a2a').lerp(new THREE.Color('#ff2030'), h);
    }
    // typed plant scenes (nuclear/geothermal/solar) animate via the shared lib
    if (this._sinks) animatePlant(this._sinks, dt, this._t, this.power);

    // animate the structure: glowing equipment pulses with activity, sensors blink
    for (const it of this.layoutMeshes) {
      const act = this.power ? (0.4 + this.speed * 0.9) : 0.05;
      if (it.sensor) it.m.material.emissiveIntensity = 0.4 + 0.5 * (0.5 + 0.5 * Math.sin(this._t * 3 + it.phase));
      else if (it.glow) it.m.material.emissiveIntensity = (0.2 + act * 0.8) * (0.85 + 0.15 * Math.sin(this._t * 2 + it.phase));
    }
    this.renderer.render(this.scene, this.camera);
  }
  resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight; if (!w || !h) return;
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.renderer.setSize(w, h);
  }
}
