/**
 * resource: tests/unit/region-selector.spec.js
 * goal: Validate region math and event flow
 * channel: unit-test
 * handoff: epoch.mm.shady-animator.v1.1.step10.unit
 */

import { RegionSelector } from '../../src/ui/region-selector.js';

test('computes region correctly', () => {
  const canvas = {
    getContext: () => ({ clearRect() {}, strokeRect() {} }),
    addEventListener: () => {},
    getBoundingClientRect: () => ({ left: 0, top: 0 })
  };

  let regionOut = null;
  const selector = new RegionSelector(canvas, (r) => (regionOut = r));

  selector.start = { x: 10, y: 20 };
  selector.current = { x: 40, y: 60 };
  selector._onUp({ clientX: 40, clientY: 60 });

  expect(regionOut).toEqual({
    x: 10,
    y: 20,
    width: 30,
    height: 40
  });
});