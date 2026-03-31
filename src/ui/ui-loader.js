// src/ui/ui-loader.js
import { modules } from './index.js';

export function loadUI(uiState, drawFrame, playbackControllerRef) {
  const elements = document.querySelectorAll('[data-action]');

  elements.forEach(el => {
    const actionAttr = el.dataset.action;
    if (!actionAttr) return;

    // Split multiple actions: "RegionSelector PivotPlacement TransformController"
    const actions = actionAttr.split(/\s+/);

    actions.forEach(a => {
      const mod = modules[a];
      if (!mod) {
        console.warn(`[UI Loader] No module found for action: ${a}`);
        return;
      }

      // --- TimelineUI ---
      if (a === 'TimelineUI') {
        const instance = new mod(
          el,
          () => uiState.keyframes,
          (t) => {
            const frame = playbackControllerRef?._sample(t);
            if (frame) {
              uiState.region = frame.region;
              uiState.pivot = frame.pivot;
              uiState.transform = frame.transform;
              drawFrame(frame);
            }
          }
        );

        // Store instance so KeyframeEditor + ValueEditor can call draw()
        modules['TimelineUI'].instance = instance;
        return;
      }

      // --- KeyframeEditor ---
      if (a === 'KeyframeEditor') {
        new mod(
          el,
          uiState,
          () => modules['TimelineUI'].instance.draw(),
          (t) => {
            const frame = playbackControllerRef?._sample(t);
            if (frame) {
              uiState.region = frame.region;
              uiState.pivot = frame.pivot;
              uiState.transform = frame.transform;
              drawFrame(frame);
            }
          }
        );
        return;
      }

      // --- KeyframeValueEditor ---
      if (a === 'KeyframeValueEditor') {
        new mod(
          uiState,
          () => modules['TimelineUI'].instance.draw(),
          (t) => {
            const frame = playbackControllerRef?._sample(t);
            if (frame) {
              uiState.region = frame.region;
              uiState.pivot = frame.pivot;
              uiState.transform = frame.transform;
              drawFrame(frame);
            }
          }
        );
        return;
      }

      // --- PlaybackController ---
      if (a === 'PlaybackController') {
        const controller = new mod(
          el,
          () => uiState.keyframes,
          (frame) => {
            uiState.region = frame.region;
            uiState.pivot = frame.pivot;
            uiState.transform = frame.transform;
            drawFrame(frame);
          }
        );

        playbackControllerRef = controller;
        return;
      }

      // --- Default case for RegionSelector, PivotPlacement, TransformController ---
      new mod(el, (output) => {
        // Broadcast UI output for KeyframeValueEditor
        window.dispatchEvent(new CustomEvent('ui-output', {
          detail: output
        }));
      });
    });
  });
}