// src/exporter.js
// Exporter for Shady Animator MVP
// Exports:
//  encodeMaskRLE(maskUint8Array, width, height) -> Array<number>
//  decodeMaskRLE(rle, width, height) -> Uint8Array
//  exportProject({ textures, regions, keyframes }, { embedTextures:true|false }) -> JSON string
//  exportPackage(...) -> { manifest, assets } where assets is { textureId: Blob/string }

export function encodeMaskRLE(mask, width, height) {
  // mask: Uint8Array length width*height with 0/1 values
  const out = [];
  let runVal = 0;
  let runCount = 0;
  const total = width * height;
  for (let i = 0; i < total; i++) {
    const v = mask[i] ? 1 : 0;
    if (i === 0) { runVal = v; runCount = 1; continue; }
    if (v === runVal) runCount++;
    else {
      out.push(runCount);
      runVal = v;
      runCount = 1;
    }
  }
  out.push(runCount);
  // Ensure runs start with zeros: if first run is ones, prefix a zero run of length 0
  if (mask[0] === 1) out.unshift(0);
  return out;
}

export function decodeMaskRLE(rle, width, height) {
  const total = width * height;
  const out = new Uint8Array(total);
  let idx = 0;
  // rle alternates runs starting with zeros
  let val = 0;
  for (let i = 0; i < rle.length; i++) {
    const count = Number(rle[i]);
    for (let j = 0; j < count; j++) {
      if (idx >= total) break;
      out[idx++] = val;
    }
    val = val ? 0 : 1;
  }
  // if not filled, remaining are zeros
  return out;
}

function _base64FromCanvas(canvas) {
  // returns data URL string
  return canvas.toDataURL('image/png');
}

function _textureDescriptor(texture) {
  // texture: { id, width, height, canvas? , url? }
  const desc = { id: texture.id, width: texture.width, height: texture.height };
  if (texture.url) desc.reference = texture.url;
  return desc;
}

export function exportProject(project, opts = { embedTextures: true }) {
  // project: { textures: [{id,width,height,canvas?,url?}], regions: [{id,textureId,bbox,centroid,pivot,mask}], keyframes: [...] }
  const manifest = {
    version: 'shady-animator.v1.1',
    textures: [],
    regions: [],
    keyframes: [],
    meta: { exportedAt: Date.now() }
  };

  // deterministic ordering
  const textures = (project.textures || []).slice().sort((a,b)=> (a.id > b.id ? 1 : -1));
  const regions = (project.regions || []).slice().sort((a,b)=> (a.id > b.id ? 1 : -1));
  const keyframes = (project.keyframes || []).slice().sort((a,b)=> (a.time - b.time));

  const assets = {};

  for (const t of textures) {
    const td = _textureDescriptor(t);
    if (opts.embedTextures && t.canvas) {
      td.embedded = true;
      td.data = _base64FromCanvas(t.canvas);
      assets[t.id] = td.data;
    } else if (opts.embedTextures && t.blob) {
      // convert blob to dataURL synchronously not possible; require caller to pass canvas or dataURL
      td.embedded = false;
      td.reference = t.url || null;
    } else {
      td.embedded = false;
      td.reference = t.url || null;
    }
    manifest.textures.push(td);
  }

  for (const r of regions) {
    const entry = {
      id: r.id,
      textureId: r.textureId,
      bbox: r.bbox,
      centroid: r.centroid,
      pivot: r.pivot
    };
    if (r.mask && r.width && r.height) {
      entry.maskRLE = encodeMaskRLE(r.mask, r.width, r.height);
      entry.maskWidth = r.width;
      entry.maskHeight = r.height;
    } else {
      entry.maskRLE = [];
      entry.maskWidth = r.width || 0;
      entry.maskHeight = r.height || 0;
    }
    manifest.regions.push(entry);
  }

  for (const k of keyframes) {
    manifest.keyframes.push({
      id: k.id,
      time: k.time,
      regionId: k.regionId,
      transform: k.transform
    });
  }

  return JSON.stringify(manifest);
}

export function exportPackage(project, opts = { embedTextures: true }) {
  // returns { manifest: JSON string, assets: { textureId: dataURL|string } }
  const manifestStr = exportProject(project, opts);
  const assets = {};
  for (const t of project.textures || []) {
    if (opts.embedTextures && t.canvas) assets[t.id] = _base64FromCanvas(t.canvas);
    else if (t.url) assets[t.id] = t.url;
  }
  return { manifest: manifestStr, assets };
}