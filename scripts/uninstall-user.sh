#!/usr/bin/env bash
# Remove only this user's installed copy of this effect.
set -euo pipefail

kpackagetool6 --type KWin/Effect --remove green-hex
qdbus org.kde.KWin /KWin reconfigure
printf 'Removed Green Hex from this user account.\n'
