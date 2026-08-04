from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import app  # noqa: E402


def main() -> None:
    shp = app.TI_AM_DIR / "TI_AM_ATUALIZADA.shp"
    if not shp.exists():
        print("missing:", shp)
        raise SystemExit(2)
    gdf = app._read_and_merge_shapefiles([shp])
    print("rows:", len(gdf))
    cols = [c for c in gdf.columns if c != gdf.geometry.name]
    print("columns:", cols)
    if len(gdf) > 0:
        row0 = gdf.iloc[0].to_dict()
        row0.pop(gdf.geometry.name, None)
        # print only first ~20 keys with non-empty values
        shown = 0
        for k in cols:
            v = row0.get(k)
            if v is None or str(v).strip() == "":
                continue
            print(f"{k} = {v}")
            shown += 1
            if shown >= 20:
                break


if __name__ == "__main__":
    main()

