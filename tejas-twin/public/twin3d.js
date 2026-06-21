// Tejas AI — 3D Digital Twin scene (Three.js, vendored & offline).
// ---------------------------------------------------------------------------
// Renders the data-center hall and brings the physics to life:
//   • server racks coloured by their live inlet temperature (cool→hot)
//   • CRAC units pushing animated cold-air particles up through the racks
//   • a chiller loop along the wall
//   • a sky + sun that shift blue→orange→red as you crank the weather
//   • the faulted rack pulsing so a service issue is visible at a glance
//   • orbit camera + click-to-inspect any rack
// No Three.js addons are used (so we ship a single vendored file, fully offline).

import * as THREE from './vendor/three.module.js';
import { get as getComponent } from './components.js';
import { statusColor, overridesTemp, STATUS } from './status.js';

// --- temperature → colour ramp (inlet air) ---------------------------------
const RAMP = [
  { t: 15, c: new THREE.Color('#1e6bff') }, // deep cool blue
  { t: 20, c: new THREE.Color('#19c6ff') }, // cyan
  { t: 23, c: new THREE.Color('#2ee6a6') }, // healthy green
  { t: 26, c: new THREE.Color('#ffd34d') }, // amber (approaching limit)
  { t: 29, c: new THREE.Color('#ff7a33') }, // hot orange
  { t: 34, c: new THREE.Color('#ff3344') }, // critical red
];
function tempColor(t, out = new THREE.Color()) {
  if (t <= RAMP[0].t) return out.copy(RAMP[0].c);
  if (t >= RAMP[RAMP.length - 1].t) return out.copy(RAMP[RAMP.length - 1].c);
  for (let i = 0; i < RAMP.length - 1; i++) {
    const a = RAMP[i], b = RAMP[i + 1];
    if (t >= a.t && t <= b.t) {
      const k = (t - a.t) / (b.t - a.t);
      return out.copy(a.c).lerp(b.c, k);
    }
  }
  return out.copy(RAMP[RAMP.length - 1].c);
}

export class Twin3D {
  constructor(container, { onPick } = {}) {
    this.container = container;
    this.onPick = onPick || (() => {});
    this.rackMeshes = [];
    this.selected = null;
    this._t = 0;

    const w = container.clientWidth, h = container.clientHeight;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog('#0a1020', 26, 60);

    this.camera = new THREE.PerspectiveCamera(48, w / h, 0.1, 200);

    // ---- orbit state (custom, no addons) ----
    this.target = new THREE.Vector3(0, 1.4, 0);
    this.orbit = { radius: 19, theta: Math.PI * 0.18, phi: Math.PI * 0.36 };
    this._applyCamera();
    this._wireControls();

    this._buildSky();
    this._buildLights();
    this._buildFloor();
    this._buildChiller();
    this._buildSelectionRing();

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    // scratch objects reused every frame (no per-frame allocation in update())
    this._black = new THREE.Color('#000000');
    this._scratch = new THREE.Color();
    // cached "hot weather" target colours (lerp targets, never mutated)
    this._hot = {
      skyTop: new THREE.Color('#7a2a12'), skyBot: new THREE.Color('#3a0f10'),
      fog: new THREE.Color('#2a0f12'), sun: new THREE.Color('#ff6a2a'),
      sunLight: new THREE.Color('#ff7a3a'), air: new THREE.Color('#ffd0a0'),
    };

    window.addEventListener('resize', () => this.resize());
  }

  // -------------------------------------------------------------------------
  _applyCamera() {
    const { radius, theta, phi } = this.orbit;
    this.camera.position.set(
      this.target.x + radius * Math.sin(phi) * Math.sin(theta),
      this.target.y + radius * Math.cos(phi),
      this.target.z + radius * Math.sin(phi) * Math.cos(theta),
    );
    this.camera.lookAt(this.target);
  }

