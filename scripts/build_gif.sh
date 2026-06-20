#!/usr/bin/env bash
# Render frames (pure Python) → clean looping GIF + MP4 via ffmpeg.
set -e
cd "$(dirname "$0")/.."
echo "== rendering frames =="
python3 scripts/make_gif.py
FPS=14
echo "== palette =="
ffmpeg -y -loglevel error -framerate $FPS -i frames/f%03d.png \
  -vf "fps=$FPS,palettegen=stats_mode=full" palette.png
echo "== welcome.gif =="
ffmpeg -y -loglevel error -framerate $FPS -i frames/f%03d.png -i palette.png \
  -lavfi "fps=$FPS,paletteuse=dither=sierra2_4a" welcome.gif
echo "== welcome.mp4 =="
ffmpeg -y -loglevel error -framerate $FPS -i frames/f%03d.png \
  -vf "fps=$FPS,format=yuv420p" -c:v libx264 -crf 20 -movflags +faststart welcome.mp4
ls -la welcome.gif welcome.mp4
