/**
 * resource: src/ui/region-selector.js
 * goal: Provide click‑and‑drag region selection on a canvas
 * channel: ui-module
 * handoff: epoch.mm.shady-animator.v1.1.step10.region-selector
 */

export class RegionSelector {
  constructor(canvas, onRegionSelected) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onRegionSelected = onRegionSelected;

    this.dragging = false;
    this.start = { x: 0, y: 0 };
    this.current = { x: 0, y: 0 };

    this._bindEvents();
  }

  _bindEvents() {
    this.canvas.addEventListener('mousedown', (e) => this._onDown(e));
    this.canvas.addEventListener('mousemove', (e) => this._onMove(e));
    this.canvas.addEventListener('mouseup', (e) => this._onUp(e));
  }

  _getPos(evt) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
  }

  _onDown(evt) {
    this.dragging = true;
    this.start = this._getPos(evt);
    this.current = { ...this.start };
  }

  _onMove(evt) {
    if (!this.dragging) return;
    this.current = this._getPos(evt);
    this._draw();
  }

  _onUp(evt) {
    if (!this.dragging) return;
    this.dragging = false;

    const end = this._getPos(evt);
    const region = {
      x: Math.min(this.start.x, end.x),
      y: Math.min(this.start.y, end.y),
      width: Math.abs(end.x - this.start.x),
      height: Math.abs(end.y - this.start.y)
    };

    this._clear();
    this.onRegionSelected(region);
  }

  _draw() {
    this._clear();
    const { x, y, width, height } = {
      x: Math.min(this.start.x, this.current.x),
      y: Math.min(this.start.y, this.current.y),
      width: Math.abs(this.current.x - this.start.x),
      height: Math.abs(this.current.y - this.start.y)
    };

    this.ctx.strokeStyle = '#00e0ff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, width, height);
  }

  _clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}