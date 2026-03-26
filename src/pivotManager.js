// src/pivotManager.js
// Pivot manager for Shady Animator MVP
// API:
//   createPivotStore() -> store
// store methods:
//   store.createRegion(regionId, metadata) -> void
//   store.getPivot(regionId) -> {x,y}
//   store.setPivot(regionId, x, y, {constrainToBBox:false})
//   store.resetPivotToCentroid(regionId)
//   store.getRegion(regionId) -> metadata
//   store.serialize() -> JSON
//   store.deserialize(json)

export function createPivotStore() {
  const regions = new Map();

  function createRegion(regionId, metadata = {}) {
    if (!regionId) throw new Error('createRegion: regionId required');
    const meta = Object.assign({}, metadata);
    if (!meta.centroid) meta.centroid = { x: 0, y: 0 };
    if (!meta.pivot) meta.pivot = { x: meta.centroid.x, y: meta.centroid.y };
    regions.set(regionId, meta);
  }

  function getRegion(regionId) {
    if (!regions.has(regionId)) throw new Error('getRegion: unknown regionId');
    const r = regions.get(regionId);
    return Object.assign({}, r, { pivot: Object.assign({}, r.pivot), centroid: Object.assign({}, r.centroid) });
  }

  function getPivot(regionId) {
    return getRegion(regionId).pivot;
  }

  function setPivot(regionId, x, y, opts = {}) {
    if (!regions.has(regionId)) throw new Error('setPivot: unknown regionId');
    const meta = regions.get(regionId);
    let nx = Number(x), ny = Number(y);
    if (Number.isNaN(nx) || Number.isNaN(ny)) throw new Error('setPivot: invalid coordinates');
    if (opts.constrainToBBox && meta.bbox) {
      const { minX, minY, maxX, maxY } = meta.bbox;
      nx = Math.max(minX, Math.min(maxX, nx));
      ny = Math.max(minY, Math.min(maxY, ny));
    }
    meta.pivot = { x: nx, y: ny };
    regions.set(regionId, meta);
    return meta.pivot;
  }

  function resetPivotToCentroid(regionId) {
    if (!regions.has(regionId)) throw new Error('resetPivotToCentroid: unknown regionId');
    const meta = regions.get(regionId);
    meta.pivot = { x: meta.centroid.x, y: meta.centroid.y };
    regions.set(regionId, meta);
    return meta.pivot;
  }

  function serialize() {
    const out = {};
    for (const [id, meta] of regions.entries()) {
      out[id] = {
        bbox: meta.bbox || null,
        centroid: meta.centroid || null,
        pivot: meta.pivot || null
      };
    }
    return JSON.stringify(out);
  }

  function deserialize(json) {
    const obj = typeof json === 'string' ? JSON.parse(json) : json;
    for (const id of Object.keys(obj)) {
      const meta = obj[id];
      regions.set(id, {
        bbox: meta.bbox || { minX:0,minY:0,maxX:0,maxY:0 },
        centroid: meta.centroid || { x:0,y:0 },
        pivot: meta.pivot || (meta.centroid ? { x: meta.centroid.x, y: meta.centroid.y } : { x:0,y:0 })
      });
    }
  }

  return {
    createRegion,
    getRegion,
    getPivot,
    setPivot,
    resetPivotToCentroid,
    serialize,
    deserialize
  };
}