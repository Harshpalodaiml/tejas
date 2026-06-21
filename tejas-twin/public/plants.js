// Tejas AI — shared "plant" scene library.
// Builds detailed, animated industrial twins (factory, nuclear, geothermal,
// solar) into ANY Three.js scene, and animates them. Used by both the orbit
// viewer (factory3d.js) and the first-person VR walkthrough (vr.js) so the two
// stay identical. Pure vendored Three.js, no addons.

import * as THREE from './vendor/three.module.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const std = (o) => new THREE.MeshStandardMaterial(o);
const box = (w, h, d, o) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), std(o));
const cyl = (rt, rb, h, s, o, open) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, s || 24, 1, !!open), std(o));

// ---- metadata: label, icon, blurb, sensor presets (label/unit/warn/calc) ---
export const PLANTS = {
  factory: {
    name: 'Smart Factory', icon: '🏭', kind: 'factory',
    blurb: 'A live production floor — machines, conveyors, an AGV and workers.',
    sensors: [
      { label: 'Line output', unit: 'u/min', warn: 9e9, calc: (p, s) => p ? Math.round(60 * (0.4 + s / 100) + rnd(-2, 2)) : 0 },
      { label: 'OEE', unit: '%', warn: 9e9, calc: (p, s) => p ? Math.round(72 + s / 6 + rnd(-2, 2)) : 0 },
      { label: 'Motor temp', unit: '°C', warn: 75, calc: (p, s) => p ? +(40 + s * 0.3 + rnd(-1, 1)).toFixed(1) : 26 },
      { label: 'Vibration', unit: 'mm/s', warn: 4.5, calc: (p, s) => p ? +(2.0 + s / 60 + rnd(-0.3, 0.3)).toFixed(1) : 0 },
      { label: 'Power', unit: 'kW', warn: 9e9, calc: (p, s) => p ? Math.round(120 * (0.5 + s / 200) + rnd(-4, 4)) : 6 },
      { label: 'Uptime', unit: '%', warn: 9e9, calc: (p) => p ? 99.2 : 0 },
    ],
  },
  nuclear: {
    name: 'Nuclear Plant', icon: '☢️', kind: 'nuclear',
    blurb: 'Containment domes, turbine hall and cooling towers — Tejas holds the reactor in its safe band.',
    sensors: [
      { label: 'Reactor power', unit: 'MWth', warn: 3200, calc: (p, s) => p ? Math.round(2800 * (0.5 + s / 200) + rnd(-20, 20)) : 0 },
      { label: 'Core temp', unit: '°C', warn: 330, calc: (p, s) => p ? Math.round(290 + s * 0.25 + rnd(-2, 2)) : 60 },
      { label: 'Coolant flow', unit: 'kL/s', warn: 9e9, calc: (p, s) => p ? +(18 * (0.5 + s / 200) + rnd(-0.4, 0.4)).toFixed(1) : 0 },
      { label: 'Containment', unit: 'kPa', warn: 110, calc: () => Math.round(101 + rnd(-1, 1)) },
      { label: 'Grid output', unit: 'MWe', warn: 9e9, calc: (p, s) => p ? Math.round(950 * (0.5 + s / 200) + rnd(-6, 6)) : 0 },
      { label: 'Radiation', unit: 'µSv/h', warn: 0.5, calc: (p) => +(0.08 + rnd(-0.01, 0.02)).toFixed(2) },
    ],
  },
  geothermal: {
    name: 'Geothermal Plant', icon: '🌋', kind: 'geothermal',
    blurb: 'Wellheads, steam separators and a turbine hall venting clean steam from deep heat.',
    sensors: [
      { label: 'Steam temp', unit: '°C', warn: 260, calc: (p, s) => p ? Math.round(210 + s * 0.3 + rnd(-2, 2)) : 40 },
      { label: 'Wellhead pr.', unit: 'bar', warn: 25, calc: (p, s) => p ? +(12 + s / 12 + rnd(-0.3, 0.3)).toFixed(1) : 1 },
      { label: 'Steam flow', unit: 'kg/s', warn: 9e9, calc: (p, s) => p ? Math.round(40 * (0.4 + s / 150) + rnd(-2, 2)) : 0 },
      { label: 'Turbine RPM', unit: 'rpm', warn: 9e9, calc: (p, s) => p ? Math.round(3000 * (s / 100) + rnd(-30, 30)) : 0 },
      { label: 'Grid output', unit: 'MWe', warn: 9e9, calc: (p, s) => p ? Math.round(120 * (0.4 + s / 150) + rnd(-2, 2)) : 0 },
      { label: 'Reinjection', unit: '°C', warn: 9e9, calc: (p) => p ? Math.round(75 + rnd(-2, 2)) : 30 },
    ],
  },
  solar: {
    name: 'Solar Farm', icon: '🔆', kind: 'solar',
    blurb: 'Tracking PV arrays and inverters — Tejas chases peak yield through the day.',
    sensors: [
      { label: 'DC power', unit: 'kW', warn: 9e9, calc: (p, s) => p ? Math.round(820 * (0.4 + s / 160) + rnd(-8, 8)) : 0 },
      { label: 'AC output', unit: 'kW', warn: 9e9, calc: (p, s) => p ? Math.round(780 * (0.4 + s / 160) + rnd(-8, 8)) : 0 },
      { label: 'Panel temp', unit: '°C', warn: 65, calc: (p, s) => p ? +(38 + s * 0.18 + rnd(-1, 1)).toFixed(1) : 24 },
      { label: 'Irradiance', unit: 'W/m²', warn: 9e9, calc: (p) => p ? Math.round(840 + rnd(-30, 30)) : 0 },
      { label: 'Inverter eff', unit: '%', warn: 9e9, calc: (p) => p ? +(98.1 + rnd(-0.2, 0.2)).toFixed(1) : 0 },
      { label: 'Tracker', unit: '°', warn: 9e9, calc: (p, s) => p ? Math.round((s - 50) * 0.9) : 0 },
    ],
  },
};

