/**
 * resource: src/ui/transform-controller.js
 * goal: Provide rotation + scaling handles for a selected region
 * channel: ui-module
 * handoff: epoch.mm.shady-animator.v1.2.step12.transform-controller
 */

export class TransformController {
  constructor(canvas, onTransform) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onTransform = onTransform;

    this.region = null;
    this.pivot = null;

    this.rotation = 0;
    this.scale = 1;

    this.dragging = null; // "rotate" | "scale" | null

    canvas.addEventListener('mousedown', (e) => this._onDown(e));
    canvas.addEventListener('mousemove', (e) => this._onMove(e));
    canvas.addEventListener('mouseup', () => this._onUp());
  }

  setRegion(region) {
    this.region = region;
    this._draw();
  }

  setPivot(pivot) {
    this.pivot = pivot;
    this._draw();
  }

  _getPos(evt) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
  }

  _onDown(evt) {
    if (!this.region || !this.pivot) return;

    const pos = this._getPos(evt);

    // Rotation handle: small circle above pivot
    const rotHandle = {
      x: this.pivot.x,
      y: this.pivot.y - 40
    };

    const distRot = Math.hypot(pos.x - rotHandle.x, pos.y - rotHandle.y);
    if (distRot < 10) {
      this.dragging = "rotate";
      return;
    }

    // Scale handle: small circle to the right of pivot
    const scaleHandle = {
      x: this.pivot.x + 40,
      y: this.pivot.y
    };

    const distScale = Math.hypot(pos.x - scaleHandle.x, pos.y - scaleHandle.y);
    if (distScale < 10) {
      this.dragging = "scale";
      return;
    }
  }

  _onMove(evt) {
    if (!this.dragging) return;

    const pos = this._getPos(evt);

    if (this.dragging === "rotate") {
      const dx = pos.x - this.pivot.x;
      const dy = pos.y - this.pivot.y;
      this.rotation = Math.atan2(dy, dx);
    }

    if (this.dragging === "scale") {
      const dx = pos.x - this.pivot.x;
      const dy = pos.y - this.pivot.y;
      this.scale = Math.max(0.1, Math.hypot(dx, dy) / 40);
    }

    this._draw();
    this.onTransform({ rotation: this.rotation, scale: this.scale });
  }

  _onUp() {
    this.dragging = null;
  }

  _draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (!this.region || !this.pivot) return;

    // Draw region bounding box
    this.ctx.strokeStyle = "#00e0ff";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(
      this.region.x,
      this.region.y,
      this.region.width,
      this.region.height
    );

    // Draw pivot
    this.ctx.fillStyle = "#ff0066";
    this.ctx.beginPath();
    this.ctx.arc(this.pivot.x, this.pivot.y, 5, 0, Math.PI * 2);
    this.ctx.fill();

    // Rotation handle
    this.ctx.fillStyle = "#ffaa00";
    this.ctx.beginPath();
    this.ctx.arc(this.pivot.x, this.pivot.y - 40, 6, 0, Math.PI * 2);
    this.ctx.fill();

    // Scale handle
    this.ctx.fillStyle = "#00cc66";
    this.ctx.beginPath();
    this.ctx.arc(this.pivot.x + 40, this.pivot.y, 6, 0, Math.PI * 2);
    this.ctx.fill();
  }
}