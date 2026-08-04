#!/usr/bin/env bash
# Convert raster images under ./images to WebP (cwebp) and MP4 under ./images to WebM VP9 (ffmpeg).
# Run from repo root: ./scripts/convert-site-media.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg is required (brew install ffmpeg)" >&2
  exit 1
fi
if ! command -v cwebp >/dev/null 2>&1; then
  echo "cwebp is required (brew install webp)" >&2
  exit 1
fi

echo "== WebP (images/) =="
while IFS= read -r -d '' src; do
  base="${src%.*}"
  out="${base}.webp"
  if [[ -f "$out" && "$out" -nt "$src" ]]; then
    continue
  fi
  echo "  $src"
  cwebp -quiet -q 88 "$src" -o "$out"
done < <(find images -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' \) -print0)

echo "== WebM (images/) =="
while IFS= read -r -d '' src; do
  base="${src%.*}"
  out="${base}.webm"
  if [[ -f "$out" && "$out" -nt "$src" ]]; then
    continue
  fi
  echo "  $src"
  ffmpeg -nostdin -hide_banner -loglevel error -y -i "$src" \
    -c:v libvpx-vp9 -crf 32 -b:v 0 -row-mt 1 -an \
    -pix_fmt yuv420p \
    "$out"
done < <(find images -type f -iname '*.mp4' -print0)

echo "Done."
