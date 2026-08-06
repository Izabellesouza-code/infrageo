#!/usr/bin/env python3
"""Converte todos os .shp do projeto para .geojson (WGS84) ao lado do shapefile."""
from __future__ import annotations

import argparse
import gc
import json
import sys
from pathlib import Path

import geopandas as gpd

ROOT = Path(__file__).resolve().parents[1]
SEARCH_ROOTS = [
    ROOT / "assets",
    ROOT / "LIMITE ESTADUAL",
]


def _read_shp(shp: Path) -> gpd.GeoDataFrame:
    last_err: Exception | None = None

    def _try_read(path: Path) -> gpd.GeoDataFrame | None:
        nonlocal last_err
        for enc in (None, "latin1", "cp1252", "utf-8"):
            try:
                gdf = gpd.read_file(path) if enc is None else gpd.read_file(path, encoding=enc)
                if gdf is None:
                    continue
                try:
                    if gdf.crs is not None and getattr(gdf.crs, "to_epsg", lambda: None)() != 4326:
                        gdf = gdf.to_crs(epsg=4326)
                    elif gdf.crs is None:
                        gdf = gdf.set_crs(epsg=4326, allow_override=True)
                except Exception:
                    try:
                        gdf = gdf.set_crs(epsg=4326, allow_override=True)
                    except Exception:
                        pass
                return gdf
            except Exception as e:
                last_err = e
                continue
        return None

    gdf = _try_read(shp)
    if gdf is not None:
        return gdf

    # Sem .shx: reconstrói índice com pyshp em pasta temporária
    if not shp.with_suffix(".shx").exists():
        import shutil
        import tempfile
        import shapefile

        tmp = Path(tempfile.mkdtemp(prefix="shpfix_"))
        try:
            for ext in (".shp", ".dbf", ".prj", ".cpg", ".sbn", ".sbx"):
                src = shp.with_suffix(ext)
                if src.exists():
                    shutil.copy2(src, tmp / src.name)
            local = tmp / shp.name
            r = shapefile.Reader(str(local))
            w = shapefile.Writer(str(local.with_suffix("")), shapeType=r.shapeType)
            w.fields = list(r.fields[1:])
            for sr in r.iterShapeRecords():
                w.shape(sr.shape)
                w.record(*sr.record)
            w.close()
            gdf = _try_read(local)
            if gdf is not None:
                return gdf
        finally:
            shutil.rmtree(tmp, ignore_errors=True)

    raise RuntimeError(f"Falha ao ler {shp}: {last_err}")


def convert_one(shp: Path, *, force: bool = False, simplify: float = 0.0) -> tuple[str, Path | None]:
    out = shp.with_suffix(".geojson")
    if out.exists() and not force:
        try:
            if out.stat().st_mtime >= shp.stat().st_mtime and out.stat().st_size > 20:
                return "skip", out
        except Exception:
            pass

    gdf = _read_shp(shp)
    if simplify and simplify > 0:
        try:
            gdf = gdf.set_geometry(gdf.geometry.simplify(simplify, preserve_topology=True))
        except Exception:
            pass

    # Evita Timestamp não-JSON
    for col in list(gdf.columns):
        if col == gdf.geometry.name:
            continue
        try:
            if str(gdf[col].dtype).startswith("datetime"):
                gdf[col] = gdf[col].astype(str)
        except Exception:
            continue

    out.write_text(gdf.to_json(), encoding="utf-8")
    del gdf
    gc.collect()
    return "ok", out


def main() -> int:
    parser = argparse.ArgumentParser(description="Converte SHP → GeoJSON")
    parser.add_argument("--force", action="store_true", help="Regrava mesmo se .geojson existir")
    parser.add_argument(
        "--simplify",
        type=float,
        default=0.0,
        help="Tolerância de simplify em graus (0 = sem simplify)",
    )
    parser.add_argument(
        "--root",
        type=str,
        default="",
        help="Pasta única (senão usa assets/ e LIMITE ESTADUAL/)",
    )
    args = parser.parse_args()

    roots = [Path(args.root)] if args.root else [p for p in SEARCH_ROOTS if p.exists()]
    shps: list[Path] = []
    for root in roots:
        for p in root.rglob("*.shp"):
            if p.is_file() and not any(part.startswith(".") for part in p.parts):
                # ignora locks / cópias estranhas
                name = p.name.lower()
                if name.endswith(".shp") and ".lock" not in name:
                    shps.append(p)

    shps = sorted(set(shps), key=lambda p: str(p).lower())
    print(f"Encontrados {len(shps)} shapefiles")

    ok = skip = fail = 0
    for i, shp in enumerate(shps, 1):
        try:
            rel = shp.relative_to(ROOT)
        except Exception:
            rel = shp
        try:
            status, out = convert_one(shp, force=args.force, simplify=args.simplify)
            if status == "skip":
                skip += 1
                print(f"[{i}/{len(shps)}] SKIP {rel}")
            else:
                ok += 1
                size_mb = (out.stat().st_size / (1024 * 1024)) if out else 0
                print(f"[{i}/{len(shps)}] OK   {rel} -> {out.name} ({size_mb:.2f} MB)")
        except Exception as e:
            fail += 1
            print(f"[{i}/{len(shps)}] FAIL {rel}: {e}", file=sys.stderr)

    print(json.dumps({"ok": ok, "skip": skip, "fail": fail, "total": len(shps)}))
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
