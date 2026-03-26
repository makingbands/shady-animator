// src/keyframeStore.js
// Minimal keyframe store for Shady Animator MVP
// API:
//  createKeyframeStore() -> store
// store methods:
//  recordKeyframe(time, regionId, transform) -> keyframeId
//  listKeyframes(regionId) -> [{id,time,regionId,transform}]
//  deleteKeyframe(id) -> boolean
//  getInterpolatedState(time) -> { regionId: { transform } }
//  serialize() -> JSON
//  deserialize(json)

export function createKeyframeStore() {
  let nextId = 1;
  const frames = new Map(); // id -> { id, time, regionId, transform }
  const byRegion = new Map(); // regionId -> sorted array of ids

  function _insertSorted(regionId, id) {
    const meta = frames.get(id);
    if (!byRegion.has(regionId)) byRegion.set(regionId, []);
    const arr = byRegion.get(regionId);
    // insert keeping ascending time
    let i = 0;
    while (i < arr.length && frames.get(arr[i]).time <= meta.time) i++;
    arr.splice(i, 0, id);
  }

  function recordKeyframe(time, regionId, transform) {
    if (typeof time !== 'number' || Number.isNaN(time)) throw new Error('recordKeyframe: invalid time');
    if (!regionId) throw new Error('recordKeyframe: regionId required');
    const id = String(nextId++);
    const frame = { id, time: Number(time), regionId, transform: Object.assign({}, transform) };
    frames.set(id, frame);
    _insertSorted(regionId, id);
    return id;
  }

  function listKeyframes(regionId) {
    if (!regionId) {
      // return all frames sorted by time
      return Array.from(frames.values()).sort((a,b)=>a.time - b.time).map(f => Object.assign({}, f));
    }
    const ids = byRegion.get(regionId) || [];
    return ids.map(id => Object.assign({}, frames.get(id)));
  }

  function deleteKeyframe(id) {
    if (!frames.has(id)) return false;
    const frame = frames.get(id);
    frames.delete(id);
    const arr = byRegion.get(frame.regionId) || [];
    const idx = arr.indexOf(id);
    if (idx >= 0) arr.splice(idx, 1);
    return true;
  }

  function _interpolateTransforms(t0, t1, alpha) {
    // linear interpolation for tx,ty,scale
    const out = {};
    const keys = new Set([...Object.keys(t0), ...Object.keys(t1)]);
    for (const k of keys) {
      const v0 = Number(t0[k] === undefined ? 0 : t0[k]);
      const v1 = Number(t1[k] === undefined ? v0 : t1[k]);
      out[k] = v0 + (v1 - v0) * alpha;
    }
    return out;
  }

  function getInterpolatedState(time) {
    const result = {};
    // For each region, find surrounding keyframes and interpolate
    for (const [regionId, ids] of byRegion.entries()) {
      if (!ids || ids.length === 0) continue;
      // if time before first keyframe, use first; after last, use last
      let first = frames.get(ids[0]);
      let last = frames.get(ids[ids.length - 1]);
      if (time <= first.time) {
        result[regionId] = { transform: Object.assign({}, first.transform) };
        continue;
      }
      if (time >= last.time) {
        result[regionId] = { transform: Object.assign({}, last.transform) };
        continue;
      }
      // find pair
      let left = first, right = last;
      for (let i = 0; i < ids.length - 1; i++) {
        const a = frames.get(ids[i]);
        const b = frames.get(ids[i+1]);
        if (time >= a.time && time <= b.time) { left = a; right = b; break; }
      }
      const span = right.time - left.time;
      const alpha = span === 0 ? 0 : (time - left.time) / span;
      const interp = _interpolateTransforms(left.transform, right.transform, alpha);
      result[regionId] = { transform: interp };
    }
    return result;
  }

  function serialize() {
    const out = { frames: Array.from(frames.values()).sort((a,b)=>a.time-b.time) };
    return JSON.stringify(out);
  }

  function deserialize(json) {
    const obj = typeof json === 'string' ? JSON.parse(json) : json;
    frames.clear();
    byRegion.clear();
    nextId = 1;
    if (!obj || !Array.isArray(obj.frames)) return;
    for (const f of obj.frames) {
      const id = String(nextId++);
      const frame = { id, time: Number(f.time), regionId: f.regionId, transform: Object.assign({}, f.transform) };
      frames.set(id, frame);
      if (!byRegion.has(frame.regionId)) byRegion.set(frame.regionId, []);
      byRegion.get(frame.regionId).push(id);
    }
    // ensure per-region arrays are sorted by time
    for (const [rid, ids] of byRegion.entries()) {
      ids.sort((a,b)=>frames.get(a).time - frames.get(b).time);
    }
  }

  return {
    recordKeyframe,
    listKeyframes,
    deleteKeyframe,
    getInterpolatedState,
    serialize,
    deserialize
  };
}