// Tejas AI — tiny dependency-free canvas sparkline for the HUD (retina-aware).

export class Spark {
  constructor(canvas) {
    this.c = canvas; this.ctx = canvas.getContext('2d');
    this._resize();
    window.addEventListener('resize', () => { this._resize(); if (this._last) this.draw(this._last); });
  }
  _resize() {
    const dpr = window.devicePixelRatio || 1;
    const r = this.c.getBoundingClientRect();
    const w = r.width || this.c.clientWidth || 300;
    const h = this.c.height;
    this.c.width = w * dpr; this.c.height = h * dpr; this.c.style.height = h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.W = w; this.H = h;
  }
  // series: [{values, color, fill}]
  draw(series) {
    this._last = series;
    const { ctx } = this, W = this.W, H = this.H, pad = 4;
    ctx.clearRect(0, 0, W, H);
    let mn = Infinity, mx = -Infinity;
    for (const s of series) for (const v of s.values) { if (v < mn) mn = v; if (v > mx) mx = v; }
    if (!isFinite(mn)) return;
    const m = (mx - mn) * 0.15 || 1; mn -= m; mx += m;
    const n = Math.max(...series.map(s => s.values.length));
    const px = i => pad + (i / Math.max(1, n - 1)) * (W - pad * 2);
    const py = v => H - pad - ((v - mn) / (mx - mn)) * (H - pad * 2);
    for (const s of series) {
      ctx.beginPath();
      s.values.forEach((v, i) => { const X = px(i), Y = py(v); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
      ctx.strokeStyle = s.color; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();
      if (s.fill) {
        ctx.lineTo(px(s.values.length - 1), H - pad); ctx.lineTo(px(0), H - pad); ctx.closePath();
        ctx.fillStyle = s.fill; ctx.fill();
      }
    }
  }
}
