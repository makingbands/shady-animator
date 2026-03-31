// src/ui/playback-controller.js

export class PlaybackController {
  constructor(button, getKeyframes, onFrame) {
    this.button = button;
    this.getKeyframes = getKeyframes;
    this.onFrame = onFrame;

    this.playing = false;
    this.startTime = 0;
    this.duration = 0;
    this.keyframes = [];

    this.button.addEventListener('click', () => this._toggle());
  }

  _toggle() {
    if (this.playing) {
      this.playing = false;
      return;
    }
    this.keyframes = this.getKeyframes() || [];
    if (this.keyframes.length < 2) return;

    // normalize times to start at 0
    const t0 = this.keyframes[0].time;
    this.keyframes = this.keyframes.map(k => ({ ...k, time: k.time - t0 }));
    this.duration = this.keyframes[this.keyframes.length - 1].time;

    this.playing = true;
    this.startTime = performance.now();
    this._loop();
  }

  _loop() {
    if (!this.playing) return;

    const now = performance.now();
    const elapsed = now - this.startTime;
    const t = Math.min(elapsed, this.duration);

    const frame = this._sample(t);
    if (frame) this.onFrame(frame);

    if (t >= this.duration) {
      this.playing = false;
      return;
    }

    requestAnimationFrame(() => this._loop());
  }

  _sample(t) {
    const kfs = this.keyframes;
    if (kfs.length === 0) return null;

    let a = kfs[0];
    let b = kfs[kfs.length - 1];

    for (let i = 0; i < kfs.length - 1; i++) {
      if (t >= kfs[i].time && t <= kfs[i + 1].time) {
        a = kfs[i];
        b = kfs[i + 1];
        break;
      }
    }

    const span = b.time - a.time || 1;
    const alpha = (t - a.time) / span;

    const lerp = (x, y) => x + (y - x) * alpha;

    return {
      region: a.region, // MVP: no region interpolation
      pivot: {
        x: lerp(a.pivot.x, b.pivot.x),
        y: lerp(a.pivot.y, b.pivot.y)
      },
      transform: {
        rotation: lerp(a.transform.rotation, b.transform.rotation),
        scale: lerp(a.transform.scale, b.transform.scale)
      }
    };
  }
}