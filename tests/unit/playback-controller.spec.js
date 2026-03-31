// tests/unit/playback-controller.spec.js

import { PlaybackController } from '../../src/ui/playback-controller.js';

test('samples between two keyframes', () => {
  const button = { addEventListener: (ev, fn) => { button._click = fn; } };

  const kfs = [
    {
      time: 0,
      region: { x: 0, y: 0, width: 100, height: 100 },
      pivot: { x: 50, y: 50 },
      transform: { rotation: 0, scale: 1 }
    },
    {
      time: 1000,
      region: { x: 0, y: 0, width: 100, height: 100 },
      pivot: { x: 50, y: 50 },
      transform: { rotation: Math.PI, scale: 2 }
    }
  ];

  let lastFrame = null;
  const playback = new PlaybackController(
    button,
    () => kfs,
    (frame) => { lastFrame = frame; }
  );

  // simulate internal sampling
  const sampled = playback._sample(500);
  expect(sampled.transform.scale).toBeCloseTo(1.5);
});