export function makeSinks() {
  return { racks: [], rotors: [], spinners: [], workers: [], agvs: [], convParts: [], steam: [], pulses: [], bounds: 16 };
}

// ---- shared sub-builders ---------------------------------------------------
function worker(scene, sinks, path, color) {
  const g = new THREE.Group();
  const skin = std({ color: '#d7b48f', roughness: 0.8 });
  const suit = std({ color, roughness: 0.7, metalness: 0.1 });
  const hat = std({ color: '#ffd34d', roughness: 0.6 });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.42, 4, 8), suit); torso.position.y = 1.02; g.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), skin); head.position.y = 1.46; g.add(head);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), hat); helmet.position.y = 1.5; g.add(helmet);
  const limb = (lx, ly, len) => {
    const grp = new THREE.Group(); grp.position.set(lx, ly, 0);
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, len, 4, 6), suit); m.position.y = -(len / 2 + 0.07); m.castShadow = true; grp.add(m); g.add(grp); return grp;
  };
  const legs = [limb(-0.09, 0.74, 0.5), limb(0.09, 0.74, 0.5)];
  const arms = [limb(-0.26, 1.22, 0.42), limb(0.26, 1.22, 0.42)];
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  g.position.copy(path[0]); scene.add(g);
  sinks.workers.push({ grp: g, path, idx: 0, t: Math.random() * 6, legs, arms, speed: 0.8 + Math.random() * 0.7 });
}

function agv(scene, sinks, path) {
  const g = new THREE.Group();
  const cart = box(1.0, 0.3, 0.7, { color: '#ffd34d', metalness: 0.4, roughness: 0.5 }); cart.position.y = 0.22; g.add(cart);
  const crate = box(0.6, 0.55, 0.5, { color: '#8a6a2a', roughness: 0.85 }); crate.position.y = 0.65; g.add(crate);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), std({ color: '#0c1322', emissive: '#ff7a33', emissiveIntensity: 1 })); beacon.position.set(0.4, 0.5, 0); g.add(beacon);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  g.position.copy(path[0]); scene.add(g);
  sinks.agvs.push({ grp: g, path, idx: 0, speed: 1.6, beacon });
}

function steam(scene, sinks, x, y, z, spread, color = '#cfe0ff') {
  const N = 160, pp = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { pp[i * 3] = x + rnd(-spread, spread); pp[i * 3 + 1] = y + rnd(0, 6); pp[i * 3 + 2] = z + rnd(-spread, spread); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color, size: 0.6, transparent: true, opacity: 0.22, depthWrite: false })));
  sinks.steam.push({ geo, base: y, top: y + 7 });
}

