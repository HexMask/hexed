// SPDX-FileCopyrightText: 2026 David / HexMask
// SPDX-License-Identifier: GPL-3.0-or-later

'use strict';

const CLASS_BLACKLIST = [
    'ksmserver ksmserver',
    'ksmserver-logout-greeter ksmserver-logout-greeter',
    'ksplashqml ksplashqml',
    'spectacle org.kde.spectacle'
];

class HexedEffect {
    constructor() {
        effect.configChanged.connect(this.loadConfig.bind(this));
        effect.animationEnded.connect(this.onAnimationEnded.bind(this));
        effects.windowAdded.connect(this.onWindowAdded.bind(this));
        effects.windowClosed.connect(this.onWindowClosed.bind(this));
        effects.windowDataChanged.connect(this.onWindowDataChanged.bind(this));

        // Scripted effects can apply this shader directly to KWin's live window texture.
        this.shader = effect.addFragmentShader(Effect.MapTexture, 'hexed.frag');
        this.loadConfig();
    }

    loadConfig() {
        this.duration = animationTime(effect.readConfig('Duration', 1800));
        effect.setUniform(this.shader, 'uCellSize', effect.readConfig('CellSize', 10.0));
        effect.setUniform(this.shader, 'uGlowStrength', effect.readConfig('GlowStrength', 0.72));
        effect.setUniform(this.shader, 'uEdgeColor', this.readRGBConfig('EdgeColor', '#0ee841'));
        // The shader works in coordinates centered on the window texture.
        effect.setUniform(this.shader, 'uOrigin', [0.0, 0.0]);
    }

    // KColorButton stores either #RRGGBB or #AARRGGBB. Shaders only need RGB.
    readRGBConfig(key, fallback) {
        const configured = String(effect.readConfig(key, fallback));
        const match = /^#?([a-f\d]{6}|[a-f\d]{8})$/i.exec(configured);
        const hex = match ? match[1] : fallback.slice(1);
        const rgb = hex.length === 8 ? hex.slice(2) : hex;
        return [parseInt(rgb.slice(0, 2), 16) / 255,
            parseInt(rgb.slice(2, 4), 16) / 255,
            parseInt(rgb.slice(4, 6), 16) / 255];
    }

    static shouldAnimate(window) {
        if (CLASS_BLACKLIST.includes(window.windowClass)) {
            return false;
        }
        // Excludes desktop, panels/docks, menus, tooltips, lock screen, outlines,
        // unmanaged surfaces, and other special windows.
        if (window.desktopWindow || window.dock || window.popupWindow || window.lockScreen ||
            window.outline || window.specialWindow || !window.managed) {
            return false;
        }
        return window.normalWindow || window.dialog;
    }

    onWindowAdded(window) {
        if (effects.hasActiveFullScreenEffect || !window.visible ||
            effect.isGrabbed(window, Effect.WindowAddedGrabRole) ||
            !HexedEffect.shouldAnimate(window)) {
            return;
        }
        if (window.hexedCloseAnimation) {
            cancel(window.hexedCloseAnimation);
            delete window.hexedCloseAnimation;
        }
        window.hexedOpenAnimation = animate({
            window: window,
            duration: this.duration,
            curve: QEasingCurve.OutCubic,
            animations: [{
                type: Effect.ShaderUniform,
                fragmentShader: this.shader,
                uniform: 'uProgress',
                from: 0.0,
                to: 1.0,
                // Explicit even though KWin defaults to it: opening windows must
                // remain paintable if their lifecycle changes during the effect.
                keepAlive: true
            }]
        });
    }

    onWindowClosed(window) {
        if (effects.hasActiveFullScreenEffect || window.skipsCloseAnimation ||
            effect.isGrabbed(window, Effect.WindowClosedGrabRole) ||
            !HexedEffect.shouldAnimate(window)) {
            return;
        }
        if (window.hexedOpenAnimation) {
            cancel(window.hexedOpenAnimation);
            delete window.hexedOpenAnimation;
        }
        window.hexedCloseAnimation = animate({
            window: window,
            duration: this.duration,
            curve: QEasingCurve.InCubic,
            animations: [{
                // ShaderUniform interpolates uProgress itself. Unlike Effect.Shader,
                // it honors 1 → 0 and therefore starts the close as a normal window.
                type: Effect.ShaderUniform,
                fragmentShader: this.shader,
                uniform: 'uProgress',
                from: 1.0,
                to: 0.0,
                // AnimationEffect retains the deleted window until this animation
                // completes, avoiding a blank frame between live and closing paint.
                keepAlive: true
            }]
        });
    }

    onAnimationEnded(window, animationId) {
        if (window.hexedOpenAnimation === animationId) {
            delete window.hexedOpenAnimation;
        }
        if (window.hexedCloseAnimation === animationId) {
            delete window.hexedCloseAnimation;
        }
    }

    onWindowDataChanged(window, role) {
        if (role === Effect.WindowAddedGrabRole && window.hexedOpenAnimation &&
            effect.isGrabbed(window, role)) {
            cancel(window.hexedOpenAnimation);
            delete window.hexedOpenAnimation;
        }
        if (role === Effect.WindowClosedGrabRole && window.hexedCloseAnimation &&
            effect.isGrabbed(window, role)) {
            cancel(window.hexedCloseAnimation);
            delete window.hexedCloseAnimation;
        }
    }
}

new HexedEffect();
