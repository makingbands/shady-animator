// src/ui/ui-keyframe-editor.js

export class KeyframeEditor {
  constructor(canvas, uiState, redrawTimeline, scrubToTime) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.uiState = uiState;
    this.redrawTimeline = redrawTimeline;
    this.scrubToTime = scrubToTime;

    this.selected = null;
    this.dragging = false;

    canvas.addEventListener('mousedown', (e) => this._onDown(e));
    canvas.addEventListener('mousemove', (e) => this._onMove(e));
    canvas.addEventListener('mouseup', () => this._onUp());
    canvas.addEventListener('contextmenu', (e) => this._onDelete(e));
  }

  _eventX(evt) {
    const rect = this.canvas.getBoundingClientRect();
    return evt.clientX - rect.left;
  }

  _hitTest(x) {
    const kfs = this.uiState.keyframes;
    if (kfs.length < 2) return null;

    const t0 = kfs[0].time;
    const t1 = kfs[kfs.length - 1].time;
    const span = t1 - t0 || 1;

    for (let i = 0; i < kfs.length; i++) {
      const k = kfs[i];
      const kx = ((k.time - t0) / span) * this.canvas.width;

      if (Math.abs(kx - x) < 6) return i;
    }

    return null;
  }

  _onDown(evt) {
    const x = this._eventX(evt);
    const hit = this._hitTest(x);

    if (hit !== null) {
      this.selected = hit;
      this.dragging = true;

      // 🔥 Step 17 Part 5: Dispatch selection event
      window.dispatchEvent(new CustomEvent('keyframe-selected', {
        detail: { index: hit }
      }));
    }
  }

  _onMove(evt) {
    if (!this.dragging || this.selected === null) return;

    const kfs = this.uiState.keyframes;
    if (kfs.length < 2) return;

    const x = this._eventX(evt);

    const t0 = kfs[0].time;
    const t1 = kfs[kfs.length - 1].time;
    const span = t1 - t0 || 1;

    const newTime = t0 + (x / this.canvas.width) * span;

    kfs[this.selected].time = Math.max(t0, Math.min(t1, newTime));

    this.redrawTimeline();
    this.scrubToTime(kfs[this.selected].time);
  }

  _onUp() {
    this.dragging = false;
  }

  _onDelete(evt) {
    evt.preventDefault();

    const x = this._eventX(evt);
    const hit = this._hitTest(x);

    if (hit !== null) {
      this.uiState.keyframes.splice(hit, 1);
      this.selected = null;
      this.redrawTimeline();
    }
  }
}