function coolingTower(scene, sinks, x, z) {
  const t = cyl(2.3, 3.3, 9, 30, { color: '#2a3142', roughness: 0.9, metalness: 0.1, side: THREE.DoubleSide }, true);
  t.position.set(x, 4.5, z); t.castShadow = true; scene.add(t);
  const rim = cyl(2.3, 2.3, 0.3, 30, { color: '#1a2030', roughness: 0.8 }, true); rim.position.set(x, 9, z); scene.add(rim);
  steam(scene, sinks, x, 9.4, z, 1.8);
}

function statusUnit(scene, sinks, g, name, baseTemp, faulted, led, extra) {
  g.userData.rack = Object.assign({ name, base: baseTemp, faulted: !!faulted, load: faulted ? 11 : rnd(5, 9), led, isMachine: true, temp: baseTemp }, extra || {});
  scene.add(g); sinks.racks.push(g);
}

function machineStation(scene, sinks, name, x, z, color, faulted) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const dark = std({ color: '#162039', metalness: 0.5, roughness: 0.5 });
  const base = box(1.8, 0.4, 1.6, { color: '#162039', metalness: 0.5, roughness: 0.5 }); base.position.y = 0.2; g.add(base);
  const body = box(1.5, 1.5, 1.4, { color, metalness: 0.6, roughness: 0.42, emissive: '#0c1830', emissiveIntensity: 0.4 }); body.position.y = 1.05; body.castShadow = true; g.add(body);
  const strip = box(1.1, 0.16, 0.05, { color: '#0c1322', emissive: '#2ee6a6', emissiveIntensity: 1 }); strip.position.set(0, 1.45, 0.71); g.add(strip);
  const rotorG = new THREE.Group(); rotorG.position.set(0, 1.9, 0); g.add(rotorG);
  const steel = std({ color: '#9aa8c4', metalness: 0.8, roughness: 0.3 });
  const tool = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.04, 0.7, 12), steel); tool.position.y = 0.35; rotorG.add(tool);
  for (let i = 0; i < 3; i++) { const spk = box(0.6, 0.06, 0.1, { color: '#9aa8c4', metalness: 0.8, roughness: 0.3 }); spk.rotation.y = (i / 3) * Math.PI * 2; rotorG.add(spk); }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  sinks.rotors.push({ grp: rotorG, rate: 8 + Math.random() * 6 });
  statusUnit(scene, sinks, g, name, faulted ? 64 : rnd(42, 52), faulted, strip);
}

function conveyor(scene, sinks, x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const frameMat = { color: '#1a2438', metalness: 0.6, roughness: 0.4 };
  const belt = box(0.9, 0.12, 3.2, { color: '#0c1320', roughness: 0.8 }); belt.position.y = 0.7; belt.castShadow = true; g.add(belt);
  for (const lz of [-1.5, 1.5]) for (const lx of [-0.45, 0.45]) { const leg = box(0.12, 0.7, 0.12, frameMat); leg.position.set(lx, 0.35, lz); g.add(leg); }
  for (let k = 0; k < 3; k++) { const p = box(0.32, 0.32, 0.32, { color: '#8a6a2a', roughness: 0.7 }); p.position.set(0, 0.93, -1.5 + k * 1.1); p.castShadow = true; g.add(p); sinks.convParts.push({ mesh: p, min: -1.5, max: 1.6, axis: 'z' }); }
  scene.add(g);
}

function shelves(scene, sinks, x, z, rot) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot;
  const frameMat = { color: '#1a2438', metalness: 0.5, roughness: 0.5 };
  for (const sx of [-1.45, 1.45]) { const up = box(0.12, 2.3, 0.6, frameMat); up.position.set(sx, 1.15, 0); g.add(up); }
  const crates = ['#8a6a2a', '#2a3a5e', '#3a5a3a'];
  for (let s = 0; s < 3; s++) {
    const shelf = box(3.1, 0.08, 0.6, frameMat); shelf.position.set(0, 0.5 + s * 0.78, 0); g.add(shelf);
    for (let b = 0; b < 3; b++) { if (Math.random() < 0.18) continue; const c = box(0.6, 0.5, 0.46, { color: crates[(s + b) % 3], roughness: 0.85 }); c.position.set(-1 + b, 0.5 + s * 0.78 + 0.3, 0); c.castShadow = true; g.add(c); }
  }
  scene.add(g);
}

