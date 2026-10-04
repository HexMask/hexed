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

    // The field reaches every corner at progress 1.0. Cells turn on as whole,
    // softly antialiased hexagons instead of noisy per-pixel dissolve fragments.
    float radial = length(cellCenter) / max(uCellDensity * 0.72, 0.001);
    float cellReveal = smoothstep(radial - 0.015, radial + 0.045, animationProgress);
    float hexBoundary = max(abs(local.y), abs(local.x) * 0.8660254 + abs(local.y) * 0.5);
    float hexMask = smoothstep(1.0, 0.90, hexBoundary);
    float visible = cellReveal * hexMask;

    // A dark Etched-green honeycomb line makes the cells read as deliberate
    // geometry, rather than as a noisy dissolve. It exists only during the effect.
    float darkOutline = smoothstep(0.72, 0.94, hexBoundary) * visible;
    vec3 etchedDarkGreen = vec3(0.012, 0.180, 0.070);
    color.rgb = mix(color.rgb, etchedDarkGreen * color.a, darkOutline * 0.88);

    // A narrow #0ee841 flash follows the advancing field.
    float advancingEdge = 1.0 - smoothstep(0.015, 0.090, abs(radial - animationProgress));
    float glow = advancingEdge * visible * uGlowStrength;
    vec3 etchedGreen = vec3(0.0549, 0.9098, 0.2549); // #0ee841
    color.rgb = mix(color.rgb, etchedGreen * color.a, glow);
    fragColor = vec4(color.rgb * visible, color.a * visible);
}
