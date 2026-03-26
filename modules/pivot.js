// modules/pivot.js

export const pivotState = {
  x: 0.5,
  y: 0.5
};

// Convert canvas click → UV coordinates
export function setPivotFromClick(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const px = event.clientX - rect.left;
  const py = event.clientY - rect.top;

  pivotState.x = px / canvas.width;
  pivotState.y = 1.0 - (py / canvas.height); // flip Y for UV space
}

// Push pivot into shader
export function applyPivotUniform(gl, program) {
  const loc = gl.getUniformLocation(program, "u_pivot");
  gl.uniform2f(loc, pivotState.x, pivotState.y);
}