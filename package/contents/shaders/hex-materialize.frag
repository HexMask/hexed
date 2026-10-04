#version 110
// SPDX-FileCopyrightText: 2026 David / HexMask
// SPDX-License-Identifier: GPL-3.0-or-later

uniform sampler2D sampler;
uniform int textureWidth;
uniform int textureHeight;
uniform float animationProgress;
uniform float uCellDensity;
uniform float uGlowStrength;

varying vec2 texcoord0;

vec2 nearestHex(vec2 point) {
    const vec2 spacing = vec2(1.7320508, 1.5);
    vec2 first = mod(point, spacing) - 0.5 * spacing;
    vec2 second = mod(point - 0.5 * spacing, spacing) - 0.5 * spacing;
    return dot(first, first) < dot(second, second) ? first : second;
}

void main() {
    vec4 color = texture2D(sampler, texcoord0);
    float aspect = float(textureWidth) / max(float(textureHeight), 1.0);
    vec2 grid = (texcoord0 - vec2(0.5)) * vec2(aspect, 1.0) * uCellDensity;
    vec2 local = nearestHex(grid);
    vec2 cellCenter = grid - local;
    float radial = length(cellCenter) / max(uCellDensity * 0.72, 0.001);
    float cellReveal = smoothstep(radial - 0.015, radial + 0.045, animationProgress);
    float hexBoundary = max(abs(local.y), abs(local.x) * 0.8660254 + abs(local.y) * 0.5);
    float visible = cellReveal * smoothstep(1.0, 0.90, hexBoundary);
    float advancingEdge = 1.0 - smoothstep(0.015, 0.090, abs(radial - animationProgress));
    float glow = advancingEdge * visible * uGlowStrength;
    vec3 etchedGreen = vec3(0.0549, 0.9098, 0.2549);
    color.rgb = mix(color.rgb, etchedGreen * color.a, glow);
    gl_FragColor = vec4(color.rgb * visible, color.a * visible);
}
