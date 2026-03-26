// src/regionDef.js
// Region definition utilities for Shady Animator MVP
// Exports:
//   getPixelColor(imageData, x, y) -> {r,g,b,a}
//   colorDistance(c1, c2) -> number
//   defineRegion(imageData, sampleXY, tolerance) -> { mask, width, height, bbox, centroid }

export function getPixelColor(imageData, x, y) {
  const { width, height, data } = imageData;
  if (x < 0 || y < 0 || x >= width || y >= height) {
    throw new Error('getPixelColor: coordinates out of bounds');
  }
  const idx = (Math.floor(y) * width + Math.floor(x)) * 4;
  return {
    r: data[idx],
    g: data[idx + 1],
    b: data[idx + 2],
    a: data[idx + 3]
  };
}

export function colorDistance(c1, c2) {
  // Euclidean distance in RGB space (ignores alpha)
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

export function defineRegion(imageData, sampleXY, tolerance) {
  if (!imageData || !imageData.data) throw new Error('defineRegion: invalid imageData');
  const width = imageData.width;
  const height = imageData.height;
  const mask = new Uint8Array(width * height); // 0 or 1
  const sample = getPixelColor(imageData, sampleXY.x, sampleXY.y);
  const tol = Number(tolerance);
  if (Number.isNaN(tol) || tol < 0) throw new Error('defineRegion: invalid tolerance');

  let minX = width - 1, minY = height - 1, maxX = 0, maxY = 0;
  let sumX = 0, sumY = 0, count = 0;

  const data = imageData.data;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const px = { r: data[idx], g: data[idx + 1], b: data[idx + 2], a: data[idx + 3] };
      const dist = colorDistance(px, sample);
      if (dist <= tol) {
        const i = y * width + x;
        mask[i] = 1;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
        sumX += x;
        sumY += y;
        count++;
      }
    }
  }

  let bbox = null;
  let centroid = null;
  if (count > 0) {
    bbox = { minX, minY, maxX, maxY };
    centroid = { x: sumX / count, y: sumY / count };
  } else {
    // empty region
    bbox = { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    centroid = { x: 0, y: 0 };
  }

  return { mask, width, height, bbox, centroid, sampleColor: sample, tolerance: tol };
}