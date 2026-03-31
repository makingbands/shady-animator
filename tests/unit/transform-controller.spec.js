import { TransformController } from '../../src/ui/transform-controller.js';

test('computes rotation and scale', () => {
  const canvas = {
    getContext: () => ({ clearRect() {}, strokeRect() {}, beginPath() {}, arc() {}, fill() {} }),
    addEventListener: () => {},
    getBoundingClientRect: () => ({ left: 0, top: 0 })
  };

  let out = null;
  const mod = new TransformController(canvas, (t) => out = t);

  mod.setRegion({ x: 0, y: 0, width: 100, height: 100 });
  mod.setPivot({ x: 50, y: 50 });

  mod.dragging = "rotate";
  mod._onMove({ clientX: 100, clientY: 50 });

  expect(out.rotation).toBeCloseTo(0);

  mod.dragging = "scale";
  mod._onMove({ clientX: 90, clientY: 50 });

  expect(out.scale).toBeGreaterThan(1);
});
