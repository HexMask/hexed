# Etched Hex Materialize

Etched Hex Materialize is a Plasma 6 KWin desktop effect for the Etched theme. Normal
application windows reveal from their center through a 5 px micro-hex mask; on close,
the field reverses. The cells are a transient reveal mask, not an overlay: only a thin
dark-green edge and restrained `#0ee841` advancing frontier are visible before the
window resolves cleanly.

It deliberately excludes desktop windows, panels and docks, menus, tooltips, other
popups, screen-lock surfaces, unmanaged windows, and KWin outlines. It also opts into
KWin's `toplevel-open-close-animation` exclusive category, so select this effect instead
of another opening/closing animation such as Fade or RGB Warp.

## Compatibility

Target: Fedora 44, KDE Plasma 6, KWin 6.7+, Wayland with OpenGL compositing.

This is a **scripted KWin effect**, not a fake QML overlay. The JavaScript effect uses
KWin's `Effect.Shader` path to apply the GLSL fragment shader directly to each live
window texture. That is the smallest supported route for animating actual window content
on this KWin release. Both GLSL 1.40 (current) and GLSL 1.10 compatibility shaders are
included because the KWin packaging API expects both variants.

## Install locally

```bash
./scripts/install-user.sh
```

Then open **System Settings > Window Management > Desktop Effects**, search for
**Etched Hex Materialize**, and enable it. The installer only writes this effect under
`~/.local/share/kwin/effects/`; it never restarts KWin or changes global configuration.

## Remove

```bash
./scripts/uninstall-user.sh
```

## Store release checklist

1. Capture a clean opening and closing animation preview with the effect enabled.
2. Build the distributable package with `./scripts/create-store-archive.sh`.
3. Upload the resulting `.kwineffect` file to the KDE Store's **KWin Effects** category.
4. Use the description from `store-assets/kde-store-listing.md`, then review the public
   preview before submitting.

The code is GPL-3.0-or-later. Add a project website to `package/metadata.json` only when
there is a live project page to link to.
