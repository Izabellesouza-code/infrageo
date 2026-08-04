"""Gera favicon PNG a partir do contorno do Amazonas."""
from __future__ import annotations

import re
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1] if Path(__file__).name == "make_favicon_amazonas.py" else Path.cwd()
# script may live in tools/ or be run from repo root
if (ROOT / "static" / "images" / "amazonas-estado-mini.svg").exists():
    base = ROOT
elif (Path.cwd() / "static" / "images" / "amazonas-estado-mini.svg").exists():
    base = Path.cwd()
else:
    base = Path(__file__).resolve().parents[1]

svg_path = base / "static" / "images" / "amazonas-estado-mini.svg"
out_png = base / "static" / "images" / "favicon.png"
out_32 = base / "static" / "images" / "favicon-32.png"

svg = svg_path.read_text(encoding="utf-8")
m = re.search(r'd="([^"]+)"', svg)
if not m:
    raise SystemExit("path d= not found in SVG")
path = m.group(1)
nums = [float(x) for x in re.findall(r"-?\d+(?:\.\d+)?", path)]
pts = [(nums[i], nums[i + 1]) for i in range(0, len(nums) - 1, 2)]
xs = [p[0] for p in pts]
ys = [p[1] for p in pts]
minx, maxx, miny, maxy = min(xs), max(xs), min(ys), max(ys)
bw, bh = maxx - minx, maxy - miny

size = 64
pad = 7
scale = (size - 2 * pad) / max(bw, bh)
ox = (size - bw * scale) / 2
oy = (size - bh * scale) / 2
mapped = [(ox + (x - minx) * scale, oy + (y - miny) * scale) for x, y in pts]

mask = Image.new("L", (size, size), 0)
ImageDraw.Draw(mask).rounded_rectangle([0, 0, size - 1, size - 1], radius=14, fill=255)
bg = Image.new("RGBA", (size, size), (15, 118, 110, 255))
img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
img.paste(bg, (0, 0), mask)

draw = ImageDraw.Draw(img)
draw.polygon(mapped, fill=(248, 250, 252, 245))
draw.line(mapped + [mapped[0]], fill=(204, 251, 241, 255), width=2)

img.save(out_png, "PNG")
img.resize((32, 32), Image.Resampling.LANCZOS).save(out_32, "PNG")
print(f"wrote {out_png} and {out_32} ({len(pts)} points)")
