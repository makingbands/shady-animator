#version 300 es
precision mediump float;

uniform sampler2D u_image;
uniform vec3 u_sampleColor;
uniform float u_tolerance;

uniform vec2 u_pivot;
uniform vec2 u_translate;
uniform float u_scale;

in vec2 v_texCoord;
out vec4 outColor;

// Optional rotation (disabled for now)
float u_rotation = 0.0;

mat2 rotate2D(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}

void main() {
    vec4 tex = texture(u_image, v_texCoord);

    // --- REGION MASK ---
    float dist = distance(tex.rgb, u_sampleColor);
    float mask = smoothstep(u_tolerance, u_tolerance * 0.5, dist);

    // --- ORIGINAL UV ---
    vec2 uv = v_texCoord;

    // --- TRANSFORMED UV ---
    vec2 tuv = uv;

    // Translate relative to pivot
    tuv -= u_pivot;

    // Scale
    tuv *= u_scale;

    // Optional rotation (currently 0)
    tuv = rotate2D(u_rotation) * tuv;

    // Translate back + user translation
    tuv += u_pivot + u_translate;

    // Sample transformed pixel
    vec4 transformed = texture(u_image, tuv);

    // Mix based on mask
    outColor = mix(tex, transformed, mask);
}