function pipes(scene, x1, z1, x2, z2, y, color = '#2f6df0', r = 0.12) {
  const dx = x2 - x1, dz = z2 - z1, len = Math.hypot(dx, dz);
  const p = cyl(r, r, len, 12, { color, emissive: '#0a1420', emissiveIntensity: 0.4, metalness: 0.6, roughness: 0.35 });
  p.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
  p.rotation.z = Math.PI / 2; p.rotation.y = -Math.atan2(dz, dx);
  p.castShadow = true; scene.add(p);
}
// vertical riser pipe
function vpipe(scene, x, z, y0, y1, color = '#2f6df0', r = 0.12) {
  const p = cyl(r, r, y1 - y0, 12, { color, emissive: '#0a1420', emissiveIntensity: 0.4, metalness: 0.6, roughness: 0.35 });
  p.position.set(x, (y0 + y1) / 2, z); p.castShadow = true; scene.add(p);
}
// a run of pipe through waypoints [[x,z],...] at height y, with elbow joints
function pipeRun(scene, pts, y, color, r = 0.12) {
  for (let i = 0; i < pts.length - 1; i++) pipes(scene, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], y, color, r);
  for (const p of pts) { const e = new THREE.Mesh(new THREE.SphereGeometry(r * 1.5, 10, 8), std({ color, emissive: '#0a1420', emissiveIntensity: 0.4, metalness: 0.6, roughness: 0.35 })); e.position.set(p[0], y, p[1]); scene.add(e); }
}
// a hand-wheel valve on a pipe
function valve(scene, x, y, z, color = '#ff4d5e') {
  const body = cyl(0.16, 0.16, 0.3, 12, { color: '#3a4658', metalness: 0.6, roughness: 0.4 }); body.position.set(x, y, z); scene.add(body);
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.035, 8, 16), std({ color, metalness: 0.4, roughness: 0.5 })); wheel.position.set(x, y + 0.22, z); wheel.rotation.x = Math.PI / 2; scene.add(wheel);
}
// a round pressure gauge face
function gauge(scene, x, y, z) {
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.14, 16), std({ color: '#eef4ff', emissive: '#9fb6d8', emissiveIntensity: 0.3, roughness: 0.4 })); face.position.set(x, y, z + 0.06); scene.add(face);
}
function condenser(scene, x, z) {
  const d = cyl(0.9, 0.9, 4.5, 20, { color: '#2a3142', metalness: 0.6, roughness: 0.4 }); d.rotation.z = Math.PI / 2; d.position.set(x, 1.0, z); d.castShadow = true; scene.add(d);
  for (const e of [-2.2, 2.2]) { const cap = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 10), std({ color: '#46566e', metalness: 0.6, roughness: 0.35 })); cap.position.set(x + e, 1.0, z); cap.scale.x = 0.4; scene.add(cap); }
}
function generator(scene, x, z) {
  const g = box(2.4, 1.4, 1.4, { color: '#33466e', metalness: 0.6, roughness: 0.4, emissive: '#0c1830', emissiveIntensity: 0.4 }); g.position.set(x, 0.8, z); g.castShadow = true; scene.add(g);
  const led = box(1.8, 0.12, 0.05, { color: '#0c1322', emissive: '#2ee6a6', emissiveIntensity: 1 }); led.position.set(x, 1.3, z + 0.71); scene.add(led);
}
function transformer(scene, x, z) {
  const t = box(1.2, 1.6, 1.2, { color: '#3a4658', metalness: 0.6, roughness: 0.5 }); t.position.set(x, 0.9, z); t.castShadow = true; scene.add(t);
  for (const bx of [-0.3, 0, 0.3]) { const bush = cyl(0.08, 0.08, 0.6, 10, { color: '#cfd8e6', metalness: 0.3, roughness: 0.4 }); bush.position.set(x + bx, 1.9, z); scene.add(bush); }
  for (const f of [-1, 1]) { const fin = box(0.06, 1.2, 0.9, { color: '#2a3142', metalness: 0.6, roughness: 0.5 }); fin.position.set(x + f * 0.66, 0.9, z); scene.add(fin); }
}

