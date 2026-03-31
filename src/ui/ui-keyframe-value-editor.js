// src/ui/ui-keyframe-value-editor.js

export class KeyframeValueEditor {
  constructor(uiState, onRedraw, onScrub) {
    this.uiState = uiState;
    this.onRedraw = onRedraw;
    this.onScrub = onScrub;

    this.selectedIndex = null;

    // 🔥 Step 17 Part 5: Listen for selection
    window.addEventListener('keyframe-selected', (e) => {
      this.selectedIndex = e.detail.index;
      const kf = this.uiState.keyframes[this.selectedIndex];
      if (kf) this.onScrub(kf.time);
    });

    // 🔥 Step 17 Part 5: Listen for region/pivot/transform updates
    window.addEventListener('ui-output', (e) => {
      if (this.selectedIndex === null) return;

      const kf = this.uiState.keyframes[this.selectedIndex];
      if (!kf) return;

      if (e.detail.region) kf.region = structuredClone(e.detail.region);
      if (e.detail.pivot) kf.pivot = structuredClone(e.detail.pivot);
      if (e.detail.transform) kf.transform = structuredClone(e.detail.transform);

      this.onRedraw();
    });
  }
}