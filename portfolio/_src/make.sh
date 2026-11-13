#!/bin/bash
# Renders all portfolio assets. Run from portfolio/_src
set -e
cd "$(dirname "$0")"
python3 build.py
for P in "nabd:01-nabd-project-management" "mawidak:02-mawidak-booking-platform"; do
  K=${P%%:*}; O=../${P##*:}; mkdir -p "$O/screens"
  for f in $K/0[1-4]-*.html; do n=$(basename "$f" .html); node render.js "$f" "$O/screens/$n.png" 1920 1080; done
  node render.js --hq "$K/thumbnail.html" "$O/thumbnail-1280x720.png" 1280 720
  python3 -c "from PIL import Image;import sys;p=sys.argv[1];Image.open(p).convert('RGB').resize((1280,720),Image.LANCZOS).save(p,optimize=True)" "$O/thumbnail-1280x720.png"
  node render.js --pdf "$K/deck.html" "$O/presentation.pdf" 1280 720
done
