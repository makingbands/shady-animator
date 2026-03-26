// modules/timeline.js

import { transformState } from './controller.js';

export const timeline = {
  keyframes: [],   // { time, tx, ty, scale }
  duration: 2.0,   // default 2 seconds
  playing: false,
  startTime: 0
};

// Add a keyframe at the current transform state
export function addKeyframe(time) {
  timeline.keyframes.push({
    time,
    tx: transformState.tx,
    ty: transformState.ty,
    scale: transformState.scale
  });

  // Keep keyframes sorted
  timeline.keyframes.sort((a, b) => a.time - b.time);
}

// Linear interpolation helper
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Given a time t, compute interpolated transform
export function getAnimatedTransform(t) {
  const frames = timeline.keyframes;

  if (frames.length === 0) return transformState;
  if (frames.length === 1) return frames[0];

  // Wrap time for looping
  t = t % timeline.duration;

  // Find surrounding keyframes
  let k0 = frames[0];
  let k1 = frames[frames.length - 1];

  for (let i = 0; i < frames.length - 1; i++) {
    if (t >= frames[i].time && t <= frames[i + 1].time) {
      k0 = frames[i];
      k1 = frames[i + 1];
      break;
    }
  }

  const span = k1.time - k0.time;
  const alpha = span === 0 ? 0 : (t - k0.time) / span;

  return {
    tx: lerp(k0.tx, k1.tx, alpha),
    ty: lerp(k0.ty, k1.ty, alpha),
    scale: lerp(k0.scale, k1.scale, alpha)
  };
}

// Playback control
export function play() {
  timeline.playing = true;
  timeline.startTime = performance.now() / 1000;
}

export function stop() {
  timeline.playing = false;
}