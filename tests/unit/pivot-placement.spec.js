import { PivotPlacement } from '../../src/ui/pivot-placement.js';

test('records pivot position on click', () => {
  const canvas = {
    getContext: () => ({ clearRect() {}, beginPath() {}, arc() {}, fill() {} }),
    addEventListener: (ev, fn) => { canvas._click = fn; },
    getBoundingClientRect: () => ({ left: 0, top: 0 })
  };

  let pivotOut = null;
  const mod = new PivotPlacement(canvas, (p) => pivotOut = p);

  canvas._click({ clientX: 50, clientY: 100 });

  expect(pivotOut).toEqual({ x: 50, y: 100 });
});