// ---- the four plant builders ----------------------------------------------
function buildFactory(scene, sinks) {
  const colors = ['#33466e', '#2a4a5e', '#3a3a6e', '#2a5a4a', '#4a3a5e'];
  let id = 1;
  for (const z of [-12, -8, -4, 0, 4, 8]) {
    machineStation(scene, sinks, 'M-' + (id++), -5.2, z, colors[id % 5], false);
    const fault = (z === -4);
    machineStation(scene, sinks, fault ? 'PRESS-7' : 'M-' + (id++), 5.2, z, colors[id % 5], fault);
  }
  conveyor(scene, sinks, -8, -2); conveyor(scene, sinks, -8, 5); conveyor(scene, sinks, 8, -2); conveyor(scene, sinks, 8, 5);
  shelves(scene, sinks, -3.2, -14.3, 0); shelves(scene, sinks, 3.2, -14.3, 0);
  const P = (x, z) => new THREE.Vector3(x, 0, z);
  worker(scene, sinks, [P(-1.6, 14), P(-1.6, -12), P(1.6, -12), P(1.6, 14)], '#2ee6a6');
  worker(scene, sinks, [P(-8, 12), P(-8, -12)], '#19c6ff');
  worker(scene, sinks, [P(8, -12), P(8, 12)], '#ffd34d');
  worker(scene, sinks, [P(-6.5, 6), P(6.5, 6), P(6.5, -6), P(-6.5, -6)], '#ff7a59');
  agv(scene, sinks, [P(-9, 15), P(9, 15), P(9, -13), P(-9, -13)]);
  sinks.bounds = 16;
}

function reactorBuilding(scene, sinks, x, z, name) {
  const wall = cyl(3, 3.2, 5, 30, { color: '#3a4256', roughness: 0.7, metalness: 0.2 }); wall.position.set(x, 2.5, z); wall.castShadow = true; scene.add(wall);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(3, 30, 16, 0, Math.PI * 2, 0, Math.PI / 2), std({ color: '#465070', roughness: 0.65, metalness: 0.25 })); dome.position.set(x, 5, z); dome.castShadow = true; scene.add(dome);
  // glowing core (pickable + pulsing)
  const core = cyl(0.85, 0.85, 3.2, 18, { color: '#0c1322', emissive: '#19c6ff', emissiveIntensity: 1.4 }); core.position.set(x, 2.4, z);
  const g = new THREE.Group(); g.position.set(x, 0, z); const coreLocal = core.clone(); coreLocal.position.set(0, 2.4, 0); g.add(coreLocal); scene.add(g);
  sinks.pulses.push(coreLocal.material);
  statusUnit(scene, sinks, g, name, 290, false, null, { load: 950 });
}

function turbineHall(scene, sinks, x, z, w) {
  const hall = box(w, 4, 5, { color: '#1a2438', metalness: 0.4, roughness: 0.6 }); hall.position.set(x, 2, z); hall.castShadow = true; scene.add(hall);
  // exposed spinning turbine rotors along the hall
  for (let i = -1; i <= 1; i++) {
    const tg = new THREE.Group(); tg.position.set(x + i * (w / 3.2), 2, z + 3.2);
    const drum = cyl(0.6, 0.6, 1.6, 18, { color: '#9aa8c4', metalness: 0.85, roughness: 0.25 }); drum.rotation.x = Math.PI / 2; tg.add(drum);
    for (let b = 0; b < 8; b++) { const bl = box(0.08, 1.3, 0.18, { color: '#7c8aa6', metalness: 0.8, roughness: 0.3 }); const a = (b / 8) * Math.PI * 2; bl.position.set(0, Math.cos(a) * 0.0, Math.sin(a) * 0.0); bl.rotation.z = a; tg.add(bl); }
    tg.traverse(o => { if (o.isMesh) o.castShadow = true; });
    scene.add(tg); sinks.spinners.push({ grp: tg, axis: 'z', rate: 7 });
  }
}

function buildNuclear(scene, sinks) {
  reactorBuilding(scene, sinks, -6, -7, 'REACTOR-1');
  reactorBuilding(scene, sinks, 0, -9, 'REACTOR-2');
  turbineHall(scene, sinks, 4, 2, 8);
  coolingTower(scene, sinks, 10, -6); coolingTower(scene, sinks, -11, 2);
  // switchyard pylons
  for (let i = 0; i < 3; i++) { const py = box(0.2, 5, 0.2, { color: '#3a4256', metalness: 0.6, roughness: 0.5 }); py.position.set(-9 + i * 1.6, 2.5, 11); scene.add(py); }
  pipes(scene, -6, -7, 4, 0, 1, '#2f6df0'); pipes(scene, 0, -9, 4, 0, 1.3, '#2f6df0');
  const P = (x, z) => new THREE.Vector3(x, 0, z);
  worker(scene, sinks, [P(-2, 12), P(-2, -2), P(6, -2), P(6, 12)], '#2ee6a6');
  worker(scene, sinks, [P(8, 10), P(8, -4)], '#19c6ff');
  worker(scene, sinks, [P(-8, 8), P(2, 8)], '#ffd34d');
  agv(scene, sinks, [P(-9, 13), P(9, 13), P(9, 6), P(-9, 6)]);
  sinks.bounds = 20;
}

