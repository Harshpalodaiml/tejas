// Tejas AI — guided voice tour engine.
// Plays a scripted walkthrough: each step can run twin actions, spotlight a part
// of the UI, show a caption, and SPEAK the narration (browser TTS). It advances
// when the narration finishes, so the pacing feels like a live presenter.
// Fully offline — uses the Web Speech Synthesis API; degrades to timed captions.

function pickVoice() {
  if (!('speechSynthesis' in window)) return null;
  const vs = speechSynthesis.getVoices() || [];
  // prefer an Indian English voice, then any English, then default
  return vs.find(v => /en[-_]IN/i.test(v.lang))
    || vs.find(v => /en[-_]GB/i.test(v.lang) && /female|woman/i.test(v.name))
    || vs.find(v => /^en/i.test(v.lang))
    || null;
}

export class Tour {
  constructor(steps, hooks = {}) {
    this.steps = steps;
    this.h = hooks;
    this.active = false;
    this.i = -1;
    this._resolve = null;
    this._timer = null;
    // warm up voice list (some browsers populate asynchronously)
    if ('speechSynthesis' in window) speechSynthesis.getVoices();
  }

  async start() {
    if (this.active) return;
    this.active = true; this.i = -1;
    this.h.onStart && this.h.onStart();
    await this._loop();
  }

  async _loop() {
    while (this.active) {
      this.i++;
      if (this.i >= this.steps.length) return this.stop(true);
      const s = this.steps[this.i];
      this.h.onStep && this.h.onStep(this.i, this.steps.length);
      if (s.actions && this.h.onAction) this.h.onAction(s.actions);
      await this._wait(s.preDelay ?? 350);
      if (!this.active) return;
      this.h.onHighlight && this.h.onHighlight(s.target ?? null);
      this.h.onCaption && this.h.onCaption(s.caption ?? s.say);
      await this._speak(s.say);
      if (!this.active) return;
      await this._wait(s.postDelay ?? 450);
    }
  }

  _wait(ms) { return new Promise(r => { this._timer = setTimeout(r, ms); }); }

  _speak(text) {
    return new Promise((resolve) => {
      this._resolve = resolve;
      this.h.onSpeakState && this.h.onSpeakState(true);
      const done = () => {
        if (this._endTimer) { clearTimeout(this._endTimer); this._endTimer = null; }
        this.h.onSpeakState && this.h.onSpeakState(false);
        const r = this._resolve; this._resolve = null; if (r) r();
      };
      if (!('speechSynthesis' in window) || !text) {
        this._endTimer = setTimeout(done, Math.max(2200, text.length * 48));
        return;
      }
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-IN'; u.rate = 1.0; u.pitch = 1.02;
        const v = pickVoice(); if (v) u.voice = v;
        u.onend = done; u.onerror = done;
        // safety net if onend never fires (some browsers)
        this._endTimer = setTimeout(done, Math.max(5000, text.length * 95));
        speechSynthesis.speak(u);
      } catch { this._endTimer = setTimeout(done, Math.max(2200, text.length * 48)); }
    });
  }

  // advance immediately to the next step
  skip() {
    if (!this.active) return;
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    if (this._endTimer) { clearTimeout(this._endTimer); this._endTimer = null; }
    const r = this._resolve; this._resolve = null; if (r) r();
  }

  stop(finished = false) {
    if (!this.active && !finished) return;
    this.active = false;
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    if (this._timer) clearTimeout(this._timer);
    if (this._endTimer) clearTimeout(this._endTimer);
    const r = this._resolve; this._resolve = null; if (r) r();
    this.h.onStop && this.h.onStop(finished);
  }
}
