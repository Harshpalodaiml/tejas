// Tejas AI — per-component SVG schematics (circuit / airflow / controls).
// Reuses the single-line `.ol-*` CSS already in styles.css. Nodes are coloured
// by lifecycle status: a faulted node glows red, a corrected one glows blue.

import { STATUS } from './status.js';

// Which design parts are "faulted but not yet fixed" for this component.
function faultPartIds(component) {
  const open = new Set();
  for (const f of component.faults || []) if (!f.done) open.add(f.partId);
  return open;
}

// Map a node → css state suffix used to tint it (red while faulted, blue once
// the whole unit is corrected, green otherwise).
function nodeState(component, partId, open) {
  if (open.has(partId)) return 'bad';
  if (component.status === STATUS.CORRECTED) return 'ok';
  return '';
}

// Built-in schematics keyed by `schematic` string on the aspect.
// Each returns an ordered list of {id,label,sub} nodes drawn as a chain.
function chainFor(component, key) {
  const model = component.design?.model || component.id;
  switch (key) {
    case 'rack-power': return [
      { id: 'busbar', label: '48V BUSBAR', sub: 'feed' },
      { id: 'psu',    label: 'PSU ×6',     sub: '3 kW' },
      { id: 'gpu-tray-1', label: 'GPU TRAYS', sub: model },
    ];
    case 'rack-air': return [
      { id: 'crac',    label: 'CRAC-2',    sub: 'cold aisle' },
      { id: 'filter',  label: 'INTAKE',    sub: 'MERV-13' },
      { id: 'fan-tray',label: 'FAN TRAY',  sub: 'rear' },
      { id: 'stack',   label: 'IT STACK',  sub: 'exhaust' },
    ];
    case 'rack-ctl': return [
      { id: 'bms',     label: 'BMS / PLC', sub: 'setpoints' },
      { id: 'sensor',  label: 'SENSORS',   sub: 'inlet/RH' },
      { id: 'actuator',label: 'DAMPER',    sub: 'writable' },
    ];
    default: return (component.design?.parts || []).slice(0, 5)
      .map(p => ({ id: p.id, label: (p.label || p.id).toUpperCase().slice(0, 12), sub: p.aspect || '' }));
  }
}

// Returns an SVG string. `title` labels the lens.
export function draw(component, key, title = '') {
  const nodes = chainFor(component, key);
  const open = faultPartIds(component);
  const W = 700, H = 150, bw = 118, bh = 44, gap = (W - nodes.length * bw) / (nodes.length + 1);
  const cy = 54, ny = cy;

  let svg = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" class="sch-svg">`;

  // connecting lines + animated flow between consecutive nodes
  for (let i = 0; i < nodes.length - 1; i++) {
    const ax = gap * (i + 1) + bw * (i + 1);
    const bx = gap * (i + 2) + bw * (i + 1);
    svg += `<line class="ol-line" x1="${ax}" y1="${ny + bh / 2}" x2="${bx}" y2="${ny + bh / 2}"/>`;
    svg += `<line class="ol-flow" x1="${ax}" y1="${ny + bh / 2}" x2="${bx}" y2="${ny + bh / 2}"/>`;
  }

  // node boxes — faulted node tinted red, corrected blue
  nodes.forEach((n, i) => {
    const x = gap * (i + 1) + bw * i;
    const st = nodeState(component, n.id, open);
    const cls = st === 'bad' ? 'sch-bad' : st === 'ok' ? 'sch-ok' : '';
    svg += `<g transform="translate(${x},${ny})">` +
      `<rect class="ol-box ${cls}" width="${bw}" height="${bh}" rx="8"/>` +
      `<text class="ol-t" x="${bw / 2}" y="18" text-anchor="middle">${n.label}</text>` +
      `<text class="ol-v ${st === 'bad' ? 'warn' : ''}" x="${bw / 2}" y="34" text-anchor="middle">${n.sub}</text>`;
    if (st === 'bad') svg += `<text class="sch-flag" x="${bw / 2}" y="-8" text-anchor="middle">⚠ fault</text>`;
    svg += `</g>`;
  });

  if (title) svg += `<text class="sch-title" x="14" y="${H - 10}">${title}</text>`;
  svg += '</svg>';
  return svg;
}