function separator(scene, sinks, x, z, name, faulted) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const tank = cyl(0.9, 0.9, 3.4, 20, { color: '#3a4658', metalness: 0.6, roughness: 0.4 }); tank.position.y = 1.7; tank.castShadow = true; g.add(tank);
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.9, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), std({ color: '#46566e', metalness: 0.6, roughness: 0.35 })); top.position.y = 3.4; g.add(top);
  const led = box(0.5, 0.14, 0.05, { color: '#0c1322', emissive: faulted ? '#ff3344' : '#2ee6a6', emissiveIntensity: 1 }); led.position.set(0, 2.4, 0.92); g.add(led);
  statusUnit(scene, sinks, g, name, faulted ? 250 : rnd(200, 225), faulted, led, { load: rnd(20, 40) });
  steam(scene, sinks, x, 3.6, z, 0.7);
}

function buildGeothermal(scene, sinks) {
  // ---- colour code: hot two-phase brine (orange), dry steam (light), condensate (blue) ----
  const HOT = '#ff7a33', STEAM = '#cfe0ff', COND = '#2f6df0', NCG = '#7c8aa6';

  // 1) PRODUCTION WELLS (back line) — wellhead + master valve + riser
  const wells = [-11, -7, -3, 1];
  for (const x of wells) {
    const cellar = cyl(0.7, 0.8, 0.5, 14, { color: '#1a2030', metalness: 0.5, roughness: 0.7 }); cellar.position.set(x, 0.25, -15); scene.add(cellar);
    const wh = cyl(0.32, 0.38, 1.6, 12, { color: '#2a3142', metalness: 0.6, roughness: 0.5 }); wh.position.set(x, 1.1, -15); wh.castShadow = true; scene.add(wh);
    valve(scene, x, 1.8, -14.6, '#ff4d5e');
    gauge(scene, x + 0.45, 1.5, -14.55);
    // two-phase riser up and over to the separator
    vpipe(scene, x, -15, 0.4, 2.4, HOT, 0.13);
    pipeRun(scene, [[x, -15], [x, -11.5]], 2.4, HOT, 0.13);
  }

  // 2) CYCLONE SEPARATORS (steam/brine split)
  let id = 1;
  const seps = [-11, -7, -3, 1];
  for (const x of seps) separator(scene, sinks, x, -11.5, 'SEP-' + (id++), x === -7);

  // 3) STEAM HEADER — collects dry steam from every separator → turbine inlet
  for (const x of seps) vpipe(scene, x, -11.0, 2.4, 3.6, STEAM, 0.12);
  pipeRun(scene, [[-11, -11], [1, -11], [4, -11], [4, -5]], 3.6, STEAM, 0.18);  // main steam header
  pipeRun(scene, [[4, -5], [5, -5], [5, -3.5]], 3.6, STEAM, 0.18);
  for (const x of [-9, -5, 0]) valve(scene, x, 3.6, -11, '#19c6ff');

  // 4) TURBINE HALL + GENERATOR + STEP-UP TRANSFORMER + SWITCHYARD
  turbineHall(scene, sinks, 5, -2, 9);
  generator(scene, 9.5, -2);
  transformer(scene, 11.5, 2);
  pipes(scene, 10.6, -2, 11.5, 1, 1.0, NCG, 0.08);                 // gen → transformer bus (symbolic)
  for (let i = 0; i < 3; i++) { const py = box(0.18, 5, 0.18, { color: '#3a4256', metalness: 0.6, roughness: 0.5 }); py.position.set(9 + i * 1.5, 2.5, 6); scene.add(py); }
  pipeRun(scene, [[11.5, 3.2], [11.5, 6], [10.5, 6]], 4.6, NCG, 0.06);

  // 5) EXHAUST STEAM → CONDENSER → COOLING TOWERS
  condenser(scene, 5, 1.6);
  pipeRun(scene, [[5, -0.5], [5, 0.8]], 2.6, STEAM, 0.2);          // turbine exhaust down to condenser
  coolingTower(scene, sinks, 11, 7); coolingTower(scene, sinks, 1, 9);
  pipeRun(scene, [[7, 1.6], [11, 1.6], [11, 5.5]], 1.4, COND, 0.14);  // condenser → cooling tower
  pipeRun(scene, [[3, 1.6], [1, 1.6], [1, 7.5]], 1.4, COND, 0.14);

  // 6) CONDENSATE / BRINE → REINJECTION PUMPS → REINJECTION WELLS (the closed loop)
  const pumpA = box(1.0, 0.7, 0.7, { color: '#21304e', metalness: 0.6, roughness: 0.4 }); pumpA.position.set(-6, 0.5, 4); pumpA.castShadow = true; scene.add(pumpA);
  const pumpB = box(1.0, 0.7, 0.7, { color: '#21304e', metalness: 0.6, roughness: 0.4 }); pumpB.position.set(-9, 0.5, 4); pumpB.castShadow = true; scene.add(pumpB);
  // brine drains from separators gather to the pumps
  pipeRun(scene, [[-11, -11.5], [-11, 4], [-9, 4]], 0.8, HOT, 0.12);
  pipeRun(scene, [[-3, -11.5], [-6, -11.5], [-6, 4]], 0.6, HOT, 0.12);
  // condensate pond + line into the pumps
  const pond = new THREE.Mesh(new THREE.PlaneGeometry(5, 3), std({ color: '#0c2a3a', emissive: '#19c6ff', emissiveIntensity: 0.18, roughness: 0.2, metalness: 0.4 })); pond.rotation.x = -Math.PI / 2; pond.position.set(-9, 0.05, 8); scene.add(pond);
  pipeRun(scene, [[-9, 6.5], [-9, 4.6]], 0.5, COND, 0.12);
  // reinjection line out to two reinjection wells
  pipeRun(scene, [[-6, 4], [-1, 4], [-1, 12], [6, 12]], 0.7, COND, 0.14);
  for (const rx of [-1, 6]) { const rw = cyl(0.32, 0.38, 1.4, 12, { color: '#2a3142', metalness: 0.6, roughness: 0.5 }); rw.position.set(rx, 0.9, 12); rw.castShadow = true; scene.add(rw); valve(scene, rx, 1.5, 12.4, '#19c6ff'); vpipe(scene, rx, 12, 0.2, 0.7, COND, 0.12); }
  for (const v of [[-3, 0.8, 4], [-1, 0.7, 8]]) valve(scene, v[0], v[1], v[2], '#ff4d5e');

  const P = (x, z) => new THREE.Vector3(x, 0, z);
  worker(scene, sinks, [P(-2, 13), P(-2, -5), P(3, -5), P(3, 13)], '#2ee6a6');
  worker(scene, sinks, [P(-10, 11), P(-10, -6)], '#ffd34d');
  worker(scene, sinks, [P(8, 11), P(8, -3)], '#19c6ff');
  worker(scene, sinks, [P(-6, 6), P(2, 6)], '#ff7a59');
  agv(scene, sinks, [P(-11, 14), P(11, 14), P(11, -1), P(-11, -1)]);
  sinks.bounds = 22;
}

