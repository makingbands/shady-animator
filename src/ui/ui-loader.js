/**
 * resource: src/ui/ui-loader.js
 * goal: Declaratively initialize UI modules via data-action / data-source
 * channel: ui-loader
 * handoff: epoch.mm.shady-animator.v1.2.ui.loader
 */

import { modules } from './index.js';

export function loadUI() {
  const elements = document.querySelectorAll('[data-action]');

  elements.forEach(el => {
    const action = el.dataset.action;
    const sourceSelector = el.dataset.source;

    const mod = modules[action];
    if (!mod) {
      console.warn(`[UI Loader] No module found for action: ${action}`);
      return;
    }

    const sourceEl = sourceSelector
      ? document.querySelector(sourceSelector)
      : el;

    try {
      new mod(sourceEl, (output) => {
        // Optional: expose last output for debugging or tests
        window.__uiLastOutput = output;
      });
    } catch (err) {
      console.error(`[UI Loader] Failed to initialize ${action}:`, err);
    }
  });
}