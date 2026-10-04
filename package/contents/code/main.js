// SPDX-FileCopyrightText: 2026 David / HexMask
// SPDX-License-Identifier: GPL-3.0-or-later

'use strict';

const CLASS_BLACKLIST = [
    'ksmserver ksmserver',
    'ksmserver-logout-greeter ksmserver-logout-greeter',
    'ksplashqml ksplashqml',
    'spectacle org.kde.spectacle'
];

class GreenHexEffect {
    constructor() {
        effect.configChanged.connect(this.loadConfig.bind(this));
        effect.animationEnded.connect(this.onAnimationEnded.bind(this));
        effects.windowAdded.connect(this.onWindowAdded.bind(this));
        effects.windowClosed.connect(this.onWindowClosed.bind(this));
        effects.windowDataChanged.connect(this.onWindowDataChanged.bind(this));

        // Scripted effects can apply this shader directly to KWin's live window texture.
        this.shader = effect.addFragmentShader(Effect.MapTexture, 'green-hex.frag');
        this.loadConfig();
    }

    loadConfig() {
        this.duration = animationTime(effect.readConfig('Duration', 1800));
        effect.setUniform(this.shader, 'uCellSize', effect.readConfig('CellSize', 10.0));
        effect.setUniform(this.shader, 'uGlowStrength', effect.readConfig('GlowStrength', 0.72));
        effect.setUniform(this.shader, 'uEdgeColor', this.readRGBConfig('EdgeColor', '#0ee841'));
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

    static revealOrigin(window) {
        // KWin can sample a fullscreen surface at a different scale than its
        // logical geometry on Wayland. A logical pointer offset would then
        // bias the field, so fullscreen windows always use texture center.
        if (window.fullScreen) {
            return [0.0, 0.0];
        }
        const cursor = effects.cursorPos;
        const withinWindow = cursor.x >= window.x && cursor.x <= window.x + window.width &&
            cursor.y >= window.y && cursor.y <= window.y + window.height;
        if (!withinWindow) {
            return [0.0, 0.0];
        }
        return [cursor.x - (window.x + window.width * 0.5),
            cursor.y - (window.y + window.height * 0.5)];
    }

    setRevealOrigin(window, origin) {
        window.greenHexOrigin = origin;
        effect.setUniform(this.shader, 'uOrigin', origin);
    }

    onWindowAdded(window) {
        if (effects.hasActiveFullScreenEffect || !window.visible ||
            effect.isGrabbed(window, Effect.WindowAddedGrabRole) ||
            !GreenHexEffect.shouldAnimate(window)) {
            return;
        }
        if (window.greenHexCloseAnimation) {
            cancel(window.greenHexCloseAnimation);
            delete window.greenHexCloseAnimation;
        }
        this.setRevealOrigin(window, GreenHexEffect.revealOrigin(window));
        window.greenHexOpenAnimation = animate({
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
            !GreenHexEffect.shouldAnimate(window)) {
            return;
        }
        if (window.greenHexOpenAnimation) {
            cancel(window.greenHexOpenAnimation);
            delete window.greenHexOpenAnimation;
        }
        // Preserve the opening origin so the close contracts into the same field.
        this.setRevealOrigin(window, window.greenHexOrigin ||
            GreenHexEffect.revealOrigin(window));
        window.greenHexCloseAnimation = animate({
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
        if (window.greenHexOpenAnimation === animationId) {
            delete window.greenHexOpenAnimation;
        }
        if (window.greenHexCloseAnimation === animationId) {
            delete window.greenHexCloseAnimation;
        }
    }

    onWindowDataChanged(window, role) {
        if (role === Effect.WindowAddedGrabRole && window.greenHexOpenAnimation &&
            effect.isGrabbed(window, role)) {
            cancel(window.greenHexOpenAnimation);
            delete window.greenHexOpenAnimation;
        }
        if (role === Effect.WindowClosedGrabRole && window.greenHexCloseAnimation &&
            effect.isGrabbed(window, role)) {
            cancel(window.greenHexCloseAnimation);
            delete window.greenHexCloseAnimation;
        }
    }
}

new GreenHexEffect();