function buildSolar(scene, sinks) {
  // rows of tracking PV arrays (the whole row tilts = a "spinner" on x)
  const panelMat = { color: '#0a1830', emissive: '#1b3a6b', emissiveIntensity: 0.5, metalness: 0.3, roughness: 0.4 };
  let id = 1;
  for (let r = 0; r < 5; r++) {
    const z = -10 + r * 4;
    for (let cstart = 0; cstart < 3; cstart++) {
      const row = new THREE.Group(); row.position.set(-7 + cstart * 6, 0.9, z);
      const panel = box(5.4, 0.08, 2.2, panelMat); panel.castShadow = true; row.add(panel);
      const post = box(0.12, 1.8, 0.12, { color: '#2a3142', metalness: 0.6, roughness: 0.5 }); post.position.y = -0.9; row.add(post);
      row.rotation.x = -0.5;
      scene.add(row);
      sinks.spinners.push({ grp: row, axis: 'x', rate: 0, track: true });   // tilts with tracker, see animate
      if (cstart === 1 && r % 2 === 0) statusUnit(scene, sinks, row, 'ARRAY-' + (id++), 38, false, null, { load: rnd(60, 90), solar: true });
    }
  }
  // inverter stations + sun glow
  for (const x of [-9, 9]) { const inv = box(1.0, 1.6, 0.8, { color: '#16223c', emissive: '#2ee6a6', emissiveIntensity: 0.3, metalness: 0.5, roughness: 0.5 }); inv.position.set(x, 0.8, 11); inv.castShadow = true; scene.add(inv); }
  const sun = new THREE.Mesh(new THREE.SphereGeometry(2, 20, 16), std({ color: '#fff2c8', emissive: '#ffd060', emissiveIntensity: 1.2 })); sun.position.set(14, 16, -14); scene.add(sun);
  const P = (x, z) => new THREE.Vector3(x, 0, z);
  worker(scene, sinks, [P(-11, 12), P(11, 12)], '#2ee6a6');
  worker(scene, sinks, [P(0, 12), P(0, -11)], '#ffd34d');
  agv(scene, sinks, [P(-11, 13), P(11, 13), P(11, -12), P(-11, -12)]);
  sinks.bounds = 20;
}

