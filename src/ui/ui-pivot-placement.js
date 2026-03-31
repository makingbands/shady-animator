/**
 * resource: src/ui/pivot-placement.js
 * goal: Allow user to click inside a region to place a pivot point
 * channel: ui-module
 * handoff: epoch.mm.shady-animator.v1.2.step11.pivot-placement
 */

export class PivotPlacement {
  constructor(canvas, onPivotPlaced) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onPivotPlaced = onPivotPlaced;

    this.pivot = null;

    this.canvas.addEventListener('click', (e) => this._onClick(e));
  }

  _getPos(evt) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
  }

  _onClick(evt) {
    const pos = this._getPos(evt);
    this.pivot = pos;
    this._drawPivot(pos);
    this.onPivotPlaced(pos);
  }

  _drawPivot({ x, y }) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#ff0066';
    this.ctx.beginPath();
    this.ctx.arc(x, y, 5, 0, Math.PI * 2);
    this.ctx.fill();
  }
}