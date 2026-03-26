// modules/region-mask.js

export const regionState = {
  sampleColor: [1.0, 1.0, 1.0],
  tolerance: 0.1
};

// Called when user clicks the texture canvas
export function sampleColorAt(gl, x, y, width, height) {
  const pixel = new Uint8Array(4);
  gl.readPixels(x, height - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

  regionState.sampleColor = [
    pixel[0] / 255,
    pixel[1] / 255,
    pixel[2] / 255
  ];
}

// Called when user moves the tolerance slider
export function setTolerance(value) {
  regionState.tolerance = value;
}

// Push uniforms into shader
export function applyRegionUniforms(gl, program) {
  const locColor = gl.getUniformLocation(program, "u_sampleColor");
  const locTol = gl.getUniformLocation(program, "u_tolerance");

  gl.uniform3fv(locColor, regionState.sampleColor);
  gl.uniform1f(locTol, regionState.tolerance);
}