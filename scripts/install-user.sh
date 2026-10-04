#!/usr/bin/env bash
# Install or update only this KWin effect in the current user's data directory.
set -euo pipefail

project_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
package_dir="$project_dir/package"
effect_id="etched-hex-materialize"

installed_effects=$(kpackagetool6 --type KWin/Effect --list 2>&1)

if grep -Fqx "$effect_id" <<<"$installed_effects"; then
    kpackagetool6 --type KWin/Effect --upgrade "$package_dir"
else
    kpackagetool6 --type KWin/Effect --install "$package_dir"
fi

# Reload configuration only; this does not restart the Wayland compositor.
qdbus org.kde.KWin /KWin reconfigure
printf 'Installed %s. Enable it in System Settings > Window Management > Desktop Effects.\n' "$effect_id"