const BUILDERS = { factory: buildFactory, nuclear: buildNuclear, geothermal: buildGeothermal, solar: buildSolar };

export function buildPlant(scene, type, sinks) {
  (BUILDERS[type] || buildFactory)(scene, sinks);
  return sinks;
}

// ---- one animation step for everything a plant contains --------------------
const _tmp = new THREE.Vector3();
function follow(e, dt, speed) {
  const target = e.path[(e.idx + 1) % e.path.length];
  _tmp.copy(target).sub(e.grp.position); _tmp.y = 0;
  const dist = _tmp.length();
  if (dist < 0.08) { e.idx = (e.idx + 1) % e.path.length; return; }
  _tmp.normalize(); e.grp.position.addScaledVector(_tmp, Math.min(dist, speed * dt));
  e.grp.rotation.y = Math.atan2(_tmp.x, _tmp.z);
}

export function animatePlant(sinks, dt, t, power) {
  const rpm = power ? 1 : 0;
  for (const r of sinks.rotors) r.grp.rotation.y += dt * r.rate * rpm;
  for (const s of sinks.spinners) {
    if (s.track) { s.grp.rotation.x = -0.5 + Math.sin(t * 0.15) * 0.5; }   // solar trackers sweep
    else s.grp.rotation[s.axis] += dt * s.rate * rpm;
  }
  for (const p of sinks.convParts) { p.mesh.position[p.axis] += dt * 1.2 * rpm; if (p.mesh.position[p.axis] > p.max) p.mesh.position[p.axis] = p.min; }
  for (const wk of sinks.workers) {
    follow(wk, dt, power ? wk.speed : 0);
    wk.t += dt * (power ? 7 : 0); const s = Math.sin(wk.t) * 0.55;
    wk.legs[0].rotation.x = s; wk.legs[1].rotation.x = -s; wk.arms[0].rotation.x = -s; wk.arms[1].rotation.x = s;
  }
  for (const v of sinks.agvs) { follow(v, dt, power ? v.speed : 0); if (v.beacon) v.beacon.material.emissiveIntensity = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 10)); }
  for (const m of sinks.pulses) m.emissiveIntensity = power ? 1.1 + 0.4 * Math.sin(t * 3) : 0.3;
  for (const st of sinks.steam) {
    const pa = st.geo.attributes.position.array;
    const rise = power ? dt * 1.4 : dt * 0.2;
    for (let i = 1; i < pa.length; i += 3) { pa[i] += rise; if (pa[i] > st.top) pa[i] = st.base; }
    st.geo.attributes.position.needsUpdate = true;
  }
  // status lights on pickable machines
  for (const g of sinks.racks) {
    const rk = g.userData.rack; if (!rk) continue;
    rk.temp = rk.base + Math.sin(t * 0.5 + g.position.x) * (power ? 1.2 : 0.2) + (rk.faulted && power ? 8 : 0);
    if (rk.led) {
      rk.led.material.emissive.set(rk.faulted ? '#ff3344' : (power ? '#2ee6a6' : '#3a4658'));
      rk.led.material.emissiveIntensity = rk.faulted ? 0.8 + 0.6 * Math.sin(t * 6) : (power ? 0.9 : 0.3);
    }
  }
}
