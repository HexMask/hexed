#version 140
// SPDX-FileCopyrightText: 2026 David / HexMask
// SPDX-License-Identifier: GPL-3.0-or-later

uniform sampler2D sampler;
uniform int textureWidth;
uniform int textureHeight;
uniform float uProgress;
uniform float uCellSize;
uniform float uGlowStrength;

in vec2 texcoord0;
out vec4 fragColor;

// Returns the vector from the center of the nearest pointy-top hex cell.
vec2 nearestHex(vec2 point) {
    const vec2 spacing = vec2(1.7320508, 1.5);
    vec2 first = mod(point, spacing) - 0.5 * spacing;
    vec2 second = mod(point - 0.5 * spacing, spacing) - 0.5 * spacing;
    return dot(first, first) < dot(second, second) ? first : second;
}

float hash(vec2 point) {
    return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
    vec4 color = texture(sampler, texcoord0);
    vec2 windowSize = vec2(float(textureWidth), float(textureHeight));
    vec2 grid = (texcoord0 - vec2(0.5)) * windowSize / uCellSize;
    vec2 local = nearestHex(grid);
    vec2 cellCenter = grid - local;

    // The cell grid is in pixels: at 5 px this is a micro-mask, not a pattern.
    float radial = length(cellCenter * uCellSize) / max(length(windowSize * 0.5), 1.0);
    float threshold = clamp(radial + (hash(cellCenter) - 0.5) * 0.035, 0.0, 1.0);
    float cellReveal = smoothstep(threshold - 0.004, threshold + 0.004, uProgress);
    float hexBoundary = max(abs(local.y), abs(local.x) * 0.8660254 + abs(local.y) * 0.5);
    float hexMask = 1.0 - smoothstep(0.955, 1.0, hexBoundary);
    float visible = cellReveal * hexMask;

    // A hairline white contour makes each small cell readable while it is part
    // of the mask. It is multiplied by fieldActive, so no outline remains once
    // the window has fully materialized.
    float hexLine = smoothstep(0.90, 0.985, hexBoundary);
    float edgeDistance = abs(threshold - uProgress);
    float fieldActive = 1.0 - smoothstep(0.990, 1.0, uProgress);
    visible = mix(1.0, visible, fieldActive);
    float whiteOutline = hexLine * visible * fieldActive * 0.82;
    color.rgb = mix(color.rgb, vec3(color.a), whiteOutline);

    // Approximately 1–2 px on typical application windows: a thin frontier only.
    float advancingEdge = 1.0 - smoothstep(0.0015, 0.005, edgeDistance);
    float glow = advancingEdge * visible * uGlowStrength * fieldActive;
    vec3 etchedGreen = vec3(0.0549, 0.9098, 0.2549); // #0ee841
    color.rgb = mix(color.rgb, etchedGreen * color.a, glow);
    fragColor = vec4(color.rgb * visible, color.a * visible);
}
