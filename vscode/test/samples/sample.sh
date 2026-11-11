#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="${1:-./build}"
count=0
for f in "$OUT_DIR"/*.json; do
  if [[ -f "$f" ]]; then
    echo "found: $f ($((count += 1)))"
  fi
done
export PATH="$HOME/bin:$PATH"  # prepend
