// modules/controller.js

export const transformState = {
  tx: 0.0,   // translation X
  ty: 0.0,   // translation Y
  scale: 1.0 // uniform scale
};

let dragging = false;
let lastX = 0;
let lastY = 0;

export function attachController(controlCanvas) {
  controlCanvas.addEventListener('mousedown', (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });

  window.addEventListener('mouseup', () => dragging = false);

  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;

    const dx = (e.clientX - lastX) / controlCanvas.width;
    const dy = (e.clientY - lastY) / controlCanvas.height;

    // Modifier keys constrain movement
    if (e.ctrlKey) {
      transformState.tx += dx;
    } else if (e.altKey) {
      transformState.ty -= dy;
    } else {
      transformState.tx += dx;
      transformState.ty -= dy;
    }

    lastX = e.clientX;
    lastY = e.clientY;
  });

  // Zoom with mouse wheel
  controlCanvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomFactor = 1.0 + (e.deltaY * -0.001);
    transformState.scale *= zoomFactor;
  });
}

// Push uniforms into shader
export function applyTransformUniforms(gl, program) {
  const locT = gl.getUniformLocation(program, "u_translate");
  const locS = gl.getUniformLocation(program, "u_scale");

  gl.uniform2f(locT, transformState.tx, transformState.ty);
  gl.uniform1f(locS, transformState.scale);
}