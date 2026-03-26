// src/uiGlue.js
// UI glue for Shady Animator MVP
// Responsibilities:
//  - Wire texture canvas and controller pad canvas
//  - Map canvas coords <-> image coords
//  - Render texture, region mask overlay, pivot handle, and transformed preview bbox/centroid
//  - Hook into modules: textureLoader, regionDef, pivotManager, transformController, keyframeStore, exporter
//  - Provide keyboard shortcuts and structured error objects
//
// Exports:
//  createUIGlue({ textureCanvas, controllerCanvas, modules }) -> ui object
// ui object methods:
//  init(), loadTexture(source), sampleAtCanvasXY(cx,cy), defineRegionAtCanvasXY(cx,cy,tolerance),
//  setActiveRegion(regionId), recordKeyframe(), exportProject(), destroy()

export function createUIGlue({ textureCanvas, controllerCanvas, modules }) {
  if (!textureCanvas || !controllerCanvas) throw new Error('createUIGlue: canvases required');
  const { textureLoader, regionDef, pivotManager, transformController, keyframeStore, exporter } = modules;
  const tctx = textureCanvas.getContext('2d');
  const cctx = controllerCanvas.getContext('2d');

  // internal state
  const state = {
    loaded: null, // { width,height,imageData,drawParams }
    regions: new Map(), // regionId -> { mask, bbox, centroid, pivot, width, height }
    activeRegionId: null,
    tolerance: 30,
    isPlaying: false
  };

  // helpers: draw image centered preserving aspect ratio (same logic used elsewhere)
  function drawImagePreserveAspectToCanvas(imgSource, canvas) {
    const ctx = canvas.getContext('2d');
    const cw = canvas.width, ch = canvas.height;
    const iw = imgSource.width, ih = imgSource.height;
    const ar = iw / ih;
    let dw = cw, dh = Math.round(dw / ar);
    if (dh > ch) { dh = ch; dw = Math.round(dh * ar); }
    const dx = Math.round((cw - dw) / 2);
    const dy = Math.round((ch - dh) / 2);
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(imgSource, dx, dy, dw, dh);
    return { dx, dy, dw, dh };
  }

  function canvasToImageCoords(canvasX, canvasY, drawParams, imageWidth, imageHeight) {
    const { dx, dy, dw, dh } = drawParams;
    const localX = Math.max(0, Math.min(dw - 1, canvasX - dx));
    const localY = Math.max(0, Math.min(dh - 1, canvasY - dy));
    const imgX = (localX / dw) * imageWidth;
    const imgY = (localY / dh) * imageHeight;
    return { x: Math.floor(imgX), y: Math.floor(imgY) };
  }

  function imageToCanvasCoords(imgX, imgY, drawParams, imageWidth, imageHeight) {
    const { dx, dy, dw, dh } = drawParams;
    const cx = dx + (imgX + 0.5) * (dw / imageWidth);
    const cy = dy + (imgY + 0.5) * (dh / imageHeight);
    return { x: Math.round(cx), y: Math.round(cy) };
  }

  // render overlays: region mask (semi-transparent), bbox, centroid, pivot handle, transformed bbox preview
  function redraw() {
    try {
      // clear texture canvas and redraw loaded image if present
      tctx.clearRect(0, 0, textureCanvas.width, textureCanvas.height);
      if (!state.loaded) return;
      // draw the decoded canvas (state.loaded.canvas) into textureCanvas preserving aspect
      const drawParams = drawImagePreserveAspectToCanvas(state.loaded.canvas, textureCanvas);
      state.loaded.drawParams = drawParams;

      // overlay each region
      for (const [rid, r] of state.regions.entries()) {
        if (!r.mask || !r.width || !r.height) continue;
        // draw mask as semi-transparent overlay
        const imgW = r.width, imgH = r.height;
        // create an offscreen canvas to paint mask scaled to drawParams
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = imgW; maskCanvas.height = imgH;
        const mctx = maskCanvas.getContext('2d');
        const imgData = mctx.createImageData(imgW, imgH);
        for (let i = 0; i < r.mask.length; i++) {
          const v = r.mask[i] ? 255 : 0;
          imgData.data[i*4 + 0] = 255; // red overlay
          imgData.data[i*4 + 1] = 0;
          imgData.data[i*4 + 2] = 0;
          imgData.data[i*4 + 3] = r.mask[i] ? 120 : 0;
        }
        mctx.putImageData(imgData, 0, 0);
        // draw scaled onto texture canvas
        tctx.drawImage(maskCanvas, drawParams.dx, drawParams.dy, drawParams.dw, drawParams.dh);

        // draw bbox and centroid
        const bbox = r.bbox;
        const topLeft = imageToCanvasCoords(bbox.minX, bbox.minY, drawParams, imgW, imgH);
        const bottomRight = imageToCanvasCoords(bbox.maxX, bbox.maxY, drawParams, imgW, imgH);
        tctx.strokeStyle = (rid === state.activeRegionId) ? '#00f' : '#333';
        tctx.lineWidth = 1;
        tctx.strokeRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);

        const centroidCanvas = imageToCanvasCoords(r.centroid.x, r.centroid.y, drawParams, imgW, imgH);
        tctx.fillStyle = '#0f0';
        tctx.beginPath();
        tctx.arc(centroidCanvas.x, centroidCanvas.y, 3, 0, Math.PI*2);
        tctx.fill();

        // pivot handle
        const pivotCanvas = imageToCanvasCoords(r.pivot.x, r.pivot.y, drawParams, imgW, imgH);
        tctx.fillStyle = '#ff0';
        tctx.beginPath();
        tctx.arc(pivotCanvas.x, pivotCanvas.y, 5, 0, Math.PI*2);
        tctx.fill();
        tctx.strokeStyle = '#000';
        tctx.stroke();
      }
    } catch (err) {
      // surface structured error
      console.error({ module: 'uiGlue.redraw', error: String(err) });
    }
  }

  // public API: loadTexture
  async function loadTexture(source) {
    try {
      const loaded = await textureLoader.loadTexture(source);
      // create a canvas copy for consistent drawing
      const canvas = document.createElement('canvas');
      canvas.width = loaded.width;
      canvas.height = loaded.height;
      const ctx = canvas.getContext('2d');
      ctx.putImageData(loaded.imageData, 0, 0);
      state.loaded = { width: loaded.width, height: loaded.height, imageData: loaded.imageData, canvas };
      redraw();
      return state.loaded;
    } catch (err) {
      const structured = { module: 'textureLoader', error: String(err), timestamp: Date.now() };
      console.error(structured);
      throw structured;
    }
  }

  // sample and define region at canvas coordinates
  function defineRegionAtCanvasXY(canvasX, canvasY, tolerance = state.tolerance) {
    if (!state.loaded) throw new Error('No texture loaded');
    const drawParams = state.loaded.drawParams;
    const imgCoords = canvasToImageCoords(canvasX, canvasY, drawParams, state.loaded.width, state.loaded.height);
    const region = regionDef.defineRegion(state.loaded.imageData, imgCoords, tolerance);
    // create regionId
    const regionId = 'r' + (state.regions.size + 1);
    // store region metadata
    const rmeta = {
      id: regionId,
      mask: region.mask,
      bbox: region.bbox,
      centroid: region.centroid,
      pivot: region.centroid,
      width: region.width,
      height: region.height
    };
    state.regions.set(regionId, rmeta);
    // register with pivot manager and transform controller
    pivotManager.createRegion(regionId, { bbox: region.bbox, centroid: region.centroid });
    transformController.createRegion(regionId, { pivot: pivotManager.getPivot(regionId), transform: { tx:0,ty:0,scale:1 } });
    // set active
    state.activeRegionId = regionId;
    redraw();
    return rmeta;
  }

  // set pivot by canvas coords (draggable UI will call this)
  function setPivotAtCanvasXY(regionId, canvasX, canvasY, constrainToBBox = true) {
    if (!state.loaded) throw new Error('No texture loaded');
    const drawParams = state.loaded.drawParams;
    const imgCoords = canvasToImageCoords(canvasX, canvasY, drawParams, state.loaded.width, state.loaded.height);
    const pivot = pivotManager.setPivot(regionId, imgCoords.x, imgCoords.y, { constrainToBBox });
    // update local region meta
    const meta = state.regions.get(regionId);
    if (meta) { meta.pivot = pivot; state.regions.set(regionId, meta); }
    transformController.setPivot(regionId, pivot);
    redraw();
    return pivot;
  }

  // controller pad handling: simple mapping: drag X->tx, drag Y->ty, wheel->scale
  function attachControllerPadEvents() {
    let dragging = false;
    let last = null;
    controllerCanvas.addEventListener('pointerdown', (ev) => {
      dragging = true;
      last = { x: ev.offsetX, y: ev.offsetY };
      controllerCanvas.setPointerCapture(ev.pointerId);
    });
    controllerCanvas.addEventListener('pointermove', (ev) => {
      if (!dragging || !state.activeRegionId) return;
      const dx = ev.offsetX - last.x;
      const dy = ev.offsetY - last.y;
      last = { x: ev.offsetX, y: ev.offsetY };
      // scale movement to reasonable tx/ty deltas
      const scaleFactor = 1;
      const current = transformController.getTransform(state.activeRegionId);
      const newTx = current.tx + dx * scaleFactor;
      const newTy = current.ty + dy * scaleFactor;
      transformController.setTransform(state.activeRegionId, { tx: newTx, ty: newTy });
      redraw();
    });
    controllerCanvas.addEventListener('pointerup', (ev) => {
      dragging = false;
      last = null;
    });
    controllerCanvas.addEventListener('wheel', (ev) => {
      if (!state.activeRegionId) return;
      ev.preventDefault();
      const delta = ev.deltaY < 0 ? 1.05 : 0.95;
      const current = transformController.getTransform(state.activeRegionId);
      const newScale = current.scale * delta;
      transformController.setTransform(state.activeRegionId, { scale: newScale });
      redraw();
    }, { passive: false });
  }

  // keyboard shortcuts: R = record keyframe, Space = play/pause toggle
  function attachKeyboardShortcuts() {
    window.addEventListener('keydown', (ev) => {
      if (ev.key === 'r' || ev.key === 'R') {
        try { recordKeyframe(); } catch (e) { console.error({ module: 'uiGlue.recordKeyframe', error: String(e) }); }
      } else if (ev.code === 'Space') {
        ev.preventDefault();
        togglePlayback();
      }
    });
  }

  function recordKeyframe() {
    if (!state.activeRegionId) throw new Error('No active region to record');
    const t = performance.now() / 1000; // seconds
    const transform = transformController.getTransform(state.activeRegionId);
    const id = keyframeStore.recordKeyframe(t, state.activeRegionId, transform);
    return id;
  }

  function togglePlayback() {
    state.isPlaying = !state.isPlaying;
    // simple playback loop not implemented in full; notify listeners
    return state.isPlaying;
  }

  // export project: gather textures, regions, keyframes
  function exportProject(opts = { embedTextures: true }) {
    try {
      const textures = [];
      if (state.loaded) {
        textures.push({ id: 'tex0', width: state.loaded.width, height: state.loaded.height, canvas: state.loaded.canvas });
      }
      const regions = [];
      for (const [id, r] of state.regions.entries()) {
        regions.push({
          id,
          textureId: 'tex0',
          bbox: r.bbox,
          centroid: r.centroid,
          pivot: pivotManager.getPivot(id),
          mask: r.mask,
          width: r.width,
          height: r.height
        });
      }
      // collect keyframes from store
      const kframes = keyframeStore.listKeyframes();
      const manifest = exporter.exportProject({ textures, regions, keyframes: kframes }, opts);
      return manifest;
    } catch (err) {
      const structured = { module: 'uiGlue.exportProject', error: String(err), timestamp: Date.now() };
      console.error(structured);
      throw structured;
    }
  }

  // wire transformController change notifications to redraw and keep UI state consistent
  transformController.onChange((regionId, transform, pivot) => {
    // update local region meta if present
    const meta = state.regions.get(regionId);
    if (meta) {
      meta.pivot = pivot;
      state.regions.set(regionId, meta);
    }
    redraw();
  });

  // attach events
  textureCanvas.addEventListener('click', (ev) => {
    try {
      const rect = textureCanvas.getBoundingClientRect();
      const cx = ev.clientX - rect.left;
      const cy = ev.clientY - rect.top;
      defineRegionAtCanvasXY(cx, cy, state.tolerance);
    } catch (err) {
      console.error({ module: 'uiGlue.textureCanvas.click', error: String(err) });
    }
  });

  // pivot dragging on texture canvas (simple hit test)
  let pivotDrag = null;
  textureCanvas.addEventListener('pointerdown', (ev) => {
    try {
      const rect = textureCanvas.getBoundingClientRect();
      const cx = ev.clientX - rect.left;
      const cy = ev.clientY - rect.top;
      // hit test pivots
      if (!state.activeRegionId) return;
      const meta = state.regions.get(state.activeRegionId);
      if (!meta) return;
      const drawParams = state.loaded.drawParams;
      const pivotCanvas = imageToCanvasCoords(meta.pivot.x, meta.pivot.y, drawParams, meta.width, meta.height);
      const dx = cx - pivotCanvas.x, dy = cy - pivotCanvas.y;
      if (Math.hypot(dx, dy) <= 6) {
        pivotDrag = { regionId: state.activeRegionId, pointerId: ev.pointerId };
        textureCanvas.setPointerCapture(ev.pointerId);
      }
    } catch (err) { console.error({ module: 'uiGlue.pivot.pointerdown', error: String(err) }); }
  });
  textureCanvas.addEventListener('pointermove', (ev) => {
    if (!pivotDrag || pivotDrag.pointerId !== ev.pointerId) return;
    const rect = textureCanvas.getBoundingClientRect();
    const cx = ev.clientX - rect.left;
    const cy = ev.clientY - rect.top;
    try { setPivotAtCanvasXY(pivotDrag.regionId, cx, cy, true); } catch (err) { console.error({ module: 'uiGlue.pivot.move', error: String(err) }); }
  });
  textureCanvas.addEventListener('pointerup', (ev) => {
    if (pivotDrag && pivotDrag.pointerId === ev.pointerId) {
      textureCanvas.releasePointerCapture(ev.pointerId);
      pivotDrag = null;
    }
  });

  // initialize controller pad events and keyboard
  attachControllerPadEvents();
  attachKeyboardShortcuts();

  // public API
  return {
    init() { redraw(); },
    loadTexture,
    defineRegionAtCanvasXY,
    setPivotAtCanvasXY,
    setTolerance(v) { state.tolerance = Number(v); },
    setActiveRegion(id) { state.activeRegionId = id; redraw(); },
    getActiveRegion() { return state.activeRegionId; },
    recordKeyframe,
    togglePlayback,
    exportProject,
    destroy() {
      // detach listeners if needed (not fully implemented for brevity)
    }
  };
}