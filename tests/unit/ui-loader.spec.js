/**
 * resource: tests/unit/ui-loader.spec.js
 * goal: Validate declarative UI loader behavior
 * channel: unit-test
 * handoff: epoch.mm.shady-animator.v1.2.ui.loader-test
 */

import { loadUI } from '../../src/ui/ui-loader.js';
import { modules } from '../../src/ui/index.js';

test('initializes modules based on data-action', () => {
  document.body.innerHTML = `
    <canvas id="c" data-action="RegionSelector"></canvas>
  `;

  const mock = jest.fn();
  modules.RegionSelector = mock;

  loadUI();

  expect(mock).toHaveBeenCalled();
});