# Hexed

Hexed is a KWin 6 window-animation effect for Plasma 6. It materializes normal windows
from their true center through a glowing hexagonal frontier and dissolves them back into
that field when they close. The transient outline and afterglow default to Etched green;
**Edge color** in Desktop Effects opens a color picker for both.

It is a scripted KWin effect that shades the live window texture directly. Hexed excludes
desktop windows, panels, menus, tooltips, screen-lock surfaces, unmanaged windows, and
KWin outlines. It uses KWin's `toplevel-open-close-animation` category, so enable Hexed
instead of another opening/closing animation effect such as Fade or RGB Warp.

## Compatibility

Fedora 44, KDE Plasma 6, KWin 6.7+, Wayland, and OpenGL compositing.

## Install

```bash
./scripts/install-user.sh
```

Then open **System Settings > Window Management > Desktop Effects**, search for
**Hexed**, and enable it. The installer writes only this effect to the current user's
KWin data directory; it does not restart KWin or change global settings.

To remove the user-local installation:

```bash
./scripts/uninstall-user.sh
```

## Package for the KDE Store

```bash
./scripts/create-store-archive.sh
```

The generated `.kwineffect` archive is placed in `dist/`, which is intentionally not
tracked. Store copy and preview assets are in `store-assets/`.

## License and attribution

Hexed is licensed under the [GNU General Public License v3.0 or later](LICENSE).
Copyright and project attribution are recorded in [NOTICE.md](NOTICE.md).
