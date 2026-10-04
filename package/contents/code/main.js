// SPDX-FileCopyrightText: 2026 David / HexMask
// SPDX-License-Identifier: GPL-3.0-or-later

'use strict';

const CLASS_BLACKLIST = [
    'ksmserver ksmserver',
    'ksmserver-logout-greeter ksmserver-logout-greeter',
    'ksplashqml ksplashqml',
    'spectacle org.kde.spectacle'
];

class EtchedHexMaterializeEffect {
    constructor() {
        effect.configChanged.connect(this.loadConfig.bind(this));
        effect.animationEnded.connect(this.onAnimationEnded.bind(this));
        effects.windowAdded.connect(this.onWindowAdded.bind(this));
        effects.windowClosed.connect(this.onWindowClosed.bind(this));
        effects.windowDataChanged.connect(this.onWindowDataChanged.bind(this));

        // Scripted effects can apply this shader directly to KWin's live window texture.
        this.shader = effect.addFragmentShader(Effect.MapTexture, 'hex-materialize.frag');
        this.loadConfig();
    }

    loadConfig() {
        this.duration = animationTime(effect.readConfig('Duration', 1200));
        effect.setUniform(this.shader, 'uCellSize', effect.readConfig('CellSize', 10.0));
        effect.setUniform(this.shader, 'uGlowStrength', effect.readConfig('GlowStrength', 0.42));
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
            !EtchedHexMaterializeEffect.shouldAnimate(window)) {
            return;
        }
        if (window.etchedHexCloseAnimation) {
            cancel(window.etchedHexCloseAnimation);
            delete window.etchedHexCloseAnimation;
        }
        window.etchedHexOpenAnimation = animate({
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
            !EtchedHexMaterializeEffect.shouldAnimate(window)) {
            return;
        }
        if (window.etchedHexOpenAnimation) {
            cancel(window.etchedHexOpenAnimation);
            delete window.etchedHexOpenAnimation;
        }
        window.etchedHexCloseAnimation = animate({
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
        if (window.etchedHexOpenAnimation === animationId) {
            delete window.etchedHexOpenAnimation;
        }
        if (window.etchedHexCloseAnimation === animationId) {
            delete window.etchedHexCloseAnimation;
        }
    }

    onWindowDataChanged(window, role) {
        if (role === Effect.WindowAddedGrabRole && window.etchedHexOpenAnimation &&
            effect.isGrabbed(window, role)) {
            cancel(window.etchedHexOpenAnimation);
            delete window.etchedHexOpenAnimation;
        }
        if (role === Effect.WindowClosedGrabRole && window.etchedHexCloseAnimation &&
            effect.isGrabbed(window, role)) {
            cancel(window.etchedHexCloseAnimation);
            delete window.etchedHexCloseAnimation;
        }
    }
}

new EtchedHexMaterializeEffect();
