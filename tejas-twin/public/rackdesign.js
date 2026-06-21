// Tejas AI — the "proper design" exploded model.
// Builds a small, self-contained Three.js view of a component's internal parts,
// explodes them apart with labels, emphasises the parts that belong to the
// active aspect lens, and (in edit mode) lets the operator drag the faulted
// part back into its correct slot. Snapping it marks that fault resolved.
//
// No Three.js addons — uses the Raycaster + a drag plane (per the codebase note:
// never pull in TransformControls).

import * as THREE from './vendor/three.module.js';
import { statusColor, STATUS } from './status.js';

const PART_COLOR = '#1b2740', PART_OK = '#23304c';

export class RackDesign {
  // container: a DOM element; component: the registry record.
  constructor(container, component, { aspectKey = null, editable = false, onFixed = null } = {}) {
    this.container = container;
    this.component = component;
    this.aspectKey = aspectKey;
    this.editable = editable;
    this.onFixed = onFixed || (() => {});
    this._t = 0;
    this._raf = null;
    this._dragPart = null;

    const w = container.clientWidth || 480, h = container.clientHeight || 360;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
    this.camera.position.set(2.4, 1.8, 4.2);
    this.camera.lookAt(0, 0, 0);

    this.scene.add(new THREE.HemisphereLight('#cfe0ff', '#0b1018', 1.0));
    const key = new THREE.DirectionalLight('#ffffff', 1.1); key.position.set(3, 5, 4); this.scene.add(key);
    const rim = new THREE.PointLight('#4da3ff', 0.7, 30); rim.position.set(-3, 2, -3); this.scene.add(rim);

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this._plane = new THREE.Plane();
    this._hit = new THREE.Vector3();
    this._grab = new THREE.Vector3();

    this._build();
    if (this.editable) this._wireDrag();

    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);
    this._loop();
  }

  _openFaults() {
    const s = new Set();
    for (const f of this.component.faults || []) if (!f.done) s.add(f.partId);
    return s;
  }

  _build() {
    while (this.group.children.length) this.group.remove(this.group.children[0]);
    this.labels = [];
    this.partMeshes = [];
    const parts = this.component.design?.parts || [];
    const open = this._openFaults();
    const corrected = this.component.status === STATUS.CORRECTED;

    // translucent cabinet shell for context
    const shell = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 2.4, 1.7),
      new THREE.MeshStandardMaterial({ color: '#0c1322', transparent: true, opacity: 0.10, roughness: 0.9 }),
    );
    this.group.add(shell);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1.7, 2.4, 1.7)),
      new THREE.LineBasicMaterial({ color: '#2b3b66' }),
    );
    this.group.add(edges);

    const n = Math.max(parts.length, 1);
    const span = 2.0, step = span / n;
    parts.forEach((p, i) => {
      const y = span / 2 - step * (i + 0.5);
      const onAspect = !this.aspectKey || p.aspect === this.aspectKey;
      const faulted = open.has(p.id);
      const baseCol = corrected ? PART_OK : PART_COLOR;
      const mat = new THREE.MeshStandardMaterial({
        color: faulted ? '#3a0f14' : baseCol,
        emissive: faulted ? statusColor(STATUS.FAULT) : (corrected ? statusColor(STATUS.CORRECTED) : '#0a1322'),
        emissiveIntensity: faulted ? 0.9 : (onAspect ? 0.35 : 0.06),
        transparent: !onAspect, opacity: onAspect ? 1 : 0.28,
        roughness: 0.5, metalness: 0.35,
      });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.45, step * 0.78, 1.45), mat);

      // exploded "home" slot (slightly fanned out along Z for depth)
      const homeZ = (i % 2 ? 0.18 : -0.18);
      mesh.userData = {
        part: p, home: new THREE.Vector3(0, y, homeZ),
        faulted, onAspect, mat,
      };
      // a faulted, still-open part starts pulled OUT so it's obviously wrong
      if (faulted && this.editable) mesh.position.set(1.7, y + 0.15, 1.1);
      else mesh.position.copy(mesh.userData.home);
      this.group.add(mesh);
      this.partMeshes.push(mesh);

      // ghost target slot for the faulted part (where it should go)
      if (faulted && this.editable) {
        const ghost = new THREE.Mesh(
          new THREE.BoxGeometry(1.5, step * 0.8, 1.5),
          new THREE.MeshBasicMaterial({ color: '#19c6ff', wireframe: true, transparent: true, opacity: 0.5 }),
        );
        ghost.position.copy(mesh.userData.home);
        this.group.add(ghost);
        mesh.userData.ghost = ghost;
      }

      // floating HTML label
      const label = document.createElement('div');
      label.className = 'rd-label' + (faulted ? ' fault' : '') + (onAspect ? '' : ' dim');
      label.textContent = p.label || p.id;
      this.container.appendChild(label);
      this.labels.push({ el: label, mesh });
    });
  }

  // rebuild when status/aspect changes from the outside
  update({ aspectKey } = {}) {
    if (aspectKey !== undefined) this.aspectKey = aspectKey;
    this.labels?.forEach(l => l.el.remove());
    this._build();
  }

  _wireDrag() {
    const el = this.renderer.domElement;
    el.style.touchAction = 'none';
    const setPointer = (e) => {
      const r = el.getBoundingClientRect();
      this.pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      this.pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    };
    el.addEventListener('pointerdown', (e) => {
      setPointer(e);
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const draggables = this.partMeshes.filter(m => m.userData.faulted && m.userData.ghost);
      const hit = this.raycaster.intersectObjects(draggables, false)[0];
      if (!hit) return;
      this._dragPart = hit.object;
      el.setPointerCapture(e.pointerId);
      // drag on a plane facing the camera through the part
      const n = this.camera.getWorldDirection(new THREE.Vector3()).negate();
      this._plane.setFromNormalAndCoplanarPoint(n, this._dragPart.getWorldPosition(new THREE.Vector3()));
      this.raycaster.ray.intersectPlane(this._plane, this._grab);
      this._grabOffset = this._dragPart.position.clone()
        .sub(this.group.worldToLocal(this._grab.clone()));
      el.classList.add('grabbing');
    });
    el.addEventListener('pointermove', (e) => {
      if (!this._dragPart) return;
      setPointer(e);
      this.raycaster.setFromCamera(this.pointer, this.camera);
      if (!this.raycaster.ray.intersectPlane(this._plane, this._hit)) return;
      const local = this.group.worldToLocal(this._hit.clone()).add(this._grabOffset);
      this._dragPart.position.copy(local);
      // visual feedback as it nears the slot
      const d = this._dragPart.position.distanceTo(this._dragPart.userData.home);
      const near = d < 0.45;
      if (this._dragPart.userData.ghost)
        this._dragPart.userData.ghost.material.opacity = near ? 0.9 : 0.5;
    });
    const drop = (e) => {
      if (!this._dragPart) return;
      const part = this._dragPart; this._dragPart = null;
      el.classList.remove('grabbing');
      try { el.releasePointerCapture(e.pointerId); } catch {}
      const d = part.position.distanceTo(part.userData.home);
      if (d < 0.45) {                       // SNAP — fault corrected
        part.position.copy(part.userData.home);
        part.userData.faulted = false;
        part.userData.mat.emissive.set('#19c6ff');
        part.userData.mat.emissiveIntensity = 0.5;
        part.userData.mat.color.set(PART_OK);
        if (part.userData.ghost) { this.group.remove(part.userData.ghost); part.userData.ghost = null; }
        const lab = this.labels.find(l => l.mesh === part);
        if (lab) lab.el.classList.remove('fault'), lab.el.classList.add('fixed');
        this.onFixed(part.userData.part.id);
      }
    };
    el.addEventListener('pointerup', drop);
    el.addEventListener('pointercancel', drop);
  }

  _projectLabels() {
    const r = this.renderer.domElement;
    const w = r.clientWidth, h = r.clientHeight;
    for (const { el, mesh } of this.labels || []) {
      const p = mesh.getWorldPosition(new THREE.Vector3()).project(this.camera);
      const vis = p.z < 1;
      el.style.display = vis ? 'block' : 'none';
      el.style.left = ((p.x * 0.5 + 0.5) * w) + 'px';
      el.style.top = ((-p.y * 0.5 + 0.5) * h) + 'px';
    }
  }

  _loop() {
    this._raf = requestAnimationFrame(() => this._loop());
    this._t += 0.016;
    if (!this._dragPart) this.group.rotation.y += this.editable ? 0.0015 : 0.006;
    // pulse any still-open faulted part
    const open = this._openFaults();
    for (const m of this.partMeshes) {
      if (m.userData.faulted && open.has(m.userData.part.id))
        m.userData.mat.emissiveIntensity = 0.7 + 0.4 * Math.sin(this._t * 5);
    }
    this.renderer.render(this.scene, this.camera);
    this._projectLabels();
  }

  resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    if (!w || !h) return;
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  dispose() {
    if (this._raf) cancelAnimationFrame(this._raf);
    window.removeEventListener('resize', this._onResize);
    this.labels?.forEach(l => l.el.remove());
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
