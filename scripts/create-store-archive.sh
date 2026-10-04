#!/usr/bin/env bash
# Create a clean KWin-effect archive suitable for KDE Store upload.
set -euo pipefail

project_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
output_dir="$project_dir/dist"
archive="$output_dir/green-hex-1.0.0.kwineffect"

mkdir -p "$output_dir"
rm -f "$archive"
(cd "$project_dir/package" && zip -qr "$archive" metadata.json contents)
printf '%s\n' "$archive"
