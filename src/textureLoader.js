// src/textureLoader.js
// Minimal texture loader for Shady Animator MVP
// Exports: loadTexture(source) -> Promise<{width, height, imageData}>

export async function loadTexture(source) {
  // Accepts: File | Blob | string (URL)
  // Returns: { width, height, imageData }
  const blob = await _toBlob(source);
  const decoded = await _createImageBitmapSafe(blob);
  // decoded may be an ImageBitmap or an HTMLCanvasElement (fallback)
  const width = decoded.width;
  const height = decoded.height;
  // Use an HTMLCanvasElement to ensure getImageData is available
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);
  // drawImage accepts ImageBitmap, HTMLImageElement, or HTMLCanvasElement
  ctx.drawImage(decoded, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  return { width, height, imageData };
}

async function _toBlob(source) {
  if (!source) throw new Error('No source provided');
  if (source instanceof Blob) return source;
  if (typeof File !== 'undefined' && source instanceof File) return source;
  if (typeof source === 'string') {
    // treat as URL
    const resp = await fetch(source, { mode: 'cors' });
    if (!resp.ok) throw new Error('Failed to fetch image URL: ' + resp.status);
    return await resp.blob();
  }
  if (source && typeof source.arrayBuffer === 'function') {
    const buf = await source.arrayBuffer();
    return new Blob([buf]);
  }
  throw new Error('Unsupported source type');
}

async function _createImageBitmapSafe(blob) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(blob);
    } catch (e) {
      // fallback to Image element path
    }
  }
  return await _blobToCanvasViaImage(blob);
}

function _blobToCanvasViaImage(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        resolve(canvas);
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(new Error('Image load error'));
    };
    img.src = url;
  });
}