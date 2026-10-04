#version 140
// SPDX-FileCopyrightText: 2026 David / HexMask
// SPDX-License-Identifier: GPL-3.0-or-later

uniform sampler2D sampler;
uniform int textureWidth;
uniform int textureHeight;
uniform float animationProgress;
uniform float uCellDensity;
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

void main() {
    vec4 color = texture(sampler, texcoord0);
    float aspect = float(textureWidth) / max(float(textureHeight), 1.0);
    vec2 grid = (texcoord0 - vec2(0.5)) * vec2(aspect, 1.0) * uCellDensity;
    vec2 local = nearestHex(grid);
    vec2 cellCenter = grid - local;

    // The field reaches every corner at progress 1.0. Small individual cells,
    // rather than a tiled surface, create the dense honeycomb front.
    float radial = length(cellCenter) / max(uCellDensity * 0.72, 0.001);
    float cellReveal = smoothstep(radial - 0.015, radial + 0.045, animationProgress);
    float hexBoundary = max(abs(local.y), abs(local.x) * 0.8660254 + abs(local.y) * 0.5);
    float hexMask = smoothstep(1.0, 0.90, hexBoundary);
    float visible = cellReveal * hexMask;

    // Fine dark-green outlines define cells close to the advancing edge, with
    // a little residue behind it. This preserves the dark window architecture.
    float hexLine = smoothstep(0.84, 0.975, hexBoundary);
    float edgeDistance = abs(radial - animationProgress);
    float fieldResidue = 1.0 - smoothstep(0.04, 0.34, edgeDistance);
    float darkOutline = hexLine * visible * (0.28 + 0.72 * fieldResidue);
    vec3 etchedDarkGreen = vec3(0.008, 0.145, 0.050);
    color.rgb = mix(color.rgb, etchedDarkGreen * color.a, darkOutline);

    // A narrow #0ee841 flash follows the advancing field.
    float advancingEdge = 1.0 - smoothstep(0.008, 0.070, edgeDistance);
    float glow = advancingEdge * visible * uGlowStrength;
    vec3 etchedGreen = vec3(0.0549, 0.9098, 0.2549); // #0ee841
    color.rgb = mix(color.rgb, etchedGreen * color.a, glow);
    fragColor = vec4(color.rgb * visible, color.a * visible);
}
