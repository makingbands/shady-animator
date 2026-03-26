// src/transformController.js
// 3-axis transform controller for Shady Animator MVP
// Exports:
//  computeTransformMatrix(transform, pivot) -> [[a,b,c],[d,e,f],[0,0,1]]
//  applyTransformToPoint(pt, matrix) -> {x,y}
//  composeMatrices(A,B) -> C
//  createController() -> controller with per-region state and simple API

export function computeTransformMatrix(transform, pivot = { x: 0, y: 0 }) {
  // transform: { tx, ty, scale } where scale is uniform
  const tx = Number(transform.tx) || 0;
  const ty = Number(transform.ty) || 0;
  const s = Number(transform.scale) || 1;
  // Translate to pivot, scale, translate back, then translate by tx/ty
  // M = T(tx,ty) * T(pivot) * S(s) * T(-pivot)
  // Build as 3x3 matrix in row-major
  const px = pivot.x || 0;
  const py = pivot.y || 0;
  // T(-pivot)
  const t1 = [1,0,-px, 0,1,-py, 0,0,1];
  // S(s)
  const sM = [s,0,0, 0,s,0, 0,0,1];
  // T(pivot)
  const t2 = [1,0,px, 0,1,py, 0,0,1];
  // T(tx,ty)
  const t3 = [1,0,tx, 0,1,ty, 0,0,1];

  // multiply matrices: result = t3 * t2 * sM * t1
  let m = multiplyMatrices(t2, sM);
  m = multiplyMatrices(m, t1);
  m = multiplyMatrices(t3, m);
  // return as nested arrays for readability
  return [
    [m[0], m[1], m[2]],
    [m[3], m[4], m[5]],
    [m[6], m[7], m[8]]
  ];
}

function multiplyMatrices(A, B) {
  // A and B are flat 3x3 arrays row-major length 9
  const a = A, b = B;
  const out = new Array(9).fill(0);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      let sum = 0;
      for (let k = 0; k < 3; k++) {
        sum += a[r*3 + k] * b[k*3 + c];
      }
      out[r*3 + c] = sum;
    }
  }
  return out;
}

export function applyTransformToPoint(pt, matrix) {
  // matrix: nested 3x3 array or flat 9 array
  let m;
  if (Array.isArray(matrix[0])) {
    m = [matrix[0][0],matrix[0][1],matrix[0][2], matrix[1][0],matrix[1][1],matrix[1][2], matrix[2][0],matrix[2][1],matrix[2][2]];
  } else m = matrix;
  const x = pt.x, y = pt.y;
  const nx = m[0]*x + m[1]*y + m[2];
  const ny = m[3]*x + m[4]*y + m[5];
  return { x: nx, y: ny };
}

export function composeMatrices(A, B) {
  // returns A * B (nested or flat accepted)
  const a = Array.isArray(A[0]) ? [A[0][0],A[0][1],A[0][2],A[1][0],A[1][1],A[1][2],A[2][0],A[2][1],A[2][2]] : A;
  const b = Array.isArray(B[0]) ? [B[0][0],B[0][1],B[0][2],B[1][0],B[1][1],B[1][2],B[2][0],B[2][1],B[2][2]] : B;
  const out = multiplyMatrices(a,b);
  return [
    [out[0],out[1],out[2]],
    [out[3],out[4],out[5]],
    [out[6],out[7],out[8]]
  ];
}

// Minimal helper to compute transformed bbox and centroid for a region
export function transformRegionGeometry({ bbox, centroid }, matrix) {
  // bbox: {minX,minY,maxX,maxY}
  const corners = [
    { x: bbox.minX, y: bbox.minY },
    { x: bbox.maxX, y: bbox.minY },
    { x: bbox.maxX, y: bbox.maxY },
    { x: bbox.minX, y: bbox.maxY }
  ];
  const tCorners = corners.map(c => applyTransformToPoint(c, matrix));
  const xs = tCorners.map(p => p.x);
  const ys = tCorners.map(p => p.y);
  const tBbox = { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
  const tCentroid = applyTransformToPoint(centroid, matrix);
  return { bbox: tBbox, centroid: tCentroid };
}

// Controller: holds per-region transform state and notifies listeners
export function createController() {
  const regions = new Map(); // regionId -> { transform: {tx,ty,scale}, pivot }
  const listeners = new Set();

  function createRegion(regionId, initial = {}) {
    const t = Object.assign({ tx: 0, ty: 0, scale: 1 }, initial.transform || {});
    const pivot = initial.pivot || { x: 0, y: 0 };
    regions.set(regionId, { transform: t, pivot });
  }

  function setTransform(regionId, transform) {
    if (!regions.has(regionId)) throw new Error('setTransform: unknown regionId');
    const meta = regions.get(regionId);
    meta.transform = Object.assign({}, meta.transform, transform);
    regions.set(regionId, meta);
    notify(regionId);
    return meta.transform;
  }

  function getTransform(regionId) {
    if (!regions.has(regionId)) throw new Error('getTransform: unknown regionId');
    return Object.assign({}, regions.get(regionId).transform);
  }

  function setPivot(regionId, pivot) {
    if (!regions.has(regionId)) throw new Error('setPivot: unknown regionId');
    const meta = regions.get(regionId);
    meta.pivot = { x: pivot.x, y: pivot.y };
    regions.set(regionId, meta);
    notify(regionId);
    return meta.pivot;
  }

  function getPivot(regionId) {
    if (!regions.has(regionId)) throw new Error('getPivot: unknown regionId');
    return Object.assign({}, regions.get(regionId).pivot);
  }

  function getMatrix(regionId) {
    const meta = regions.get(regionId);
    return computeTransformMatrix(meta.transform, meta.pivot);
  }

  function notify(regionId) {
    for (const fn of listeners) {
      try { fn(regionId, getTransform(regionId), getPivot(regionId)); } catch (e) { /* swallow */ }
    }
  }

  function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

  return {
    createRegion,
    setTransform,
    getTransform,
    setPivot,
    getPivot,
    getMatrix,
    onChange
  };
}