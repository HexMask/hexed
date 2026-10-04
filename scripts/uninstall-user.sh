#!/usr/bin/env bash
# Remove only this user's installed copy of this effect.
set -euo pipefail

kpackagetool6 --type KWin/Effect --remove hexed
qdbus org.kde.KWin /KWin reconfigure
printf 'Removed Hexed from this user account.\n'
