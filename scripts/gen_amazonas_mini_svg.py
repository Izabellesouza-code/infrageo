"""Gera miniatura SVG do contorno do AM a partir do shapefile de limite do projeto."""
from pathlib import Path

import geopandas as gpd

ROOT = Path(__file__).resolve().parents[1]
SHP = ROOT / "LIMITE ESTADUAL" / "LIMITE_MUNICIPAL_SEPLAN.shp"
OUT = ROOT / "static" / "images" / "amazonas-estado-mini.svg"


def main() -> None:
    g = gpd.read_file(SHP)
    geom = g.dissolve().geometry.iloc[0]
    simp = geom.simplify(0.12)
    if simp.geom_type == "MultiPolygon":
        polys = sorted(simp.geoms, key=lambda x: x.area, reverse=True)
        simp = polys[0]

    minx, miny, maxx, maxy = simp.bounds
    pad = 0.02 * max(maxx - minx, maxy - miny)
    minx -= pad
    miny -= pad
    maxx += pad
    maxy += pad
    w, h = maxx - minx, maxy - miny
    size = 48.0

    def tx(lon: float, lat: float) -> tuple[float, float]:
        x = (lon - minx) / w * size
        y = (maxy - lat) / h * size
        return round(x, 2), round(y, 2)

    ex = list(simp.exterior.coords)
    pts = [tx(lon, lat) for lon, lat in ex]
    x0, y0 = pts[0]
    d = f"M {x0} {y0}"
    for x, y in pts[1:]:
        d += f" L {x} {y}"
    d += " Z"

    svg = f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="48" height="48" role="img" aria-label="Contorno do Amazonas">
  <path fill="rgba(13,127,63,0.35)" stroke="rgba(13,80,45,0.95)" stroke-width="0.9" stroke-linejoin="round" d="{d}"/>
</svg>
"""
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(svg, encoding="utf-8")
    print("wrote", OUT, "points", len(pts))


if __name__ == "__main__":
    main()
