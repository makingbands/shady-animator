#version 300 es
precision mediump float;

uniform sampler2D u_image;
uniform vec3 u_sampleColor;
uniform float u_tolerance;
uniform vec2 u_pivot;

in vec2 v_texCoord;
out vec4 outColor;

void main() {
    vec4 tex = texture(u_image, v_texCoord);

    // Color distance
    float dist = distance(tex.rgb, u_sampleColor);

    // Mask: 1.0 inside region, 0.0 outside
    float mask = smoothstep(u_tolerance, u_tolerance * 0.5, dist);

    // Preview tint (green overlay)
    vec3 preview = mix(tex.rgb, vec3(0.0, 1.0, 0.0), mask * 0.5);

    outColor = vec4(preview, tex.a);
}