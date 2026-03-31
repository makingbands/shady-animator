// src/ui/timeline-ui.js

export class TimelineUI {
  constructor(canvas, getKeyframes, onScrub) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.getKeyframes = getKeyframes;
    this.onScrub = onScrub;

    this.playhead = 0; // 0 to 1 normalized
    this.dragging = false;

    canvas.addEventListener('mousedown', (e) => this._onDown(e));
    canvas.addEventListener('mousemove', (e) => this._onMove(e));
    canvas.addEventListener('mouseup', () => this._onUp());
  }

  _onDown(evt) {
    this.dragging = true;
    this._updateFromEvent(evt);
  }

  _onMove(evt) {
    if (!this.dragging) return;
    this._updateFromEvent(evt);
  }

  _onUp() {
    this.dragging = false;
  }

  _updateFromEvent(evt) {
    const rect = this.canvas.getBoundingClientRect();
    const x = evt.clientX - rect.left;
    this.playhead = Math.max(0, Math.min(1, x / this.canvas.width));

    const kfs = this.getKeyframes();
    if (kfs.length >= 2) {
      const t = this.playhead * (kfs[kfs.length - 1].time - kfs[0].time);
      this.onScrub(t);
    }

    this.draw();
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // timeline bar
    ctx.strokeStyle = "#ccc";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, this.canvas.height / 2);
    ctx.lineTo(this.canvas.width, this.canvas.height / 2);
    ctx.stroke();

    // keyframes
    const kfs = this.getKeyframes();
    if (kfs.length > 0) {
      const t0 = kfs[0].time;
      const t1 = kfs[kfs.length - 1].time;
      const span = t1 - t0 || 1;

      ctx.fillStyle = "#00e0ff";
      for (const k of kfs) {
        const x = ((k.time - t0) / span) * this.canvas.width;
        ctx.beginPath();
        ctx.arc(x, this.canvas.height / 2, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // playhead
    ctx.strokeStyle = "#ff0066";
    const x = this.playhead * this.canvas.width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, this.canvas.height);
    ctx.stroke();
  }
}