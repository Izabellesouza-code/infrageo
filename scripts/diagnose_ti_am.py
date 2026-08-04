from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import app  # noqa: E402


def main() -> None:
    rules = sorted({r.rule for r in app.app.url_map.iter_rules()})
    print("app_file:", app.__file__)
    print("project_root:", app.PROJECT_ROOT)
    print("assets_dir:", app.ASSETS_DIR)
    print("ti_am_dir:", app.TI_AM_DIR)
    fixed = app.TI_AM_DIR / "TI_AM_ATUALIZADA.shp"
    print("fixed_shp_exists:", fixed.exists(), str(fixed))
    print("has_route_/layers/ti-am:", "/layers/ti-am" in rules)
    print("has_route_/layers/ti-am/info:", "/layers/ti-am/info" in rules)
    # sanity: layer discovery sees TI shapefile
    idx = app._discover_shapefiles()
    hits = [info["name"] for info in idx.values() if "ti_am_atualizada" in info["name"].lower()]
    print("discovered_shps:", len(idx))
    print("discovered_ti_hits:", len(hits))
    if hits:
        print("ti_hit0:", hits[0])
    # dump first 20 rules for quick scan
    print("routes_sample:", json.dumps(rules[:20], ensure_ascii=False))


if __name__ == "__main__":
    main()