  _wireControls() {
    const el = this.renderer.domElement;
    let dragging = false, lx = 0, ly = 0, moved = 0;
    el.addEventListener('pointerdown', (e) => { dragging = true; moved = 0; lx = e.clientX; ly = e.clientY; el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
      moved += Math.abs(dx) + Math.abs(dy);
      this.orbit.theta -= dx * 0.005;
      this.orbit.phi = Math.max(0.12, Math.min(Math.PI * 0.49, this.orbit.phi - dy * 0.005));
      this._applyCamera();
    });
    el.addEventListener('pointerup', (e) => {
      dragging = false;
      try { el.releasePointerCapture(e.pointerId); } catch {}
      if (moved < 6) this._handlePick(e);   // a click, not a drag → inspect
    });
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.orbit.radius = Math.max(8, Math.min(40, this.orbit.radius + e.deltaY * 0.02));
      this._applyCamera();
    }, { passive: false });
  }

  // -------------------------------------------------------------------------
  _buildSky() {
    // gradient dome whose colours we shift with the weather
    const geo = new THREE.SphereGeometry(90, 32, 16);
    this.skyUniforms = {
      top: { value: new THREE.Color('#0a1b3a') },
      bottom: { value: new THREE.Color('#0a1020') },
    };
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: this.skyUniforms,
      vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `varying vec3 vP; uniform vec3 top; uniform vec3 bottom;
        void main(){ float h = clamp((normalize(vP).y*0.5+0.5),0.0,1.0); gl_FragColor = vec4(mix(bottom, top, pow(h,0.8)), 1.0); }`,
    });
    this.scene.add(new THREE.Mesh(geo, mat));

    // the sun — a glowing billboard; intensity/colour follow the heat
    const sunMat = new THREE.SpriteMaterial({ color: '#fff2c8', transparent: true, opacity: 0.95, depthWrite: false });
    this.sun = new THREE.Sprite(sunMat);
    this.sun.scale.set(10, 10, 1);
    this.sun.position.set(30, 26, -34);
    this.scene.add(this.sun);
  }

  _buildLights() {
    this.hemi = new THREE.HemisphereLight('#bcd4ff', '#10131c', 0.55);
    this.scene.add(this.hemi);

    this.sunLight = new THREE.DirectionalLight('#fff0d0', 1.1);
    this.sunLight.position.set(18, 22, -14);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    const d = 18; const s = this.sunLight.shadow.camera;
    s.left = -d; s.right = d; s.top = d; s.bottom = -d; s.near = 1; s.far = 70;
    this.scene.add(this.sunLight);

    // cool fill from inside the hall
    const fill = new THREE.PointLight('#3a6cff', 0.5, 40);
    fill.position.set(0, 6, 0);
    this.scene.add(fill);
  }

  _buildFloor() {
    // raised-floor slab
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(22, 0.4, 16),
      new THREE.MeshStandardMaterial({ color: '#0e1424', roughness: 0.9, metalness: 0.1 }),
    );
    floor.position.y = -0.2; floor.receiveShadow = true;
    this.scene.add(floor);

    // perforated-tile grid lines
    const grid = new THREE.GridHelper(22, 22, 0x2b3b66, 0x182238);
    grid.position.y = 0.01;
    this.scene.add(grid);

    // aisle strips (cold = blue, hot = red) painted on the floor
    const aisleZ = [-3.9, 0, 3.9];            // matches rack rows below
    const aisleCol = ['#0e3b6b', '#3a1414', '#0e3b6b'];
    aisleZ.forEach((z, i) => {
      const strip = new THREE.Mesh(
        new THREE.PlaneGeometry(16, 1.7),
        new THREE.MeshBasicMaterial({ color: aisleCol[i], transparent: true, opacity: 0.35 }),
      );
      strip.rotation.x = -Math.PI / 2; strip.position.set(0, 0.02, z);
      this.scene.add(strip);
    });
  }

  // chiller plant + pipe loop along the back wall (the heat-rejection story)
  _buildChiller() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 2.4, 2.0),
      new THREE.MeshStandardMaterial({ color: '#1a2742', roughness: 0.6, metalness: 0.4 }),
    );
    body.position.set(-8.5, 1.2, -6.4); body.castShadow = true;
    g.add(body);
    // condenser fans on top
    for (let i = -1; i <= 1; i++) {
      const fan = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 0.18, 16),
        new THREE.MeshStandardMaterial({ color: '#0c1320', metalness: 0.7, roughness: 0.4 }),
      );
      fan.position.set(-8.5 + i * 0.95, 2.5, -6.4);
      g.add(fan);
    }
    // chilled-water pipes (torus-ish run)
    const pipeMat = new THREE.MeshStandardMaterial({ color: '#2f6df0', emissive: '#0a2a6b', metalness: 0.6, roughness: 0.3 });
    const pipe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 9), pipeMat);
    pipe.position.set(-7.0, 0.5, -2.2); g.add(pipe);
    const pipe2 = pipe.clone(); pipe2.position.x = -6.7; g.add(pipe2);
    this.chiller = g;
    this.scene.add(g);
  }

  // white pulsing ring that hovers over the picked unit (status:selected)
  _buildSelectionRing() {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.85, 0.045, 12, 40),
      new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9 }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.visible = false;
    this.selRing = ring;
    this.scene.add(ring);
  }

  // -------------------------------------------------------------------------
  // Build the rack field from the twin's canonical layout.
  setRacks(layout, rows, perRow) {
    this.rackMeshes.forEach(m => this.scene.remove(m));
    this.rackMeshes = [];
    const colSpan = 1.15, rowSpan = 2.6;
    const rackGeo = new THREE.BoxGeometry(0.9, 2.0, 1.1);
    const faceGeo = new THREE.PlaneGeometry(0.78, 1.7);

    for (const r of layout) {
      const grp = new THREE.Group();
      const x = (r.col - (perRow - 1) / 2) * colSpan;
      const z = (r.row - (rows - 1) / 2) * rowSpan;
      grp.position.set(x, 1.0, z);

      // cabinet body
      const body = new THREE.Mesh(rackGeo, new THREE.MeshStandardMaterial({
        color: r.isGpu ? '#161f33' : '#10182a', roughness: 0.55, metalness: 0.5,
      }));
      body.castShadow = true; body.receiveShadow = true;
      grp.add(body);

      // glowing front face — this is what shows the temperature
      const faceMat = new THREE.MeshStandardMaterial({
        color: '#0c1322', emissive: '#19c6ff', emissiveIntensity: 0.9,
        roughness: 0.4, metalness: 0.2,
      });
      const face = new THREE.Mesh(faceGeo, faceMat);
      // racks in front rows face -z, back rows face +z (toward their cold aisle)
      const faceFront = r.row < rows / 2;
      face.position.z = faceFront ? -0.56 : 0.56;
      if (!faceFront) face.rotation.y = Math.PI;
      grp.add(face);

      // little status LED on top
      const led = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 8, 8),
        new THREE.MeshBasicMaterial({ color: '#2ee6a6' }),
      );
      led.position.set(0.3, 1.05, faceFront ? -0.5 : 0.5);
      grp.add(led);

      grp.userData = { rack: r, faceMat, body, led };
      this.scene.add(grp);
      this.rackMeshes.push(grp);
    }

    this._buildAirflow(layout, rows, perRow, colSpan, rowSpan);
  }

  // CRAC cold-air particle field rising through the cold aisles.
  _buildAirflow(layout, rows, perRow, colSpan, rowSpan) {
    const N = 900;
    const pos = new Float32Array(N * 3);
    this._airSpeed = new Float32Array(N);
    const xspan = (perRow / 2) * colSpan + 0.6;
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() * 2 - 1) * xspan;
      pos[i * 3 + 1] = Math.random() * 3.2;
      pos[i * 3 + 2] = (Math.random() < 0.5 ? -1 : 1) * (rowSpan * 1.5) * Math.random();
      this._airSpeed[i] = 0.4 + Math.random() * 0.6;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: '#7fdfff', size: 0.07, transparent: true, opacity: 0.55,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    this.airflow = new THREE.Points(geo, mat);
    this.scene.add(this.airflow);

    // CRAC units at both ends, feeding the cold aisles
    const cracMat = new THREE.MeshStandardMaterial({ color: '#16223c', metalness: 0.5, roughness: 0.5 });
    for (const sx of [-1, 1]) {
      const crac = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.2, 1.2), cracMat);
      crac.position.set(sx * (xspan + 0.9), 1.1, 0); crac.castShadow = true;
      this.scene.add(crac);
    }
  }

  // -------------------------------------------------------------------------
  // Live update — called every tick with the twin summary + side ('ai'|'base').
  update(state, side, dt) {
    this._t += dt;
    const racks = side === 'base' ? state.baseRacksData : state.aiRacksData;
    const tmp = new THREE.Color();

    // recolour racks by inlet temperature; an explicit lifecycle status
    // (fault/fixing/corrected) OVERRIDES the temperature tint.
    for (let i = 0; i < this.rackMeshes.length; i++) {
      const grp = this.rackMeshes[i];
      const rk = racks[i];
      if (!rk) continue;
      const fm = grp.userData.faceMat;
      const comp = getComponent(rk.id);
      const st = comp && comp.status;

      if (st && overridesTemp(st)) {
        // status colour wins — red (fault) pulses, blue (corrected) is steady.
        tmp.set(statusColor(st));
        fm.emissive.copy(tmp);
        const pulse = st === STATUS.FAULT ? 1 + 0.5 * Math.sin(this._t * 6) : 1;
        fm.emissiveIntensity = (st === STATUS.CORRECTED ? 1.05 : 0.95) * pulse;
        grp.userData.led.material.color.copy(tmp);
        grp.userData.body.material.emissive.copy(
          st === STATUS.FAULT ? this._scratch.copy(tmp).multiplyScalar(0.25 * pulse) : this._black);
      } else {
        // healthy → live temperature ramp (existing behaviour)
        tempColor(rk.inlet, tmp);
        fm.emissive.copy(tmp);
        const hot = Math.max(0, Math.min(1, (rk.inlet - 20) / 12));
        fm.emissiveIntensity = 0.6 + hot * 1.2;
        grp.userData.led.material.color.copy(tmp);
        grp.userData.body.material.emissive.copy(this._black);
      }
    }

    // selection ring — white, pulsing, hovering over the picked unit
    if (this.selRing) {
      const sel = this.selected != null ? this.rackMeshes[this.selected] : null;
      this.selRing.visible = !!sel;
      if (sel) {
        this.selRing.position.set(sel.position.x, 0.06, sel.position.z);
        const s = 1 + 0.06 * Math.sin(this._t * 4);
        this.selRing.scale.setScalar(s);
        this.selRing.material.opacity = 0.7 + 0.25 * Math.sin(this._t * 4);
      }
    }

    // weather: shift the sky + sun + lights with ambient temperature
    const Tamb = state.env.Tamb;
    const heat = Math.max(0, Math.min(1, (Tamb - 30) / 18));  // 30→0, 48→1
    if (this.skyUniforms) {
      this.skyUniforms.top.value.set('#0a1b3a').lerp(this._hot.skyTop, heat);
      this.skyUniforms.bottom.value.set('#0a1020').lerp(this._hot.skyBot, heat);
    }
    this.scene.fog.color.set('#0a1020').lerp(this._hot.fog, heat);
    this.sun.material.color.set('#fff2c8').lerp(this._hot.sun, heat);
    this.sun.scale.setScalar(10 + heat * 5);
    this.sunLight.intensity = 0.9 + heat * 1.4;
    this.sunLight.color.set('#fff0d0').lerp(this._hot.sunLight, heat);

    // airflow: particle speed/visibility follow the fan speed
    const fan = (side === 'base' ? state.base : state.ai).fanFrac;
    if (this.airflow) {
      const p = this.airflow.geometry.attributes.position.array;
      const N = p.length / 3;
      for (let i = 0; i < N; i++) {
        p[i * 3 + 1] += this._airSpeed[i] * fan * dt * 2.2;
        if (p[i * 3 + 1] > 3.4) { p[i * 3 + 1] = 0; }      // recycle from the floor
      }
      this.airflow.geometry.attributes.position.needsUpdate = true;
      this.airflow.material.opacity = 0.2 + fan * 0.5;
      // particle colour warms slightly with the hall
      this.airflow.material.color.set('#7fdfff').lerp(this._hot.air, heat * 0.6);
    }

    // gentle condenser-fan spin
    if (this.chiller) this.chiller.rotation.y = 0; // (fans modelled flat; keep stable)

    this.renderer.render(this.scene, this.camera);
  }

  // -------------------------------------------------------------------------
  _handlePick(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.rackMeshes, true);
    if (hits.length) {
      let g = hits[0].object;
      while (g && !g.userData.rack) g = g.parent;
      if (g) {
        const idx = this.rackMeshes.indexOf(g);
        this.selected = idx;
        this.onPick(g.userData.rack, { x: e.clientX, y: e.clientY });
      }
    } else {
      this.selected = null;
      this.onPick(null);
    }
  }

  // focus = select + ring (the caller decides what panel to open)
  focusRack(id) { this.select(id); }

  // keep the white ring on a unit without firing the pick callback
  select(id) {
    const idx = this.rackMeshes.findIndex(m => m.userData.rack.id === id);
    if (idx >= 0) this.selected = idx;
  }
  clearSelection() { this.selected = null; }

  resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    if (!w || !h) return;
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}
