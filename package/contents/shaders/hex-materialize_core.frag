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

// Adapted from Burn My Windows' GPL-3.0-or-later Hexagon effect. This is a
// proper pointy-top hex distance field: xy is the nearest cell's local point,
// z is its normalized distance from the edge (1 at its center, 0 at its edge).
vec3 hexCell(vec2 point) {
    const float edgeLength = 1.1547005; // sqrt(4 / 3)
    const vec2 repeat = vec2(3.0 * edgeLength, 2.0);
    vec2 first = mod(point, repeat) - 0.5 * repeat;
    vec2 second = mod(point + 0.5 * repeat, repeat) - 0.5 * repeat;
    vec2 firstAbs = abs(first);
    vec2 secondAbs = abs(second);
    float firstDistance = max(firstAbs.x / edgeLength + firstAbs.y * 0.5, firstAbs.y);
    float secondDistance = max(secondAbs.x / edgeLength + secondAbs.y * 0.5, secondAbs.y);
    vec2 local = firstDistance < secondDistance ? first : second;
    return vec3(local, 1.0 - min(firstDistance, secondDistance));
}

float hash(vec2 point) {
    return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
    vec4 color = texture(sampler, texcoord0);
    vec2 windowSize = vec2(float(textureWidth), float(textureHeight));
    vec2 grid = (texcoord0 - vec2(0.5)) * windowSize / uCellSize;
    vec3 hex = hexCell(grid);
    vec2 cellCenter = grid - hex.xy;

    // The cell grid is in pixels: at 5 px this is a micro-mask, not a pattern.
    float radial = length(cellCenter * uCellSize) / max(length(windowSize * 0.5), 1.0);
    float threshold = clamp(radial + (hash(cellCenter) - 0.5) * 0.035, 0.0, 1.0);
    float cellReveal = smoothstep(threshold - 0.004, threshold + 0.004, uProgress);
    float hexMask = smoothstep(0.018, 0.055, hex.z);
    float visible = cellReveal * hexMask;

    // A hairline white contour makes each small cell readable while it is part
    // of the mask. It is multiplied by fieldActive, so no outline remains once
    // the window has fully materialized.
    // At a 10 px cell size this yields a visibly hexagonal ~2 px perimeter,
    // rather than a sub-pixel edge that reads as ordinary pixelation.
    float hexLine = 1.0 - smoothstep(0.12, 0.30, hex.z);
    float edgeDistance = abs(threshold - uProgress);
    float fieldActive = 1.0 - smoothstep(0.990, 1.0, uProgress);
    visible = mix(1.0, visible, fieldActive);
    float whiteOutline = hexLine * visible * fieldActive;
    color.rgb = mix(color.rgb, vec3(color.a), whiteOutline);

    // Approximately 1–2 px on typical application windows: a thin frontier only.
    float advancingEdge = 1.0 - smoothstep(0.0015, 0.005, edgeDistance);
    float glow = advancingEdge * visible * uGlowStrength * fieldActive;
    vec3 etchedGreen = vec3(0.0549, 0.9098, 0.2549); // #0ee841
    color.rgb = mix(color.rgb, etchedGreen * color.a, glow);
    fragColor = vec4(color.rgb * visible, color.a * visible);
}
