import json
import hashlib
import io
import os
import re
import gc
import gzip
from pathlib import Path
import tempfile
import zipfile
import datetime
import shapefile  # pyshp


def _bootstrap_gis_env() -> None:
    """Define GDAL_DATA/PROJ_* se estiverem vazios (necessário para ler SHP no Windows/QGIS)."""
    qgis_roots = [
        Path(r"C:\Program Files\QGIS 3.40.7"),
        Path(r"C:\Program Files\QGIS 3.34.0"),
        Path(os.environ.get("QGIS_PREFIX_PATH", "")),
    ]
    gdal_candidates = []
    proj_candidates = []
    for root in qgis_roots:
        if not root or not root.exists():
            continue
        gdal_candidates.extend(
            [
                root / "apps" / "gdal" / "share" / "gdal",
                root / "share" / "gdal",
            ]
        )
        proj_candidates.extend(
            [
                root / "share" / "proj",
                root / "apps" / "proj4" / "share" / "proj",
            ]
        )

    def _set_if_missing(var_names: list[str], candidates: list[Path]) -> None:
        if any(os.environ.get(v) for v in var_names):
            return
        for c in candidates:
            try:
                if c.is_dir():
                    for v in var_names:
                        os.environ[v] = str(c)
                    return
            except Exception:
                continue

    _set_if_missing(["GDAL_DATA"], gdal_candidates)
    _set_if_missing(["PROJ_DATA", "PROJ_LIB"], proj_candidates)


_bootstrap_gis_env()

from flask import Flask, jsonify, render_template, abort, send_file, send_from_directory
from flask import request
import geopandas as gpd
import pandas as pd
from shapely.geometry import LineString, MultiLineString, Polygon, MultiPolygon
from shapely.ops import polygonize, unary_union


def _runtime_env() -> str:
    return os.environ.get("INFRAGEO_ENV", os.environ.get("FLASK_ENV", "development")).strip().lower()


def _is_production() -> bool:
    return _runtime_env() in ("production", "prod")


def _api_only_mode() -> bool:
    """Só API quando INFRAGEO_API_ONLY=1. Padrão: UI + API (como antes)."""
    raw = os.environ.get("INFRAGEO_API_ONLY")
    if raw is not None and raw.strip() != "":
        return raw.strip().lower() in ("1", "true", "yes", "on")
    return False


def _frontend_url() -> str:
    return (
        os.environ.get("INFRAGEO_FRONTEND_URL", "https://infrageo-webgis.vercel.app")
        .strip()
        .rstrip("/")
    )


IS_PRODUCTION = _is_production()
API_ONLY = _api_only_mode()

app = Flask(
    __name__,
    template_folder="templates",
    # Em API-only não serve /static (UI fica no Vercel)
    static_folder=None if API_ONLY else "static",
)


@app.before_request
def _cors_preflight():
    if request.method == "OPTIONS":
        return ("", 204)
    return None


@app.after_request
def _add_cors_headers(resp):
    """Permite frontend estático (ex.: Vercel) chamar a API no Render."""
    origin = request.headers.get("Origin") or ""
    allowed = os.environ.get("CORS_ORIGINS", "*").strip()
    if allowed == "*":
        resp.headers["Access-Control-Allow-Origin"] = "*"
    elif origin and origin in {o.strip() for o in allowed.split(",") if o.strip()}:
        resp.headers["Access-Control-Allow-Origin"] = origin
        resp.headers["Vary"] = "Origin"
    resp.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Accept"
    return resp


def _low_memory_mode() -> bool:
    """
    Modo econômico de RAM (Render Free/Starter = 512 MB).
    - INFRAGEO_LOW_MEMORY=1 força liga
    - INFRAGEO_LOW_MEMORY=0 força desliga
    - Sem variável: liga automaticamente no Render
    """
    raw = os.environ.get("INFRAGEO_LOW_MEMORY")
    if raw is not None and raw.strip() != "":
        return raw.strip().lower() in ("1", "true", "yes", "on")
    return bool(os.environ.get("RENDER"))


app.config["DEBUG"] = not IS_PRODUCTION
app.config["TEMPLATES_AUTO_RELOAD"] = not IS_PRODUCTION
app.jinja_env.auto_reload = not IS_PRODUCTION

# PT-BR / UTF-8: garante acentos corretos em JSON e respostas
try:
    # Flask >= 2.2
    app.json.ensure_ascii = False
except Exception:
    # Flask antigo
    app.config["JSON_AS_ASCII"] = False


@app.after_request
def _gzip_json_responses(resp):
    """
    Reduz o "delay" percebido ao carregar camadas grandes:
    - comprime respostas JSON/GeoJSON com gzip quando o cliente suporta
    - evita recompressão/dupla compressão
    """
    try:
        if not resp:
            return resp
        # Já comprimido / streaming / sem body
        if resp.direct_passthrough:
            return resp
        if resp.headers.get("Content-Encoding"):
            return resp
        if resp.status_code < 200 or resp.status_code >= 300:
            return resp

        ct = (resp.headers.get("Content-Type") or "").lower()
        if "application/json" not in ct and "application/geo+json" not in ct:
            return resp

        ae = (request.headers.get("Accept-Encoding") or "").lower()
        if "gzip" not in ae:
            return resp

        data = resp.get_data()
        # Não vale a pena para payload pequeno
        if not data or len(data) < 2048:
            return resp

        gz = gzip.compress(data, compresslevel=1)
        resp.set_data(gz)
        resp.headers["Content-Encoding"] = "gzip"
        resp.headers["Content-Length"] = str(len(gz))
        # Importante para cache/proxies
        vary = resp.headers.get("Vary")
        resp.headers["Vary"] = (vary + ", Accept-Encoding") if vary else "Accept-Encoding"
        return resp
    except Exception:
        return resp


@app.after_request
def _cache_headers(resp):
    """
    Cache leve no navegador para reduzir recarregamentos repetidos.
    (Dados mudam pouco durante a sessão; o servidor já invalida cache interno quando necessário.)
    """
    try:
        if not resp:
            return resp
        ct = (resp.headers.get("Content-Type") or "").lower()
        # Força charset UTF-8 em HTML/JSON para evitar problemas de acentuação em alguns clientes/proxies.
        try:
            if ("text/html" in ct) and ("charset=" not in ct):
                resp.headers["Content-Type"] = "text/html; charset=utf-8"
            if ("application/json" in ct or "application/geo+json" in ct) and ("charset=" not in ct):
                resp.headers["Content-Type"] = resp.headers.get("Content-Type", "application/json") + "; charset=utf-8"
        except Exception:
            pass
        # Cache curto para GeoJSON/JSON das camadas
        if ("application/json" in ct or "application/geo+json" in ct) and resp.status_code == 200:
            max_age = 3600 if IS_PRODUCTION else 300
            resp.headers.setdefault("Cache-Control", f"public, max-age={max_age}")
        # Estáticos: cache mais longo em produção
        if IS_PRODUCTION and resp.status_code == 200:
            path = (request.path or "").lower()
            if path.startswith("/static/") and any(path.endswith(ext) for ext in (".css", ".js", ".svg", ".png", ".webp", ".woff2")):
                resp.headers.setdefault("Cache-Control", "public, max-age=86400")
        # marcador de diagnóstico (inofensivo)
        resp.headers.setdefault("X-InfraGeo-Perf", "1")
        return resp
    except Exception:
        return resp


@app.after_request
def _security_headers(resp):
    if not IS_PRODUCTION or not resp:
        return resp
    try:
        resp.headers.setdefault("X-Content-Type-Options", "nosniff")
        resp.headers.setdefault("X-Frame-Options", "SAMEORIGIN")
        resp.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        return resp
    except Exception:
        return resp


@app.after_request
def _low_memory_release(resp):
    """
    No Render Free/Starter (512 MB), não acumular GeoJSON de várias camadas.
    A resposta já foi montada; liberar caches evita OOM no próximo request.
    """
    try:
        if _low_memory_mode():
            # Função definida mais abaixo; chamada só em runtime.
            _clear_geojson_caches()
    except Exception:
        pass
    return resp


def _find_project_root(start: Path) -> Path:
    """
    Encontra a raiz do projeto de forma portátil (Windows/Linux/macOS),
    subindo diretórios a partir deste arquivo e procurando por "marcadores"
    típicos de raiz de repositório/projeto.
    """
    start = start.resolve()
    markers = ("requirements.txt", "pyproject.toml", "package.json", ".git", "assets")
    for p in (start, *start.parents):
        for m in markers:
            if (p / m).exists():
                return p
    return start


PROJECT_ROOT = _find_project_root(Path(__file__).resolve().parent)
_assets_override = os.environ.get("INFRAGEO_ASSETS_DIR", "").strip()
ASSETS_DIR = Path(_assets_override) if _assets_override else PROJECT_ROOT / "assets"

# Pasta de dados (GeoJSON/SHP) servida como estático no deploy.
# Observação: usamos "assets" como base única e portátil.
DATA_DIR = ASSETS_DIR

# Base padrão para dados espaciais no projeto (somente caminhos relativos ao root).
SHAPEFILE_DIR = ASSETS_DIR
SEGMENTOS_SHP = SHAPEFILE_DIR / "BR-319" / "SEGMENTOS.shp"

# Limite Estadual (AM) — base padrão em Z: (pasta INFRAGEO). Pode sobrescrever com LIMITE_ESTADUAL_DIR
# ou apontar arquivo único com LIMITE_ESTADUAL_SHP.
LIMITE_ESTADUAL_BASE = Path(
    os.environ.get(
        "LIMITE_ESTADUAL_DIR",
        str(SHAPEFILE_DIR / "LIMITE ESTADUAL"),
    )
)

# Bueiros BR-317 — pasta com shapefile(s). Pode sobrescrever com variável de ambiente BUEIROS_BR317_DIR.
BUEIROS_BR317_BASE = Path(
    os.environ.get(
        "BUEIROS_BR317_DIR",
        str(SHAPEFILE_DIR / "BR-317"),
    )
)

# BR-317 — Bueiros (portátil): lê shapefile(s) em assets/BR-317
BR317_BUEIROS_DIR = SHAPEFILE_DIR / "BR-317"

# BR-317 — Rodovia (portátil): lê shapefile(s) em assets/BR-317/RODOVIA
BR317_RODOVIA_DIR = SHAPEFILE_DIR / "BR-317" / "RODOVIA"

# Pontes BR-307 — pasta PONTES. Sobrescrever com PONTES_BR307_DIR ou PONTES_BR307_SHP.
PONTES_BR307_BASE = Path(
    os.environ.get(
        "PONTES_BR307_DIR",
        str(SHAPEFILE_DIR / "BR-307" / "PONTES"),
    )
)

# BR-307 — Pontes (portátil): lê shapefile(s) em assets/BR-307/PONTES
BR307_PONTES_DIR = SHAPEFILE_DIR / "BR-307" / "PONTES"

# BR-307 — Bueiros (opcional): lê shapefile(s) em assets/BR-307/BUEIROS
BR307_BUEIROS_DIR = SHAPEFILE_DIR / "BR-307" / "BUEIROS"

# BR-307 — Rodovia (portátil): lê shapefile(s) em assets/BR-307/RODOVIA
BR307_BASE = SHAPEFILE_DIR / "BR-307"
BR307_RODOVIA_DIR = SHAPEFILE_DIR / "BR-307" / "RODOVIA"

# Jazidas BR-307 — pasta JAZIDAS. Sobrescrever com JAZIDAS_BR307_DIR; ou forçar lista com JAZIDAS_BR307_SHP(S).
JAZIDAS_BR307_BASE = Path(
    os.environ.get(
        "JAZIDAS_BR307_DIR",
        str(SHAPEFILE_DIR / "BR-307" / "JAZIDAS"),
    )
)

# BR-307 — Jazidas (portátil): lê shapefile(s) em assets/BR-307/JAZIDAS
BR307_JAZIDAS_DIR = SHAPEFILE_DIR / "BR-307" / "JAZIDAS"

# TI AM — Terras Indígenas (portátil): lê shapefile(s) em assets/TI_AM_ATUALIZADA
TI_AM_DIR = SHAPEFILE_DIR / "TI_AM_ATUALIZADA"

# Hidrovias AM — fonte fixa solicitada: assets/SNV_HIDROVIAS_AM/SNV_HIDROVIAS_AM.shp
HIDROVIAS_AM_DIR = SHAPEFILE_DIR / "SNV_HIDROVIAS_AM"

_layers_index: dict[str, dict] = {}
_geojson_cache: dict[str, dict] = {}
_bueiros_br317_geojson_cache: dict | None = None
_pontes_br307_geojson_cache: dict | None = None
_bueiros_br307_geojson_cache: dict | None = None
_jazidas_br307_geojson_cache: dict | None = None
_jazidas_br307_points_geojson_cache: dict | None = None
_ti_am_geojson_cache: dict | None = None
_hidrovias_am_geojson_cache: dict | None = None
_limite_estadual_geojson_cache: dict | None = None

# Geometria (shapely) do contorno do Amazonas para recortes (clip).
_amazonas_boundary_geom_cache = None

# Nomes dos caches GeoJSON em memória (para liberar RAM no Render Free).
_GEOJSON_CACHE_GLOBALS = (
    "_bueiros_br317_geojson_cache",
    "_pontes_br307_geojson_cache",
    "_bueiros_br307_geojson_cache",
    "_jazidas_br307_geojson_cache",
    "_jazidas_br307_points_geojson_cache",
    "_ti_am_geojson_cache",
    "_hidrovias_am_geojson_cache",
    "_limite_estadual_geojson_cache",
    "_bueiros_br174_geojson_cache",
    "_prad_br174_geojson_cache",
    "_bueiros_br230_geojson_cache",
    "_pontes_br230_geojson_cache",
    "_pontes_br319_geojson_cache",
    "_balsa_igapo_acu_geojson_cache",
    "_hidrovias_br319_geojson_cache",
    "_bueiros_br319_geojson_cache",
    "_pca_prads_br319_geojson_cache",
    "_pca_prads_cmm_br319_geojson_cache",
    "_prads_br319_geojson_cache",
    "_uc_estadual_geojson_cache",
    "_uc_municipal_geojson_cache",
    "_limite_municipal_geojson_cache",
    "_limite_municipal_polygons_geojson_cache",
    "_ip4_geojson_cache",
)


def _clear_geojson_caches() -> None:
    """Libera caches GeoJSON em memória (evita OOM em 512 MB)."""
    global _geojson_cache, _amazonas_boundary_geom_cache
    try:
        _geojson_cache.clear()
    except Exception:
        _geojson_cache = {}
    g = globals()
    for name in _GEOJSON_CACHE_GLOBALS:
        if name in g:
            g[name] = None
    _amazonas_boundary_geom_cache = None
    gc.collect()


def _get_amazonas_boundary_geom():
    """
    Retorna uma geometria (Shapely) do contorno do estado do Amazonas em WGS84,
    usada para recortar camadas que extrapolam os limites do estado.
    """
    global _amazonas_boundary_geom_cache
    if _amazonas_boundary_geom_cache is not None:
        return _amazonas_boundary_geom_cache

    shp_path = _find_limite_estadual_shapefile()
    if not shp_path or not shp_path.exists():
        _amazonas_boundary_geom_cache = None
        return None

    try:
        gdf = _read_and_merge_shapefiles([shp_path])
        gdf = _ensure_wgs84(gdf)

        if gdf is None or len(gdf) == 0:
            _amazonas_boundary_geom_cache = None
            return None

        # Preferência: se já vier como polígonos (ex.: limites municipais), une direto.
        try:
            types = set(str(t) for t in gdf.geometry.geom_type.unique())
        except Exception:
            types = set()

        geom = None
        if any(t in ("Polygon", "MultiPolygon") for t in types):
            geom = unary_union(list(gdf.geometry))
        else:
            # Fallback: se vier como linhas (contorno), tenta polygonizar.
            try:
                geoms = [gg for gg in list(gdf.geometry) if gg is not None]
                polys = list(polygonize(geoms))
                geom = unary_union(polys) if polys else unary_union(geoms)
            except Exception:
                geom = unary_union(list(gdf.geometry))

        _amazonas_boundary_geom_cache = geom
        return geom
    except Exception:
        _amazonas_boundary_geom_cache = None
        return None


def _clip_to_amazonas(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """
    Recorta um GeoDataFrame ao contorno do AM (quando disponível).
    Se o contorno não existir, retorna o GDF original.
    """
    boundary = _get_amazonas_boundary_geom()
    if boundary is None or gdf is None or len(gdf) == 0:
        return gdf
    # Recorte manual (mais robusto que geopandas.clip em alguns ambientes).
    # 1) filtra por interseção
    # 2) intersecta a geometria com o contorno
    # 3) remove vazios
    try:
        b = boundary
        try:
            # conserta pequenas invalididades de contorno (quando for polígono)
            if getattr(b, "geom_type", "") in ("Polygon", "MultiPolygon"):
                b = b.buffer(0)
        except Exception:
            b = boundary

        out = gdf[gdf.geometry.notna()].copy()
        try:
            out = out[~out.geometry.is_empty]
        except Exception:
            pass

        # intersects pode falhar em geometrias inválidas; tenta mesmo assim.
        try:
            out = out[out.geometry.intersects(b)]
        except Exception:
            pass

        try:
            out["geometry"] = out.geometry.intersection(b)
        except Exception:
            # fallback para geopandas.clip se available
            try:
                out = gpd.clip(out, b)
            except Exception:
                return gdf

        out = out[out.geometry.notna()]
        try:
            out = out[~out.geometry.is_empty]
        except Exception:
            pass
        return out
    except Exception:
        return gdf



# Cache local para shapefiles que chegarem sem .shx (índice).
# Chave: (caminho shp, mtime shp, tamanho shp) -> caminho local do .shp regravado (com .shx).
_local_shp_with_shx_cache: dict[tuple[str, float, int], Path] = {}

# BR-174 — camadas fixas dentro de assets/BR-174 (portátil).
BR174_BASE = Path(os.environ.get("BR174_DIR", str(SHAPEFILE_DIR / "BR-174")))
BR174_BUEIROS_SHP = BR174_BASE / "BUEIROS.shp"
BR174_PRAD_SHP = BR174_BASE / "PRAD_174.shp"

_bueiros_br174_geojson_cache: dict | None = None
_prad_br174_geojson_cache: dict | None = None

# BR-230 — camadas fixas dentro de assets/BR-230 (portátil).
BR230_BASE = Path(os.environ.get("BR230_DIR", str(SHAPEFILE_DIR / "BR-230")))
BR230_BUEIROS_SHP = BR230_BASE / "BUEIROS.shp"
BR230_PONTES_DIR = BR230_BASE / "PONTES_BR230"

_bueiros_br230_geojson_cache: dict | None = None
_pontes_br230_geojson_cache: dict | None = None

# BR-319 — Pontes (portátil): pasta principal + pasta nova PONTES-BR 319.
BR319_PONTES_DIRS = [
    SHAPEFILE_DIR / "BR-319" / "BASE DAS PONTES" / "SHP BR 319",
    SHAPEFILE_DIR / "BR-319" / "PONTES-BR 319",
]
# Compat: código antigo ainda referencia BR319_PONTES_DIR
BR319_PONTES_DIR = BR319_PONTES_DIRS[0]
_pontes_br319_geojson_cache: dict | None = None

# BR-319 — Balsa Igapó-Açu (OAC)
BR319_BALSA_DIR = SHAPEFILE_DIR / "BR-319" / "BALSA_IGAPO_ACU"
_balsa_igapo_acu_geojson_cache: dict | None = None

# BR-319 — Hidrovias SNV (trechos associados à BR-319)
BR319_HIDROVIAS_DIR = SHAPEFILE_DIR / "BR-319" / "SNV_HIDROVIAS"
_hidrovias_br319_geojson_cache: dict | None = None

# BR-319 — Bueiros (portátil): pasta com shapefile(s) em assets/BR-319/SHP_BUEIRO
BR319_BUEIROS_DIR = SHAPEFILE_DIR / "BR-319" / "SHP_BUEIRO"
_bueiros_br319_geojson_cache: dict | None = None

# BR-319 — PCA / PRADS (portátil): assets/BR-319/PCA_PRAD
BR319_PCA_PRAD_DIR = SHAPEFILE_DIR / "BR-319" / "PCA_PRAD"
_pca_prads_br319_geojson_cache: dict | None = None

# BR-319 — PCA / PRADS CMM (portátil): assets/BR-319/PCA_PRAD_CMM
BR319_PCA_PRAD_CMM_DIR = SHAPEFILE_DIR / "BR-319" / "PCA_PRAD_CMM"
_pca_prads_cmm_br319_geojson_cache: dict | None = None

# BR-319 — PRADS (novo): assets/BR-319/SP_PRADES_NOVO/PRADs_BR 319
BR319_PRADS_DIR = SHAPEFILE_DIR / "BR-319" / "SP_PRADES_NOVO" / "PRADs_BR 319"
_prads_br319_geojson_cache: dict | None = None

# Camadas "gerais" (portáveis): sempre a partir de assets/
LIMITE_ESTADUAL_DIR = SHAPEFILE_DIR / "LIMITE ESTADUAL"
LIMITE_MUNICIPAL_BASE = SHAPEFILE_DIR / "LIMITE MUNICIPAL"
LIMITE_MUNICIPAL_DIR = LIMITE_MUNICIPAL_BASE / "shp"
UC_ESTADUAL_DIR = SHAPEFILE_DIR / "UC_ESTADUAL"
UC_MUNICIPAL_DIR = SHAPEFILE_DIR / "UC_MUNICIPAL"
IP4_DIR = SHAPEFILE_DIR / "IP4"
IP4_SHP = IP4_DIR / "IP4S_V2.shp"
# Alguns entregáveis vêm compactados; usamos esse ZIP como fallback quando o SHP "solto" vier vazio.
IP4_ZIP = IP4_DIR / "INSTALACAO_PORTUARIA_IP4_AMAZONAS_V2.zip"
IP4_SUBDIR = IP4_DIR / "INSTALACAO_PORTUARIA_IP4_AMAZONAS_V2"

_uc_estadual_geojson_cache: dict | None = None
_uc_municipal_geojson_cache: dict | None = None
_limite_municipal_geojson_cache: dict | None = None
_limite_municipal_polygons_geojson_cache: dict | None = None
_ip4_geojson_cache: dict | None = None

# Cache do conteúdo extraído do ZIP do IP4 para não extrair a cada request.
# Chave: (zip_path, mtime, size) -> diretório temporário com os arquivos extraídos.
_ip4_zip_extract_cache: dict[tuple[str, float, int], Path] = {}


def _extract_zip_cached(zip_path: Path, cache: dict) -> Path | None:
    """
    Extrai um ZIP para um diretório temporário e cacheia o resultado por mtime/tamanho.
    Retorna o diretório extraído, ou None se falhar.
    """
    try:
        zp = Path(zip_path)
        if not zp.exists() or not zp.is_file():
            return None
        st = zp.stat()
        key = (str(zp), float(st.st_mtime), int(st.st_size))
        cached = cache.get(key)
        if cached and cached.exists() and cached.is_dir():
            return cached

        out_dir = Path(tempfile.gettempdir()) / "infrageo_zip_cache" / hashlib.md5(str(zp).encode("utf-8", errors="ignore")).hexdigest()
        out_dir.mkdir(parents=True, exist_ok=True)
        # Limpa diretório para evitar sobras de versões antigas.
        try:
            for p in out_dir.rglob("*"):
                try:
                    if p.is_file():
                        p.unlink()
                except Exception:
                    continue
        except Exception:
            pass

        with zipfile.ZipFile(zp, "r") as zf:
            zf.extractall(out_dir)

        cache[key] = out_dir
        return out_dir
    except Exception:
        return None


def _safe_shp_record_count(shp_path: Path) -> int | None:
    """Retorna a contagem de registros de um SHP via pyshp, ou None se falhar."""
    try:
        r = shapefile.Reader(str(shp_path))
        return int(len(r))
    except Exception:
        return None


def _decode_dbf_rows_best_effort(shp_path: Path) -> tuple[list[str], list[dict]] | tuple[None, None]:
    """
    Lê somente o DBF via pyshp tentando encodings comuns pt-BR e escolhe o que minimiza '�'.
    Retorna (field_names, rows) ou (None, None) se falhar.
    """

    def _read(enc: str, enc_errors: str = "strict") -> tuple[list[str], list[dict]]:
        r = shapefile.Reader(str(shp_path), encoding=enc, encodingErrors=enc_errors)
        fns = [f[0] for f in r.fields[1:]]  # sem DeletionFlag
        rows: list[dict] = []
        for sr in r.iterShapeRecords():
            rows.append(dict(zip(fns, list(sr.record))))
        return fns, rows

    best = None
    best_score = None
    for enc in ("cp1252", "latin1", "utf-8"):
        try:
            fns, rows = _read(enc, "strict")
            score = 0
            for row in rows:
                for v in row.values():
                    if v is None:
                        continue
                    score += _mojibake_score(str(v))
            if best_score is None or score < best_score:
                best = (fns, rows)
                best_score = score
                if score == 0:
                    break
        except Exception:
            continue

    if best is not None:
        return best

    # Fallback permissivo (não deve ser necessário, mas evita 500).
    for enc in ("cp1252", "latin1", "utf-8"):
        try:
            return _read(enc, "replace")
        except Exception:
            continue
    return (None, None)


def _repair_geojson_props_from_dbf(shp_path: Path, geojson: dict) -> dict:
    """
    Substitui propriedades do GeoJSON pelos valores lidos do DBF via pyshp (pt-BR),
    corrigindo textos com acentuação.
    """
    try:
        fns, rows = _decode_dbf_rows_best_effort(shp_path)
        if not fns or not rows:
            return geojson
        feats = geojson.get("features") or []
        n = min(len(feats), len(rows))
        for i in range(n):
            props = feats[i].get("properties") or {}
            row = rows[i] or {}
            for k, v in row.items():
                props[k] = _fix_mojibake_text(v) if isinstance(v, str) else v
            feats[i]["properties"] = props
        geojson["features"] = feats
        return _repair_geojson_text_mojibake(geojson)
    except Exception:
        return geojson


def _safe_geojson_feature_count(path: Path) -> int | None:
    """Retorna a contagem de features em um GeoJSON, ou None se falhar."""
    try:
        p = Path(path)
        if not p.exists() or not p.is_file():
            return None
        data = json.loads(p.read_text(encoding="utf-8", errors="replace"))
        feats = data.get("features")
        if isinstance(feats, list):
            return int(len(feats))
        return None
    except Exception:
        return None


def _read_geojson_file(path: Path) -> dict:
    p = Path(path)
    return json.loads(p.read_text(encoding="utf-8", errors="replace"))


def _discover_ip4_sources() -> dict:
    """
    Descobre automaticamente os shapefiles do IP4:
    - no disco: assets/IP4/**/*.shp
    - em ZIPs: assets/IP4/*.zip (extraindo para temp)

    Preferência: qualquer SHP com registros > 0 (maior primeiro).
    Retorna dict com:
    - disk_shps: lista[{path,name,size,records}]
    - zip_shps: lista[{path,name,size,records,zip}]
    - best: o item escolhido (ou None)
    """
    disk_items: list[dict] = []
    zip_items: list[dict] = []

    # 0) SHPs na subpasta solicitada (prioridade máxima)
    try:
        if IP4_SUBDIR.exists() and IP4_SUBDIR.is_dir():
            for p in IP4_SUBDIR.rglob("*.shp"):
                if not p.is_file():
                    continue
                try:
                    sz = int(p.stat().st_size)
                except Exception:
                    sz = 0
                rec = _safe_shp_record_count(p)
                disk_items.append(
                    {
                        "path": str(p),
                        "name": p.name,
                        "size": sz,
                        "records": rec,
                        "sourceDir": "INSTALACAO_PORTUARIA_IP4_AMAZONAS_V2",
                    }
                )
    except Exception:
        pass

    # 1) SHPs em disco (restante de assets/IP4)
    try:
        if IP4_DIR.exists() and IP4_DIR.is_dir():
            for p in IP4_DIR.rglob("*.shp"):
                if not p.is_file():
                    continue
                # Evita duplicar os arquivos já listados na subpasta priorizada
                try:
                    if IP4_SUBDIR.exists() and str(p.resolve()).lower().startswith(str(IP4_SUBDIR.resolve()).lower()):
                        continue
                except Exception:
                    pass
                try:
                    sz = int(p.stat().st_size)
                except Exception:
                    sz = 0
                rec = _safe_shp_record_count(p)
                disk_items.append(
                    {
                        "path": str(p),
                        "name": p.name,
                        "size": sz,
                        "records": rec,
                    }
                )
    except Exception:
        disk_items = []

    # 2) SHPs em ZIPs
    try:
        if IP4_DIR.exists() and IP4_DIR.is_dir():
            zips = [p for p in IP4_DIR.iterdir() if p.is_file() and p.suffix.lower() == ".zip"]
            zips.sort(key=lambda p: str(p).lower())
            for z in zips:
                out_dir = _extract_zip_cached(z, _ip4_zip_extract_cache)
                if not out_dir:
                    continue
                shps = [p for p in out_dir.rglob("*.shp") if p.is_file()]
                shps.sort(key=lambda p: str(p).lower())
                for shp in shps:
                    try:
                        sz = int(shp.stat().st_size)
                    except Exception:
                        sz = 0
                    rec = _safe_shp_record_count(shp)
                    zip_items.append(
                        {
                            "path": str(shp),
                            "name": shp.name,
                            "size": sz,
                            "records": rec,
                            "zip": z.name,
                        }
                    )
    except Exception:
        zip_items = []

    def _score(it: dict) -> tuple[int, int, str]:
        # 0 = tem registros, 1 = desconhecido, 2 = zero
        rec = it.get("records")
        has = 0 if isinstance(rec, int) and rec > 0 else (1 if rec is None else 2)
        size = int(it.get("size") or 0)
        name = str(it.get("name") or "")
        # menor score é melhor; tamanho maior é melhor (invertido)
        return (has, -size, name.lower())

    disk_items.sort(key=_score)
    zip_items.sort(key=_score)

    best = None
    # Preferência: disco primeiro, depois zip; mas ambos já ordenados por registros/tamanho.
    if disk_items:
        best = disk_items[0]
    if zip_items and (best is None or _score(zip_items[0]) < _score(best)):
        best = zip_items[0]

    return {
        "disk_shps": disk_items[:30],
        "zip_shps": zip_items[:30],
        "best": best,
    }


_MOJIBAKE_MARKERS = (
    "Ã©",
    "Ã¡",
    "Ã£",
    "Ã¢",
    "Ãª",
    "Ã­",
    "Ã³",
    "Ãµ",
    "Ã´",
    "Ãº",
    "Ã§",
    "Ã‰",
    "Ã‡",
    "Ã•",
    "Ãƒ",
    "Âº",
    "Âª",
    "Â ",
)


def _mojibake_score(text: str) -> int:
    """Pontua indícios de texto UTF-8 lido como Latin-1/CP1252 (ex.: TefÃ©)."""
    if not text:
        return 0
    s = str(text)
    score = s.count("\ufffd") * 8
    for m in _MOJIBAKE_MARKERS:
        score += s.count(m) * 3
    # "Ã" / "Â" seguidos de não-ASCII costumam ser mojibake.
    score += len(re.findall(r"[ÃÂ][^\x00-\x7F]", s))
    return score


def _fix_mojibake_text(value):
    """Tenta recuperar acentuação pt-BR a partir de mojibake comum."""
    if not isinstance(value, str) or not value:
        return value
    if _mojibake_score(value) <= 0:
        return value
    try:
        fixed = value.encode("latin-1", errors="strict").decode("utf-8", errors="strict")
    except Exception:
        try:
            fixed = value.encode("cp1252", errors="strict").decode("utf-8", errors="strict")
        except Exception:
            return value
    if not fixed or fixed == value:
        return value
    # Aceita só se realmente melhorar.
    if _mojibake_score(fixed) < _mojibake_score(value):
        return fixed
    return value


def _repair_geojson_text_mojibake(obj):
    """Aplica correção de mojibake em todas as strings do GeoJSON (in-place)."""
    try:
        stack = [obj]
        seen = 0
        while stack and seen < 400_000:
            seen += 1
            cur = stack.pop()
            if isinstance(cur, dict):
                for k, v in list(cur.items()):
                    if isinstance(v, str):
                        cur[k] = _fix_mojibake_text(v)
                    elif isinstance(v, (dict, list)):
                        stack.append(v)
            elif isinstance(cur, list):
                for i, v in enumerate(cur):
                    if isinstance(v, str):
                        cur[i] = _fix_mojibake_text(v)
                    elif isinstance(v, (dict, list)):
                        stack.append(v)
    except Exception:
        pass
    return obj


def _geojson_has_replacement_char(obj) -> bool:
    """
    Detecta textos quebrados no GeoJSON (� ou mojibake tipo TefÃ©).
    Se existir, ignoramos o cache e reconstruímos com encoding pt-BR.
    """

    try:
        stack = [obj]
        # Limite para evitar custo grande em camadas enormes
        seen = 0
        while stack and seen < 200_000:
            seen += 1
            cur = stack.pop()
            if cur is None:
                continue
            if isinstance(cur, str):
                if "\ufffd" in cur or _mojibake_score(cur) > 0:
                    return True
                continue
            if isinstance(cur, dict):
                stack.extend(cur.values())
                continue
            if isinstance(cur, list):
                stack.extend(cur)
                continue
        return False
    except Exception:
        return False


def _br174_layer_shapefile(kind: str) -> Path:
    k = (kind or "").strip().lower()
    if k in ("bueiros", "bueiro"):
        return BR174_BUEIROS_SHP
    if k in ("prad", "prad_174", "prad174", "prads"):
        return BR174_PRAD_SHP
    raise ValueError(f"Unknown BR-174 layer kind: {kind}")


def _br230_layer_shapefiles(kind: str) -> list[Path]:
    k = (kind or "").strip().lower()
    if k in ("bueiros", "bueiro"):
        # Estrutura atual: assets/BR-230/BUEIROS.shp (+ auxiliares no mesmo diretório)
        if BR230_BUEIROS_SHP.exists():
            return [BR230_BUEIROS_SHP]
        # Fallback: aceiaata estrutura alternativa com subpasta BR-230/BUEIROS/*.shp
        return _shps_in_dir(BR230_BASE / "BUEIROS")
    if k in ("pontes", "ponte"):
        return _shps_in_dir(BR230_PONTES_DIR)
    raise ValueError(f"Unknown BR-230 layer kind: {kind}")


def _shps_in_dir(base: Path) -> list[Path]:
    if not base.exists() or not base.is_dir():
        return []
    # Windows pode ter extensões em caixa alta (.SHP). Aqui aceitamos qualquer variação.
    shps = [p for p in base.rglob("*") if p.is_file() and p.suffix.lower() == ".shp"]
    shps.sort(key=lambda p: str(p).lower())
    return shps


def _geojsons_in_dir(base: Path) -> list[Path]:
    """Lista .geojson/.json na pasta (e subpastas)."""
    if not base.exists() or not base.is_dir():
        return []
    files = [
        p
        for p in base.rglob("*")
        if p.is_file() and p.suffix.lower() in (".geojson", ".json") and p.stat().st_size > 20
    ]
    files.sort(key=lambda p: str(p).lower())
    return files


def _vector_sources_in_dir(base: Path) -> list[Path]:
    """
    Fontes vetoriais para camadas: prefere .shp; se não houver, usa .geojson/.json.
    Assim pastas convertidas para GeoJSON continuam “disponíveis” no /info.
    """
    shps = _shps_in_dir(base)
    if shps:
        return shps
    return _geojsons_in_dir(base)


def _br319_pontes_shapefiles() -> list[Path]:
    """Une as pastas de pontes BR-319, ignorando cópias '(1)' incompletas."""
    out: list[Path] = []
    seen: set[str] = set()
    for base in BR319_PONTES_DIRS:
        for p in _vector_sources_in_dir(base):
            stem = p.stem.lower()
            if "(1)" in stem or stem.endswith(" (1)"):
                continue
            key = str(p.resolve()).lower()
            if key in seen:
                continue
            seen.add(key)
            out.append(p)
    # Se só houver geojson sem shp (ou mistos), já cobertos por _vector_sources_in_dir.
    return out


def _layer_id_for_path(path: Path) -> str:
    rel = str(path.resolve()).lower().encode("utf-8", errors="ignore")
    return hashlib.sha1(rel).hexdigest()[:12]


def _safe_layer_name(path: Path) -> str:
    try:
        rel = path.resolve().relative_to(SHAPEFILE_DIR.resolve())
        return str(rel).replace("\\", "/")
    except Exception:
        return path.name


def _ensure_wgs84(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    try:
        if gdf.crs is not None and gdf.crs.to_epsg() != 4326:
            return gdf.to_crs(epsg=4326)
    except Exception:
        pass
    return gdf


def _sanitize_gdf_for_json(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """
    GeoJSON precisa ser JSON-serializável. Alguns shapefiles trazem campos datetime
    como pandas.Timestamp, que quebram o to_json().
    Em low-memory: remove colunas vazias e simplifica geometrias (menos RAM/payload).
    """
    if gdf is None or gdf.empty:
        return gdf
    out = gdf.copy()
    for col in list(out.columns):
        if col == out.geometry.name:
            continue
        try:
            s = out[col]
            if pd.api.types.is_datetime64_any_dtype(s):
                out[col] = s.dt.strftime("%Y-%m-%dT%H:%M:%S")
                continue
            if pd.api.types.is_object_dtype(s):
                out[col] = s.map(
                    lambda v: v.isoformat()
                    if isinstance(v, (pd.Timestamp, datetime.datetime, datetime.date))
                    else v
                )
        except Exception:
            continue

    if _low_memory_mode():
        try:
            # Remove colunas totalmente vazias (reduz JSON).
            drop_cols = []
            for col in list(out.columns):
                if col == out.geometry.name:
                    continue
                try:
                    if out[col].isna().all():
                        drop_cols.append(col)
                except Exception:
                    continue
            if drop_cols:
                out = out.drop(columns=drop_cols, errors="ignore")
        except Exception:
            pass
        try:
            # ~30–40 m em graus; reduz vértices de polígonos grandes (TI/UC/limites).
            tol = float(os.environ.get("INFRAGEO_SIMPLIFY_TOLERANCE", "0.00035") or "0.00035")
            if tol > 0 and out.geometry is not None:
                out = out.set_geometry(out.geometry.simplify(tol, preserve_topology=True))
        except Exception:
            pass
        try:
            gc.collect()
        except Exception:
            pass
    return out


def _gdf_to_geojson_dict(gdf: gpd.GeoDataFrame) -> dict:
    """Serializa GeoDataFrame → dict GeoJSON com pico de RAM menor no modo econômico."""
    gdf = _sanitize_gdf_for_json(gdf)
    try:
        raw = gdf.to_json()
    except Exception:
        raw = json.dumps(gdf.__geo_interface__, default=str)
    try:
        del gdf
    except Exception:
        pass
    if _low_memory_mode():
        gc.collect()
    return json.loads(raw)


def _is_limite_layer_shapefile(shp_path: Path) -> bool:
    """Camadas de limite (estadual / municipal) viram só o contorno do estado, sem preenchimento."""
    return "limite" in shp_path.stem.lower()


def _limite_gdf_to_clean_state_outline(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """
    Normaliza camadas de limite para mostrar somente o contorno externo do AM:
    - Se vier como polígonos (municípios/estado): une tudo e usa apenas o(s) exterior(es), removendo traços internos.
    - Se vier como linhas (limites municipais): tenta polygonize, escolhe o polígono principal e usa seu exterior.
    """
    if gdf.empty:
        return gdf
    try:
        geom = unary_union([g for g in gdf.geometry if g is not None])

        outline = None
        if isinstance(geom, (Polygon, MultiPolygon)):
            poly = geom
            # Se for multipolígono, pega a maior área como "estado"
            if isinstance(poly, MultiPolygon):
                parts = list(poly.geoms)
                parts.sort(key=lambda p: getattr(p, "area", 0), reverse=True)
                poly = parts[0] if parts else None
            if poly is not None:
                outline = LineString(poly.exterior.coords)

        if outline is None and isinstance(geom, (LineString, MultiLineString)):
            lines = list(geom.geoms) if isinstance(geom, MultiLineString) else [geom]
            polys = list(polygonize(lines))
            if polys:
                polys.sort(key=lambda p: getattr(p, "area", 0), reverse=True)
                outline = LineString(polys[0].exterior.coords)

        if outline is None:
            # Fallback: dissolve + boundary (pode manter internos em alguns casos)
            out = gdf.copy()
            if len(out) > 1:
                out = out.dissolve().reset_index(drop=True)
            out["geometry"] = out.geometry.boundary
            return out

        return gpd.GeoDataFrame({"geometry": [outline]}, geometry="geometry", crs=gdf.crs)
    except Exception:
        return gdf


def _limite_municipal_gdf_to_lines(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """
    Normaliza camadas de limite municipal para exibir apenas linhas (sem preenchimento).
    Diferente do limite estadual, NÃO remove linhas internas (mantém divisões municipais).
    - Se vier como polígono: usa boundary.
    - Se vier como linha: mantém como está.
    """
    if gdf.empty:
        return gdf
    try:
        out = gdf.copy()
        geom = out.geometry
        # Se tiver qualquer polígono, transforma tudo em boundary (linhas)
        if any(isinstance(g, (Polygon, MultiPolygon)) for g in geom if g is not None):
            out["geometry"] = geom.boundary
        return out
    except Exception:
        return gdf


def _find_limite_municipal_shapefiles() -> list[Path]:
    """
    Procura shapefiles de limite municipal.
    Estrutura esperada: assets/LIMITE MUNICIPAL/shp/*.shp
    Fallback: assets/LIMITE MUNICIPAL/**.shp
    """
    shps = _shps_in_dir(LIMITE_MUNICIPAL_DIR)
    if shps:
        return shps
    return _shps_in_dir(LIMITE_MUNICIPAL_BASE)


def _find_bueiros_br317_shapefile(base: Path) -> Path | None:
    """
    Procura shapefile de bueiros na pasta BR-317 (e subpastas).
    Prioriza arquivos cujo nome contenha 'bueiro'.
    Se BUEIROS_BR317_SHP estiver definido, usa esse arquivo diretamente.
    """
    env_shp = os.environ.get("BUEIROS_BR317_SHP", "").strip()
    if env_shp:
        p = Path(env_shp)
        if p.is_file() and p.suffix.lower() == ".shp":
            return p
        return None

    if not base.exists() or not base.is_dir():
        return None

    shp_files = [p for p in base.rglob("*.shp") if p.is_file()]
    shp_files.sort(key=lambda p: str(p).lower())
    preferred = [p for p in shp_files if "bueiro" in p.stem.lower()]
    if preferred:
        return preferred[0]
    return shp_files[0] if shp_files else None


def _find_pontes_br307_shapefile(base: Path) -> Path | None:
    """
    Procura shapefile de pontes na pasta BR-307/PONTES (e subpastas).
    Prioriza nome com 'ponte'. PONTES_BR307_SHP força arquivo único.
    """
    env_shp = os.environ.get("PONTES_BR307_SHP", "").strip()
    if env_shp:
        p = Path(env_shp)
        if p.is_file() and p.suffix.lower() == ".shp":
            return p
        return None

    if not base.exists() or not base.is_dir():
        return None

    shp_files = [p for p in base.rglob("*.shp") if p.is_file()]
    shp_files.sort(key=lambda p: str(p).lower())
    preferred = [p for p in shp_files if "ponte" in p.stem.lower()]
    if preferred:
        return preferred[0]
    return shp_files[0] if shp_files else None


def _find_bueiros_br319_shapefiles(base: Path) -> list[Path]:
    """
    Procura shapefiles de bueiros na pasta assets/BR-319/SHP_BUEIRO (e subpastas),
    retornando SOMENTE os arquivos cujo nome contenha "bueiros" (case-insensitive).
    """
    if not base.exists() or not base.is_dir():
        return []
    shp_files = [p for p in base.rglob("*.shp") if p.is_file()]
    shp_files.sort(key=lambda p: str(p).lower())
    # Observação: alguns entregáveis vêm com variação "BUIEROS" (typo).
    # Aqui aceitamos bueiro(s) e buiero(s), sem case sensitive.
    def is_bueiros_name(stem: str) -> bool:
        s = (stem or "").lower()
        return ("bueiro" in s) or ("bueiros" in s) or ("buiero" in s) or ("buieros" in s)

    only_bueiros = [p for p in shp_files if is_bueiros_name(p.stem)]
    return only_bueiros


def _parse_multi_shp_env(var_name: str) -> list[Path]:
    """
    Lê uma lista de shapefiles do ambiente:
    - Separadores aceitos: ';' ou ','.
    - Retorna apenas .shp existentes.
    """
    raw = os.environ.get(var_name, "").strip()
    if not raw:
        return []
    parts = [p.strip() for p in raw.replace(",", ";").split(";") if p.strip()]
    out: list[Path] = []
    for s in parts:
        p = Path(s)
        if p.is_file() and p.suffix.lower() == ".shp":
            out.append(p)
    return out


def _find_jazidas_br307_shapefiles(base: Path) -> list[Path]:
    """
    Procura shapefiles de jazidas na pasta BR-307/JAZIDAS (e subpastas).
    - Se JAZIDAS_BR307_SHP(S) estiver definido, usa essa(s) entrada(s).
    - Prioriza arquivos cujo nome contenha 'jazid'.
    """
    forced = _parse_multi_shp_env("JAZIDAS_BR307_SHPS")
    if forced:
        return forced
    env_single = os.environ.get("JAZIDAS_BR307_SHP", "").strip()
    if env_single:
        p = Path(env_single)
        if p.is_file() and p.suffix.lower() == ".shp":
            return [p]
        return []

    if not base.exists() or not base.is_dir():
        return []

    shp_files = [p for p in base.rglob("*.shp") if p.is_file()]
    shp_files.sort(key=lambda p: str(p).lower())
    preferred = [p for p in shp_files if "jazid" in p.stem.lower()]
    return preferred if preferred else shp_files


def _read_and_merge_shapefiles(shps: list[Path]) -> gpd.GeoDataFrame:
    if not shps:
        return gpd.GeoDataFrame({"geometry": []}, geometry="geometry", crs="EPSG:4326")

    def _sidecar_geojson(shp_path: Path) -> Path | None:
        """Prefere .geojson irmão do .shp quando existir (conversão offline)."""
        for ext in (".geojson", ".json"):
            p = shp_path.with_suffix(ext)
            try:
                if p.is_file() and p.stat().st_size > 20:
                    return p
            except Exception:
                continue
        return None

    def _read_vector_best_effort(path: Path) -> gpd.GeoDataFrame:
        """Lê .geojson/.json direto ou .shp (com sidecar GeoJSON preferido)."""
        suffix = path.suffix.lower()
        if suffix in (".geojson", ".json"):
            return gpd.read_file(path)
        return _read_shp_best_effort(path)

    def _bad_decode_score(gdf: gpd.GeoDataFrame) -> int:
        """
        Heurística simples para escolher encoding ao ler DBF:
        conta ocorrências do caractere de substituição (�) em colunas de texto.
        """
        try:
            score = 0
            for col in list(gdf.columns):
                if col == gdf.geometry.name:
                    continue
                s = gdf[col]
                if not pd.api.types.is_object_dtype(s):
                    continue
                # Converte para string com cuidado (None -> "")
                vals = s.map(lambda v: "" if v is None else str(v))
                score += int(vals.str.count("\ufffd").sum())
            return int(score)
        except Exception:
            return 10**9

    def _read_shp_best_effort(shp_path: Path) -> gpd.GeoDataFrame:
        """
        Alguns shapefiles vêm com .cpg incorreto (ex.: UTF-8 mas DBF em latin-1),
        causando nomes de municípios com '�'. Tentamos encodings comuns e escolhemos
        o que minimiza esse artefato.
        Se existir .geojson ao lado do .shp, usa o GeoJSON (mais leve no deploy).
        """
        gj = _sidecar_geojson(shp_path)
        if gj is not None:
            try:
                gdf = gpd.read_file(gj)
                return gdf
            except Exception:
                pass

        candidates: list[str | None] = [None, "latin1"] if _low_memory_mode() else [None, "utf-8", "latin1", "cp1252"]
        best_gdf: gpd.GeoDataFrame | None = None
        best_score: int | None = None
        last_err: Exception | None = None
        best_enc: str | None = None

        def _read_dbf_props_pyshp(path: Path, enc: str, enc_errors: str = "strict") -> tuple[list[str], list[dict]]:
            # encodingErrors="strict" evita gerar '�' silenciosamente.
            r = shapefile.Reader(str(path), encoding=enc, encodingErrors=enc_errors)
            field_names = [f[0] for f in r.fields[1:]]  # sem DeletionFlag
            rows: list[dict] = []
            for sr in r.iterShapeRecords():
                rows.append(dict(zip(field_names, list(sr.record))))
            return field_names, rows

        for enc in candidates:
            try:
                gdf = gpd.read_file(shp_path) if enc is None else gpd.read_file(shp_path, encoding=enc)
                score = _bad_decode_score(gdf)
                if best_score is None or score < best_score:
                    best_gdf = gdf
                    best_score = score
                    best_enc = enc
                    if score == 0:
                        break
                else:
                    del gdf
                    if _low_memory_mode():
                        gc.collect()
            except Exception as e:
                last_err = e
                if _low_memory_mode():
                    gc.collect()
                continue

        if best_gdf is None:
            raise last_err or RuntimeError(f"Falha ao ler shapefile: {shp_path}")

        # Releitura DBF via pyshp dobra a RAM — pular no Render Free.
        try:
            if best_score and best_score > 0 and not _low_memory_mode():
                best_rows = None
                best_fields = None
                best_dbf_score = None
                for enc in ("cp1252", "latin1", "utf-8"):
                    try:
                        fns, rows = _read_dbf_props_pyshp(shp_path, enc, "strict")
                        # score simples no dict
                        s = 0
                        for row in rows:
                            for v in row.values():
                                if v is None:
                                    continue
                                s += str(v).count("\ufffd")
                        if best_dbf_score is None or s < best_dbf_score:
                            best_dbf_score = s
                            best_rows = rows
                            best_fields = fns
                            if s == 0:
                                break
                    except Exception:
                        continue
                # Último recurso: se tudo falhar com strict, tenta "replace" (pode gerar '�').
                if best_rows is None:
                    for enc in ("cp1252", "latin1", "utf-8"):
                        try:
                            fns, rows = _read_dbf_props_pyshp(shp_path, enc, "replace")
                            best_rows = rows
                            best_fields = fns
                            break
                        except Exception:
                            continue
                if best_rows is not None and best_fields is not None:
                    # Alinha por ordem: pyshp e fiona normalmente mantêm a mesma ordem de registros.
                    n = min(len(best_gdf), len(best_rows))
                    if n > 0:
                        df_props = pd.DataFrame(best_rows[:n])
                        # Substitui colunas existentes no gdf (object OU string),
                        # pois alguns drivers retornam StringDtype e não entram em is_object_dtype.
                        for col in list(df_props.columns):
                            if col not in best_gdf.columns:
                                continue
                            try:
                                ser = best_gdf[col]
                                if not (pd.api.types.is_object_dtype(ser) or pd.api.types.is_string_dtype(ser)):
                                    continue
                                best_gdf.loc[: n - 1, col] = df_props.loc[: n - 1, col].values
                            except Exception:
                                continue
        except Exception:
            pass

        return best_gdf

    frames: list[gpd.GeoDataFrame] = []
    multi = len(shps) > 1
    for shp in shps:
        if shp.suffix.lower() in (".geojson", ".json"):
            shp_to_read = shp
        else:
            shp_to_read = _ensure_shx_via_local_copy(shp)
        gdf = _read_vector_best_effort(shp_to_read)
        gdf = _ensure_wgs84(gdf)
        # Só marca origem quando há vários SHPs; com um único arquivo mantém atributos originais.
        if multi:
            try:
                gdf["__source"] = shp.name
            except Exception:
                pass
        frames.append(gdf)
    try:
        merged = gpd.GeoDataFrame(pd.concat(frames, ignore_index=True), crs=frames[0].crs)
        merged = _ensure_wgs84(merged)
        return merged
    except Exception:
        # fallback: primeira camada
        return _ensure_wgs84(frames[0])


def _ensure_shx_via_local_copy(shp: Path) -> Path:
    """
    Se o shapefile estiver sem .shx, cria uma cópia local temporária regravada (com .shx)
    usando pyshp, e retorna o caminho do .shp local. Evita depender de GDAL/Fiona.
    """
    shp = Path(shp)
    shx = shp.with_suffix(".shx")
    if shx.exists():
        return shp

    try:
        st = shp.stat()
        key = (str(shp), st.st_mtime, st.st_size)
    except Exception:
        key = (str(shp), 0.0, 0)

    cached = _local_shp_with_shx_cache.get(key)
    if cached and cached.exists() and cached.with_suffix(".shx").exists():
        return cached

    # Lê do SHP/DBF/PRJ existentes e regrava localmente para forçar geração do .shx.
    # Importante: escolher encoding pt-BR para não "corromper" textos ao regravar.
    def _read_pyshp_best_effort(path: Path) -> shapefile.Reader:
        """
        Observação: alguns DBF chegam com bytes inválidos para cp1252/utf-8, e o pyshp pode
        falhar apenas na hora de decodificar registros (iterShapeRecords), não na abertura.
        Para garantir geração do .shx, preferimos 'replace' (não interrompe o fluxo).
        """
        for enc in ("cp1252", "latin1", "utf-8"):
            try:
                return shapefile.Reader(str(path), encoding=enc, encodingErrors="replace")
            except Exception:
                continue
        # Último recurso
        return shapefile.Reader(str(path), encoding="latin1", encodingErrors="replace")

    r = _read_pyshp_best_effort(shp)
    out_dir = Path(tempfile.gettempdir()) / "infrageo_shp_cache"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_base = out_dir / f"{hashlib.md5(str(shp).encode('utf-8', errors='ignore')).hexdigest()}_{shp.stem}"

    w = shapefile.Writer(str(out_base), shapeType=r.shapeType)
    w.fields = list(r.fields)  # inclui DeletionFlag
    try:
        for sr in r.iterShapeRecords():
            w.shape(sr.shape)
            w.record(*sr.record)
    except UnicodeDecodeError:
        # Reabre em modo mais permissivo e tenta novamente (não derruba servidor por DBF "sujo")
        r2 = shapefile.Reader(str(shp), encoding="latin1", encodingErrors="replace")
        for sr in r2.iterShapeRecords():
            w.shape(sr.shape)
            w.record(*sr.record)
    w.close()

    # Copia .prj e .cpg se existirem
    for ext in (".prj", ".cpg"):
        src = shp.with_suffix(ext)
        if src.exists() and src.is_file():
            try:
                (out_base.with_suffix(ext)).write_bytes(src.read_bytes())
            except Exception:
                pass

    out_shp = out_base.with_suffix(".shp")
    if out_shp.exists() and out_shp.with_suffix(".shx").exists():
        _local_shp_with_shx_cache[key] = out_shp
        return out_shp

    # Se falhar, volta pro original (vai estourar erro de leitura mais acima).
    return shp


def _make_label_points(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """
    Converte qualquer geometria em pontos para identificação no mapa:
    - Point: mantém
    - Polygon: representative_point (garante ponto dentro do polígono quando possível)
    - LineString: ponto no meio (normalized interpolate)
    """
    if gdf.empty:
        return gdf
    out = gdf.copy()

    def to_point(geom):
        if geom is None:
            return None
        gt = getattr(geom, "geom_type", "")
        try:
            if gt in ("Point", "MultiPoint"):
                return geom.representative_point() if gt == "MultiPoint" else geom
            if gt in ("Polygon", "MultiPolygon"):
                return geom.representative_point()
            if gt in ("LineString", "MultiLineString"):
                try:
                    return geom.interpolate(0.5, normalized=True)
                except Exception:
                    return geom.representative_point()
            return geom.representative_point()
        except Exception:
            return None

    try:
        out["geometry"] = out.geometry.apply(to_point)
        out = out.dropna(subset=["geometry"])
    except Exception:
        pass
    return out


def _discover_shapefiles() -> dict[str, dict]:
    """
    Descobre shapefiles de forma robusta.

    Observação: `Path.rglob("*.shp")` pode falhar em ambientes Windows com pastas
    inacessíveis/arquivos em rede, o que derruba a descoberta inteira e deixa o índice
    "congelado" (camadas novas não aparecem no /layers). Aqui usamos `os.walk` com
    `onerror` para ignorar erros pontuais e garantir descoberta parcial.
    """
    shp_files: list[Path] = []
    try:
        base = SHAPEFILE_DIR
        for root, _dirs, files in os.walk(base, onerror=lambda _e: None):
            for fn in files:
                # Windows pode ter extensões em caixa alta (.SHP). Aceita qualquer variação.
                if not fn.lower().endswith(".shp"):
                    continue
                try:
                    p = Path(root) / fn
                    if p.is_file():
                        shp_files.append(p)
                except Exception:
                    continue
    except Exception:
        # Fallback: tenta rglob (melhor do que nada)
        try:
            shp_files = [p for p in SHAPEFILE_DIR.rglob("*") if p.is_file() and p.suffix.lower() == ".shp"]
        except Exception:
            shp_files = []

    shp_files.sort(key=lambda p: str(p).lower())

    index: dict[str, dict] = {}
    for shp in shp_files:
        lid = _layer_id_for_path(shp)
        index[lid] = {
            "id": lid,
            "name": _safe_layer_name(shp),
            "path": str(shp),
        }
    return index


def _load_layer_geojson(layer_id: str) -> dict:
    global _layers_index
    if layer_id in _geojson_cache:
        cached = _geojson_cache[layer_id]
        if cached is not None and not _geojson_has_replacement_char(cached):
            return cached
        # cache ruim (contém �): descarta e reconstrói
        try:
            _geojson_cache.pop(layer_id, None)
        except Exception:
            pass

    info = _layers_index.get(layer_id)
    if not info:
        # Atualiza índice dinamicamente (SHPs podem ser adicionados sem reiniciar o servidor)
        try:
            _layers_index = _discover_shapefiles()
        except Exception:
            pass
        info = _layers_index.get(layer_id)
    if not info:
        abort(404, description="Layer not found")

    shp_path = Path(info["path"])
    if not shp_path.exists():
        abort(404, description="Shapefile missing on disk")

    try:
        # Leitura robusta: tenta encodings comuns (pt-BR) para evitar '�' em textos.
        gdf = _read_and_merge_shapefiles([shp_path])
        gdf = _ensure_wgs84(gdf)
        if _is_limite_layer_shapefile(shp_path):
            gdf = _limite_gdf_to_clean_state_outline(gdf)
        geojson = _gdf_to_geojson_dict(gdf)
    except Exception as e:
        abort(500, description=f"Failed to read shapefile: {e}")

    # Em low-memory não retém cache (o after_request também limpa).
    if not _low_memory_mode():
        _geojson_cache[layer_id] = geojson
    return geojson


def _find_limite_estadual_shapefile() -> Path | None:
    """
    Shapefile do limite estadual (contorno AM).
    - LIMITE_ESTADUAL_SHP no ambiente tem prioridade (arquivo único)
    - depois procura na pasta configurada (LIMITE_ESTADUAL_BASE)
    """
    env_shp = os.environ.get("LIMITE_ESTADUAL_SHP", "").strip()
    if env_shp:
        p = Path(env_shp)
        if p.is_file() and p.suffix.lower() == ".shp":
            return p
        return None

    base = LIMITE_ESTADUAL_BASE
    if not base.exists() or not base.is_dir():
        return None

    shp_files = [p for p in base.rglob("*.shp") if p.is_file()]
    shp_files.sort(key=lambda p: str(p).lower())

    def score(p: Path) -> tuple[int, str]:
        stem = p.stem.lower()
        # Prefer arquivos explicitamente estaduais/AM; evite "municipal" quando houver alternativa.
        if "estadual" in stem:
            return (0, stem)
        if stem.endswith("_am") or stem == "am" or " amazonas" in stem:
            return (1, stem)
        if "municipal" in stem:
            return (4, stem)
        if "limite" in stem:
            return (2, stem)
        return (3, stem)

    if not shp_files:
        return None
    shp_files.sort(key=score)
    return shp_files[0]


def _load_geodataframe() -> gpd.GeoDataFrame:
    """
    Carrega o shapefile de SEGMENTOS dentro de SHAPEFILE_DIR
    e garante projeção em WGS84 (EPSG:4326) para uso no WebGIS.
    """
    shp_path: Path | None = None

    if SEGMENTOS_SHP.exists():
        shp_path = SEGMENTOS_SHP
    else:
        # Procura recursivamente por shapefiles e escolhe o que contém "segmentos" no nome.
        shp_files = [
            p
            for p in SHAPEFILE_DIR.rglob("*")
            if p.is_file() and p.suffix.lower() == ".shp"
        ]
        shp_files.sort(key=lambda p: str(p).lower())
        for p in shp_files:
            if "segmentos" in p.stem.lower():
                shp_path = p
                break

        # Se não existir nenhum shapefile, não derruba o servidor: retorna coleção vazia
        if shp_path is None:
            empty = gpd.GeoDataFrame({"geometry": []}, geometry="geometry", crs="EPSG:4326")
            return empty

    gdf = _read_and_merge_shapefiles([shp_path])

    # Garante que esteja em EPSG:4326 para visualização web
    try:
        if gdf.crs is not None and gdf.crs.to_epsg() != 4326:
            gdf = gdf.to_crs(epsg=4326)
    except Exception:
        # Se der algum problema, continua com o CRS original
        pass

    return gdf


@app.route("/")
def index():
    if API_ONLY:
        return jsonify(
            {
                "service": "InfraGeo AM API",
                "status": "ok",
                "api_only": True,
                "frontend": _frontend_url(),
                "health": "/health",
                "layers": "/layers",
            }
        )
    return render_template("index.html")


@app.route("/layers")
def layers():
    """
    Lista todos os shapefiles (.shp) encontrados em SHAPEFILE_DIR.
    """
    # Atualiza o índice dinamicamente (evita precisar reiniciar o servidor ao adicionar SHPs)
    global _layers_index
    try:
        _layers_index = _discover_shapefiles()
    except Exception:
        pass
    items = []
    for lid, info in _layers_index.items():
        items.append(
            {
                "id": lid,
                "name": info["name"],
            }
        )
    return jsonify({"layers": items})


@app.route("/layers/bueiros-br317/info")
def bueiros_br317_info():
    shp = _find_bueiros_br317_shapefile(BR317_BUEIROS_DIR)
    if not shp:
        return jsonify(
            {
                "available": False,
                "basePath": str(BR317_BUEIROS_DIR),
                "message": "Pasta inacessível ou shapefile de bueiros não encontrado.",
            }
        )
    return jsonify(
        {
            "available": True,
            "basePath": str(BR317_BUEIROS_DIR),
            "shapefiles": [shp.name],
            "shapefilePaths": [str(shp)],
            "count": 1,
        }
    )


@app.route("/layers/bueiros-br317")
def bueiros_br317_geojson():
    """
    GeoJSON dos bueiros BR-317 (shapefile(s) em assets/BR-317).
    """
    global _bueiros_br317_geojson_cache
    if _bueiros_br317_geojson_cache is not None:
        return jsonify(_bueiros_br317_geojson_cache)

    shp = _find_bueiros_br317_shapefile(BR317_BUEIROS_DIR)
    if not shp:
        abort(
            404,
            description="Bueiros BR-317: shapefile de bueiros não encontrado em assets/BR-317.",
        )

    try:
        gdf = _read_and_merge_shapefiles([shp])
        gdf = _ensure_wgs84(gdf)
        gdf = _sanitize_gdf_for_json(gdf)
        geojson = json.loads(gdf.to_json())
    except Exception as e:
        abort(500, description=f"Falha ao ler shapefile de bueiros: {e}")

    _bueiros_br317_geojson_cache = geojson
    return jsonify(geojson)


@app.route("/layers/pontes-br307/info")
def pontes_br307_info():
    shps = _shps_in_dir(BR307_PONTES_DIR)
    if not shps:
        return jsonify(
            {
                "available": False,
                "basePath": str(BR307_PONTES_DIR),
                "message": "Pasta inacessível ou nenhum .shp encontrado.",
            }
        )
    return jsonify(
        {
            "available": True,
            "basePath": str(BR307_PONTES_DIR),
            "shapefiles": [p.name for p in shps],
            "shapefilePaths": [str(p) for p in shps],
            "count": len(shps),
        }
    )


@app.route("/layers/pontes-br307")
def pontes_br307_geojson():
    global _pontes_br307_geojson_cache
    if _pontes_br307_geojson_cache is not None:
        return jsonify(_pontes_br307_geojson_cache)

    shps = _shps_in_dir(BR307_PONTES_DIR)
    if not shps:
        abort(
            404,
            description="Pontes BR-307: nenhum shapefile encontrado em assets/BR-307/PONTES.",
        )

    try:
        gdf = _read_and_merge_shapefiles(shps)
        gdf = _ensure_wgs84(gdf)
        gdf = _sanitize_gdf_for_json(gdf)
        geojson = json.loads(gdf.to_json())
    except Exception as e:
        abort(500, description=f"Falha ao ler shapefile de pontes: {e}")

    _pontes_br307_geojson_cache = geojson
    return jsonify(geojson)


@app.route("/layers/bueiros-br307/info")
def bueiros_br307_info():
    shps = _shps_in_dir(BR307_BUEIROS_DIR)
    if not shps:
        return jsonify(
            {
                "available": False,
                "basePath": str(BR307_BUEIROS_DIR),
                "message": "Pasta inacessível ou nenhum .shp encontrado.",
            }
        )
    return jsonify(
        {
            "available": True,
            "basePath": str(BR307_BUEIROS_DIR),
            "shapefiles": [p.name for p in shps],
            "shapefilePaths": [str(p) for p in shps],
            "count": len(shps),
        }
    )


@app.route("/layers/bueiros-br307")
def bueiros_br307_geojson():
    global _bueiros_br307_geojson_cache
    if _bueiros_br307_geojson_cache is not None:
        return jsonify(_bueiros_br307_geojson_cache)

    shps = _shps_in_dir(BR307_BUEIROS_DIR)
    if not shps:
        abort(404, description="Bueiros BR-307: nenhum shapefile encontrado em assets/BR-307/BUEIROS.")

    try:
        gdf = _read_and_merge_shapefiles(shps)
        gdf = _ensure_wgs84(gdf)
        gdf = _sanitize_gdf_for_json(gdf)
        geojson = json.loads(gdf.to_json())
    except Exception as e:
        abort(500, description=f"Falha ao ler shapefile de bueiros BR-307: {e}")

    _bueiros_br307_geojson_cache = geojson
    return jsonify(geojson)


@app.route("/layers/jazidas-br307/info")
def jazidas_br307_info():
    shps = _shps_in_dir(BR307_JAZIDAS_DIR)
    if not shps:
        return jsonify(
            {
                "available": False,
                "basePath": str(BR307_JAZIDAS_DIR),
                "message": "Pasta inacessível ou nenhum .shp encontrado.",
            }
        )
    return jsonify(
        {
            "available": True,
            "basePath": str(BR307_JAZIDAS_DIR),
            "shapefiles": [p.name for p in shps],
            "shapefilePaths": [str(p) for p in shps],
            "count": len(shps),
        }
    )


@app.route("/layers/jazidas-br307")
def jazidas_br307_geojson():
    global _jazidas_br307_geojson_cache
    if _jazidas_br307_geojson_cache is not None:
        return jsonify(_jazidas_br307_geojson_cache)

    shps = _shps_in_dir(BR307_JAZIDAS_DIR)
    if not shps:
        abort(
            404,
            description="Jazidas BR-307: nenhum shapefile encontrado em assets/BR-307/JAZIDAS.",
        )

    try:
        gdf = _read_and_merge_shapefiles(shps)
        geojson = json.loads(gdf.to_json())
    except Exception as e:
        abort(500, description=f"Falha ao ler shapefile(s) de jazidas: {e}")

    _jazidas_br307_geojson_cache = geojson
    return jsonify(geojson)


@app.route("/layers/ti-am/info")
def ti_am_info():
    # Fonte principal (fixa) solicitada: assets/TI_AM_ATUALIZADA/TI_AM_ATUALIZADA.shp
    fixed = TI_AM_DIR / "TI_AM_ATUALIZADA.shp"
    if fixed.exists() and fixed.is_file():
        return jsonify(
            {
                "available": True,
                "basePath": str(TI_AM_DIR),
                "shapefiles": [fixed.name],
                "shapefile": fixed.name,
                "count": 1,
            }
        )

    shps = _shps_in_dir(TI_AM_DIR)
    if not shps:
        existing_files = []
        try:
            if TI_AM_DIR.exists() and TI_AM_DIR.is_dir():
                existing_files = sorted([p.name for p in TI_AM_DIR.iterdir() if p.is_file()])
        except Exception:
            existing_files = []
        return jsonify(
            {
                "available": False,
                "basePath": str(TI_AM_DIR),
                "message": "Nenhum .shp encontrado. Verifique se os arquivos .shp/.dbf/.shx estão na pasta.",
                "filesFound": existing_files,
            }
        )
    preferred = [p for p in shps if "ti" in p.stem.lower() or "terra" in p.stem.lower()]
    shp = preferred[0] if preferred else shps[0]
    return jsonify(
        {
            "available": True,
            "basePath": str(TI_AM_DIR),
            "shapefiles": [p.name for p in shps],
            "shapefile": shp.name,
            "count": len(shps),
        }
    )


@app.route("/layers/ti-am")
def ti_am_geojson():
    global _ti_am_geojson_cache
    if _ti_am_geojson_cache is not None:
        return jsonify(_ti_am_geojson_cache)

    fixed = TI_AM_DIR / "TI_AM_ATUALIZADA.shp"
    shps = [fixed] if (fixed.exists() and fixed.is_file()) else _shps_in_dir(TI_AM_DIR)
    if not shps:
        abort(404, description="TI AM: nenhum shapefile encontrado em assets/TI_AM_ATUALIZADA.")

    # Se faltar .shx, cria cópia local regravada (com .shx)
    shps = [_ensure_shx_via_local_copy(p) for p in shps]
    try:
        gdf = _read_and_merge_shapefiles(shps)
        gdf = _ensure_wgs84(gdf)
        gdf = _sanitize_gdf_for_json(gdf)
        geojson = json.loads(gdf.to_json())
    except Exception as e:
        abort(500, description=f"Falha ao ler shapefile(s) TI AM: {e}")

    _ti_am_geojson_cache = geojson
    return jsonify(geojson)


@app.route("/layers/hidrovias-am/info")
def hidrovias_am_info():
    # Fonte principal (fixa) solicitada: assets/SNV_HIDROVIAS_AM/SNV_HIDROVIAS_AM.shp
    fixed = HIDROVIAS_AM_DIR / "SNV_HIDROVIAS_AM.shp"
    if fixed.exists() and fixed.is_file():
        return jsonify(
            {
                "available": True,
                "basePath": str(HIDROVIAS_AM_DIR),
                "shapefiles": [fixed.name],
                "shapefile": fixed.name,
                "count": 1,
            }
        )

    shps = _shps_in_dir(HIDROVIAS_AM_DIR)
    if not shps:
        existing_files = []
        try:
            if HIDROVIAS_AM_DIR.exists() and HIDROVIAS_AM_DIR.is_dir():
                existing_files = sorted([p.name for p in HIDROVIAS_AM_DIR.iterdir() if p.is_file()])
        except Exception:
            existing_files = []
        return jsonify(
            {
                "available": False,
                "basePath": str(HIDROVIAS_AM_DIR),
                "message": "Nenhum .shp encontrado. Verifique se os arquivos .shp/.dbf/.shx estão na pasta.",
                "filesFound": existing_files,
            }
        )

    # Se há algum .shp na pasta (fallback), considera disponível
    return jsonify(
        {
            "available": True,
            "basePath": str(HIDROVIAS_AM_DIR),
            "shapefiles": [p.name for p in shps],
            "shapefile": shps[0].name,
            "count": len(shps),
        }
    )


@app.route("/layers/hidrovias-am")
def hidrovias_am_geojson():
    global _hidrovias_am_geojson_cache
    if _hidrovias_am_geojson_cache is not None:
        return jsonify(_hidrovias_am_geojson_cache)

    fixed = HIDROVIAS_AM_DIR / "SNV_HIDROVIAS_AM.shp"
    shps = [fixed] if (fixed.exists() and fixed.is_file()) else _shps_in_dir(HIDROVIAS_AM_DIR)
    if not shps:
        abort(404, description="Hidrovias AM: nenhum shapefile encontrado em assets/SNV_HIDROVIAS_AM.")

    # Se faltar .shx, cria cópia local regravada (com .shx)
    shps = [_ensure_shx_via_local_copy(p) for p in shps]
    try:
        gdf = _read_and_merge_shapefiles(shps)
        gdf = _ensure_wgs84(gdf)
        gdf = _sanitize_gdf_for_json(gdf)
        geojson = json.loads(gdf.to_json())
    except Exception as e:
        abort(500, description=f"Falha ao ler shapefile(s) Hidrovias AM: {e}")

    _hidrovias_am_geojson_cache = geojson
    return jsonify(geojson)


@app.route("/layers/jazidas-br307/jazida-pontos")
def jazidas_br307_points_geojson():
    """
    Camada auxiliar de pontos (um por feição) para identificação/rotulagem no mapa.
    """
    global _jazidas_br307_points_geojson_cache
    if _jazidas_br307_points_geojson_cache is not None:
        return jsonify(_jazidas_br307_points_geojson_cache)

    shps = _shps_in_dir(BR307_JAZIDAS_DIR)
    if not shps:
        abort(
            404,
            description="Jazidas BR-307 (pontos): nenhum shapefile encontrado em assets/BR-307/JAZIDAS.",
        )

    try:
        gdf = _read_and_merge_shapefiles(shps)
        pts = _make_label_points(gdf)
        pts = _ensure_wgs84(pts)
        geojson = json.loads(pts.to_json())
    except Exception as e:
        abort(500, description=f"Falha ao gerar pontos de jazidas: {e}")

    _jazidas_br307_points_geojson_cache = geojson
    return jsonify(geojson)


@app.route("/export/jazidas-br307/jazida-shp")
def export_jazidas_br307_jazida_shp():
    """
    Exporta um shapefile (pontos) para identificação de jazidas no mapa.
    Retorna um .zip contendo .shp/.shx/.dbf/.prj.
    """
    shps = _shps_in_dir(BR307_JAZIDAS_DIR)
    if not shps:
        abort(404, description="Jazidas BR-307: nenhum shapefile encontrado para exportar.")

    try:
        gdf = _read_and_merge_shapefiles(shps)
        pts = _make_label_points(gdf)
        pts = _ensure_wgs84(pts)
    except Exception as e:
        abort(500, description=f"Falha ao preparar exportação de jazidas: {e}")

    if pts is None or len(pts) == 0:
        abort(404, description="Jazidas BR-307: camada de pontos vazia (nada para exportar).")

    stem = "jazida_identificacao_br307"
    with tempfile.TemporaryDirectory() as tmp:
        out_dir = Path(tmp)
        shp_path = out_dir / f"{stem}.shp"
        try:
            pts.to_file(shp_path, driver="ESRI Shapefile")
        except Exception as e:
            abort(500, description=f"Falha ao exportar shapefile de jazidas: {e}")

        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", compression=zipfile.ZIP_DEFLATED) as zf:
            for p in out_dir.glob(f"{stem}.*"):
                zf.write(p, arcname=p.name)
        buf.seek(0)

        return send_file(
            buf,
            as_attachment=True,
            download_name=f"{stem}.zip",
            mimetype="application/zip",
        )


@app.route("/layers/limite-estadual")
def limite_estadual_geojson():
    """
    GeoJSON do limite estadual (contorno), mesmo quando a lista /layers não inclui o arquivo
    (ex.: fallback /data só com segmentos).
    """
    global _limite_estadual_geojson_cache
    if _limite_estadual_geojson_cache is not None:
        return jsonify(_limite_estadual_geojson_cache)

    shp_path = _find_limite_estadual_shapefile()
    if not shp_path or not shp_path.exists():
        abort(
            404,
            description="Limite estadual: nenhum shapefile encontrado (nome com 'limite' ou variável LIMITE_ESTADUAL_SHP).",
        )

    try:
        gdf = _read_and_merge_shapefiles([shp_path])
        gdf = _ensure_wgs84(gdf)
        gdf = _limite_gdf_to_clean_state_outline(gdf)
        geojson = json.loads(gdf.to_json())
    except Exception as e:
        abort(500, description=f"Falha ao ler limite estadual: {e}")

    _limite_estadual_geojson_cache = geojson
    return jsonify(geojson)


@app.route("/layers/limite-municipal/info")
def limite_municipal_info():
    shps = _find_limite_municipal_shapefiles()
    if not shps:
        return jsonify(
            {
                "available": False,
                "basePath": str(LIMITE_MUNICIPAL_DIR),
                "message": "Pasta inacessível ou nenhum .shp encontrado.",
            }
        )
    return jsonify(
        {
            "available": True,
            "basePath": str(LIMITE_MUNICIPAL_DIR),
            "shapefiles": [p.name for p in shps],
            "shapefilePaths": [str(p) for p in shps],
            "count": len(shps),
        }
    )


@app.route("/layers/limite-municipal")
def limite_municipal_geojson():
    """
    GeoJSON do limite municipal (linhas), a partir de assets/LIMITE MUNICIPAL/shp.
    """
    global _limite_municipal_geojson_cache
    if _limite_municipal_geojson_cache is not None:
        return jsonify(_limite_municipal_geojson_cache)

    shps = _find_limite_municipal_shapefiles()
    if not shps:
        abort(
            404,
            description="Limite municipal: nenhum shapefile encontrado em assets/LIMITE MUNICIPAL/shp.",
        )

    try:
        gdf = _read_and_merge_shapefiles(shps)
        gdf = _ensure_wgs84(gdf)
        gdf = _limite_municipal_gdf_to_lines(gdf)
        gdf = _sanitize_gdf_for_json(gdf)
        geojson = json.loads(gdf.to_json())
    except Exception as e:
        abort(500, description=f"Falha ao ler limite municipal: {e}")

    _limite_municipal_geojson_cache = geojson
    return jsonify(geojson)


@app.route("/layers/limite-municipal/polygons")
def limite_municipal_polygons_geojson():
    """
    GeoJSON do limite municipal em polígonos (municípios), preservando atributos
    como nome do município para hover/identify no frontend.
    """
    global _limite_municipal_polygons_geojson_cache
    if _limite_municipal_polygons_geojson_cache is not None:
        return jsonify(_limite_municipal_polygons_geojson_cache)

    shps = _find_limite_municipal_shapefiles()
    if not shps:
        abort(
            404,
            description="Limite municipal (polígonos): nenhum shapefile encontrado em assets/LIMITE MUNICIPAL/shp.",
        )

    try:
        # Observação: alguns DBFs vêm com .cpg incorreto (ex.: UTF-8) e a leitura via Fiona/GeoPandas
        # pode produzir nomes com '�'. Para garantir tooltip correto, lemos via pyshp com encoding
        # alternativo e montamos o GeoJSON manualmente.
        def _reader_for_municipal(shp_path: Path) -> shapefile.Reader:
            """
            Para os dados de municípios (AM), forçamos latin-1/cp1252 para preservar acentos.
            Na prática esses DBFs frequentemente não seguem o .cpg (ou ele vem incorreto).
            """
            try:
                return shapefile.Reader(str(shp_path), encoding="latin1", encodingErrors="strict")
            except Exception:
                # fallback
                return shapefile.Reader(str(shp_path), encoding="cp1252", encodingErrors="strict")

        features: list[dict] = []
        for shp_path in shps:
            r = _reader_for_municipal(shp_path)
            field_names = [f[0] for f in r.fields[1:]]  # sem DeletionFlag
            for sr in r.iterShapeRecords():
                geom = getattr(sr.shape, "__geo_interface__", None)
                if not geom:
                    continue
                props = dict(zip(field_names, list(sr.record)))
                features.append(
                    {
                        "type": "Feature",
                        "geometry": geom,
                        "properties": props,
                    }
                )
        geojson = {"type": "FeatureCollection", "features": features}
    except Exception as e:
        abort(500, description=f"Falha ao ler limite municipal (polígonos): {e}")

    _limite_municipal_polygons_geojson_cache = geojson
    return jsonify(geojson)


@app.route("/layers/uc-estadual/info")
def uc_estadual_info():
    shps = _shps_in_dir(UC_ESTADUAL_DIR)
    if not shps:
        return jsonify(
            {
                "available": False,
                "basePath": str(UC_ESTADUAL_DIR),
                "message": "Pasta inacessível ou nenhum .shp encontrado.",
            }
        )
    return jsonify(
        {
            "available": True,
            "basePath": str(UC_ESTADUAL_DIR),
            "shapefiles": [p.name for p in shps],
            "shapefilePaths": [str(p) for p in shps],
            "count": len(shps),
        }
    )


@app.route("/layers/uc-estadual")
def uc_estadual_geojson():
    global _uc_estadual_geojson_cache
    if _uc_estadual_geojson_cache is not None and not _geojson_has_replacement_char(_uc_estadual_geojson_cache):
        return jsonify(_uc_estadual_geojson_cache)

    shps = _shps_in_dir(UC_ESTADUAL_DIR)
    if not shps:
        abort(404, description="UC Estadual: nenhum shapefile encontrado em assets/UC_ESTADUAL.")

    try:
        gdf = _read_and_merge_shapefiles(shps)
        gdf = _ensure_wgs84(gdf)
        gdf = _sanitize_gdf_for_json(gdf)
        geojson = json.loads(gdf.to_json())
    except Exception as e:
        abort(500, description=f"Falha ao ler shapefile de UC Estadual: {e}")

    _uc_estadual_geojson_cache = geojson
    return jsonify(geojson)


@app.route("/layers/uc-municipal/info")
def uc_municipal_info():
    shps = _shps_in_dir(UC_MUNICIPAL_DIR)
    if not shps:
        return jsonify(
            {
                "available": False,
                "basePath": str(UC_MUNICIPAL_DIR),
                "message": "Pasta inacessível ou nenhum .shp encontrado.",
            }
        )
    return jsonify(
        {
            "available": True,
            "basePath": str(UC_MUNICIPAL_DIR),
            "shapefiles": [p.name for p in shps],
            "shapefilePaths": [str(p) for p in shps],
            "count": len(shps),
        }
    )


@app.route("/layers/uc-municipal")
def uc_municipal_geojson():
    global _uc_municipal_geojson_cache
    if _uc_municipal_geojson_cache is not None and not _geojson_has_replacement_char(_uc_municipal_geojson_cache):
        return jsonify(_uc_municipal_geojson_cache)

    shps = _shps_in_dir(UC_MUNICIPAL_DIR)
    if not shps:
        abort(404, description="UC Municipal: nenhum shapefile encontrado em assets/UC_MUNICIPAL.")

    try:
        gdf = _read_and_merge_shapefiles(shps)
        gdf = _ensure_wgs84(gdf)
        gdf = _sanitize_gdf_for_json(gdf)
        geojson = json.loads(gdf.to_json())
    except Exception as e:
        abort(500, description=f"Falha ao ler shapefile de UC Municipal: {e}")

    _uc_municipal_geojson_cache = geojson
    return jsonify(geojson)


@app.route("/layers/ip4/info")
def ip4_info():
    """
    IP4 — Instalações Portuárias (fonte: assets/IP4).
    Preferência: IP4S_V2.shp. Fallback: procura .shp dentro do ZIP do entregável.
    """
    # Requisito do usuário: usar SOMENTE os arquivos diretamente em assets/IP4.
    # Aceita também GeoJSON (alguns entregáveis vêm já convertidos).
    root_shps: list[Path] = []
    root_geojsons: list[Path] = []
    try:
        if IP4_DIR.exists() and IP4_DIR.is_dir():
            root_shps = [p for p in IP4_DIR.iterdir() if p.is_file() and p.suffix.lower() == ".shp"]
            root_shps.sort(key=lambda p: str(p).lower())
            root_geojsons = [
                p
                for p in IP4_DIR.iterdir()
                if p.is_file() and p.suffix.lower() in (".geojson", ".json")
            ]
            root_geojsons.sort(key=lambda p: str(p).lower())
    except Exception:
        root_shps = []
        root_geojsons = []

    # Escolhe automaticamente o SHP "melhor":
    # 1) com registros > 0
    # 2) maior tamanho (proxy de mais conteúdo)
    # 3) ordem alfabética (fallback determinístico)
    best = None
    if root_shps or root_geojsons:
        candidates: list[tuple[Path, str, int | None, int]] = []
        for p in root_shps:
            try:
                sz = int(p.stat().st_size)
            except Exception:
                sz = 0
            rec = _safe_shp_record_count(p)
            candidates.append((p, "shp", rec, sz))
        for p in root_geojsons:
            try:
                sz = int(p.stat().st_size)
            except Exception:
                sz = 0
            rec = _safe_geojson_feature_count(p)
            candidates.append((p, "geojson", rec, sz))

        def score(item):
            _p, _kind, _rec, _sz = item
            has = 0 if isinstance(_rec, int) and _rec > 0 else (1 if _rec is None else 2)  # 0 melhor
            # Se empatar, prefere SHP (é o formato "fonte" esperado), depois pelo tamanho.
            kind_rank = 0 if _kind == "shp" else 1
            return (has, kind_rank, -int(_sz), str(_p.name).lower())

        candidates.sort(key=score)
        p0, kind0, rec0, sz0 = candidates[0]
        best = {
            "name": p0.name,
            "path": str(p0),
            "kind": kind0,
            "size": int(sz0),
            "records": rec0,
            "sourceDir": "assets/IP4",
        }

    # Para permitir ligar a camada mesmo sem feições, consideramos "disponível" quando o SHP existe.
    # O frontend exibirá um aviso de "camada vazia" e o backend poderá retornar um placeholder.
    available = bool(best and best.get("path"))
    empty = bool(best and isinstance(best.get("records"), int) and best.get("records") == 0)
    return jsonify(
        {
            "available": bool(available),
            "basePath": str(IP4_DIR),
            "bestShapefile": best.get("name"),
            "bestPath": best.get("path"),
            "bestRecords": best.get("records"),
            "bestSize": best.get("size"),
            "bestZip": None,
            "empty": bool(empty),
            "bestKind": best.get("kind"),
            "diskShapefiles": [
                {"name": p.name, "path": str(p), "size": int(p.stat().st_size), "records": _safe_shp_record_count(p)}
                for p in root_shps[:30]
            ],
            "diskGeojsons": [
                {"name": p.name, "path": str(p), "size": int(p.stat().st_size), "records": _safe_geojson_feature_count(p)}
                for p in root_geojsons[:30]
            ],
            "zipShapefiles": [],
        }
    )


@app.route("/layers/ip4")
def ip4_geojson():
    """
    GeoJSON do IP4 (Instalações Portuárias).
    Observação: alguns entregáveis vêm apenas no ZIP; nesse caso, extraímos para temp e lemos o(s) .shp.
    """
    global _ip4_geojson_cache
    if _ip4_geojson_cache is not None and not _geojson_has_replacement_char(_ip4_geojson_cache):
        return jsonify(_ip4_geojson_cache)

    # Requisito do usuário: usar SOMENTE os arquivos diretamente em assets/IP4.
    # Preferência: SHP. Fallback: GeoJSON.
    shps: list[Path] = []
    geojsons: list[Path] = []
    try:
        if IP4_DIR.exists() and IP4_DIR.is_dir():
            shps = [p for p in IP4_DIR.iterdir() if p.is_file() and p.suffix.lower() == ".shp"]
            shps.sort(key=lambda p: str(p).lower())
            geojsons = [
                p
                for p in IP4_DIR.iterdir()
                if p.is_file() and p.suffix.lower() in (".geojson", ".json")
            ]
            geojsons.sort(key=lambda p: str(p).lower())
    except Exception:
        shps = []
        geojsons = []
    if not shps and not geojsons:
        abort(404, description="IP4: nenhum .shp/.geojson encontrado diretamente em assets/IP4.")

    # Se houver SHP, usa o mesmo critério do /info: escolhe um único SHP "melhor".
    # Caso contrário, escolhe o melhor GeoJSON.
    try:
        if shps:
            candidates = []
            for p in shps:
                try:
                    sz = int(p.stat().st_size)
                except Exception:
                    sz = 0
                rec = _safe_shp_record_count(p)
                candidates.append((p, rec, sz))

            def score(item):
                _p, _rec, _sz = item
                has = 0 if isinstance(_rec, int) and _rec > 0 else (1 if _rec is None else 2)
                return (has, -int(_sz), str(_p.name).lower())

            candidates.sort(key=score)
            shps = [candidates[0][0]]

            # Se faltar .shx, cria cópia local regravada (com .shx)
            shps = [_ensure_shx_via_local_copy(shps[0])]
            gdf = _read_and_merge_shapefiles(shps)
            gdf = _ensure_wgs84(gdf)
            gdf = _sanitize_gdf_for_json(gdf)

            # Se o shapefile vier vazio (0 feições), cria um placeholder para permitir visualizar a camada.
            if gdf is None or len(gdf) == 0:
                center = None
                try:
                    b = _get_amazonas_boundary_geom()
                    if b is not None:
                        try:
                            center = b.representative_point()
                        except Exception:
                            try:
                                center = b.centroid
                            except Exception:
                                center = None
                except Exception:
                    center = None

                if center is None:
                    # fallback: centro aproximado do AM (mesmo usado no frontend legado)
                    lon, lat = -63.0, -4.5
                else:
                    lon, lat = float(getattr(center, "x", -63.0)), float(getattr(center, "y", -4.5))

                geojson = {
                    "type": "FeatureCollection",
                    "features": [
                        {
                            "type": "Feature",
                            "geometry": {"type": "Point", "coordinates": [lon, lat]},
                            "properties": {
                                "NOME": "IP4 (sem feições no SHP)",
                                "_note": "Placeholder gerado pelo sistema porque o shapefile IP4 está vazio (0 registros).",
                                "_source": "assets/IP4",
                            },
                        }
                    ],
                }
            else:
                geojson = json.loads(gdf.to_json())
                # Repara acentuação de atributos (pt-BR) via leitura direta do DBF (pyshp).
                geojson = _repair_geojson_props_from_dbf(shps[0], geojson)
                geojson = _repair_geojson_text_mojibake(geojson)
        else:
            # GeoJSON fallback
            candidates = []
            for p in geojsons:
                try:
                    sz = int(p.stat().st_size)
                except Exception:
                    sz = 0
                rec = _safe_geojson_feature_count(p)
                candidates.append((p, rec, sz))

            def score(item):
                _p, _rec, _sz = item
                has = 0 if isinstance(_rec, int) and _rec > 0 else (1 if _rec is None else 2)
                return (has, -int(_sz), str(_p.name).lower())

            candidates.sort(key=score)
            geojson = _read_geojson_file(candidates[0][0])
    except Exception as e:
        abort(500, description=f"Falha ao ler fonte IP4: {e}")

    _ip4_geojson_cache = geojson
    return jsonify(geojson)


@app.route("/layers/bueiros-br174/info")
def bueiros_br174_info():
    shp = _br174_layer_shapefile("bueiros")
    return jsonify(
        {
            "available": shp.exists(),
            "basePath": str(BR174_BASE),
            "shapefile": shp.name,
            "shapefilePath": str(shp),
        }
    )


@app.route("/layers/bueiros-br174")
def bueiros_br174_geojson():
    global _bueiros_br174_geojson_cache
    if _bueiros_br174_geojson_cache is not None:
        return jsonify(_bueiros_br174_geojson_cache)

    shp = _br174_layer_shapefile("bueiros")
    if not shp.exists():
        abort(404, description="BUEIROS BR-174: shapefile não encontrado em assets/BR-174.")
    try:
        gdf = _read_and_merge_shapefiles([shp])
        gdf = _ensure_wgs84(gdf)
        gdf = _sanitize_gdf_for_json(gdf)
        geojson = json.loads(gdf.to_json())
    except Exception as e:
        abort(500, description=f"Falha ao ler shapefile BUEIROS BR-174: {e}")

    _bueiros_br174_geojson_cache = geojson
    return jsonify(geojson)


@app.route("/layers/prads-br174/info")
def prad_br174_info():
    shp = _br174_layer_shapefile("prad")
    return jsonify(
        {
            "available": shp.exists(),
            "basePath": str(BR174_BASE),
            "shapefile": shp.name,
            "shapefilePath": str(shp),
        }
    )


@app.route("/layers/prads-br174")
def prad_br174_geojson():
    global _prad_br174_geojson_cache
    if _prad_br174_geojson_cache is not None:
        return jsonify(_prad_br174_geojson_cache)

    shp = _br174_layer_shapefile("prad")
    if not shp.exists():
        abort(404, description="PRAD_174: shapefile não encontrado em assets/BR-174.")
    try:
        gdf = _read_and_merge_shapefiles([shp])
        gdf = _ensure_wgs84(gdf)
        gdf = _sanitize_gdf_for_json(gdf)
        geojson = json.loads(gdf.to_json())
    except Exception as e:
        abort(500, description=f"Falha ao ler shapefile PRAD_174: {e}")

    _prad_br174_geojson_cache = geojson
    return jsonify(geojson)


@app.route("/layers/bueiros-br230/info")
def bueiros_br230_info():
    shps = _br230_layer_shapefiles("bueiros")
    return jsonify(
        {
            "available": len(shps) > 0,
            "basePath": str(BR230_BASE),
            "shapefiles": [p.name for p in shps],
            "shapefilePaths": [str(p) for p in shps],
            "count": len(shps),
        }
    )


@app.route("/layers/bueiros-br230")
def bueiros_br230_geojson():
    global _bueiros_br230_geojson_cache
    if _bueiros_br230_geojson_cache is not None:
        return jsonify(_bueiros_br230_geojson_cache)

    shps = _br230_layer_shapefiles("bueiros")
    if not shps:
        abort(404, description="BUEIROS BR-230: nenhum shapefile encontrado em assets/BR-230/BUEIROS.")
    try:
        gdf = _read_and_merge_shapefiles(shps)
        gdf = _ensure_wgs84(gdf)
        gdf = _sanitize_gdf_for_json(gdf)
        geojson = json.loads(gdf.to_json())
    except Exception as e:
        abort(500, description=f"Falha ao ler shapefile BUEIROS BR-230: {e}")

    _bueiros_br230_geojson_cache = geojson
    return jsonify(geojson)


@app.route("/layers/pontes-br230/info")
def pontes_br230_info():
    shps = _br230_layer_shapefiles("pontes")
    return jsonify(
        {
            "available": len(shps) > 0,
            "basePath": str(BR230_PONTES_DIR),
            "shapefiles": [p.name for p in shps],
            "shapefile": shps[0].name if shps else None,
            "shapefilePaths": [str(p) for p in shps],
            "count": len(shps),
        }
    )


@app.route("/layers/pontes-br230")
def pontes_br230_geojson():
    global _pontes_br230_geojson_cache
    if _pontes_br230_geojson_cache is not None:
        return jsonify(_pontes_br230_geojson_cache)

    shps = _br230_layer_shapefiles("pontes")
    if not shps:
        abort(404, description="Pontes BR-230: nenhum shapefile encontrado em assets/BR-230/PONTES_BR230.")

    try:
        gdf = _read_and_merge_shapefiles(shps)
        gdf = _ensure_wgs84(gdf)
        gdf = _sanitize_gdf_for_json(gdf)
        geojson = json.loads(gdf.to_json())
    except Exception as e:
        abort(500, description=f"Falha ao ler shapefile(s) de pontes BR-230: {e}")

    _pontes_br230_geojson_cache = geojson
    return jsonify(geojson)


@app.route("/layers/pontes-br319/info")
def pontes_br319_info():
    shps = _br319_pontes_shapefiles()
    return jsonify(
        {
            "available": len(shps) > 0,
            "basePath": str(BR319_PONTES_DIR),
            "basePaths": [str(p) for p in BR319_PONTES_DIRS],
            "shapefiles": [p.name for p in shps],
            "shapefilePaths": [str(p) for p in shps],
            "count": len(shps),
        }
    )


@app.route("/layers/pontes-br319")
def pontes_br319_geojson():
    global _pontes_br319_geojson_cache
    if _pontes_br319_geojson_cache is not None:
        return jsonify(_pontes_br319_geojson_cache)

    shps = _br319_pontes_shapefiles()
    if not shps:
        abort(
            404,
            description="Pontes BR-319: nenhum shapefile encontrado em assets/BR-319/BASE DAS PONTES/SHP BR 319 ou assets/BR-319/PONTES-BR 319.",
        )

    try:
        gdf = _read_and_merge_shapefiles(shps)
        gdf = _ensure_wgs84(gdf)
        gdf = _sanitize_gdf_for_json(gdf)
        geojson = json.loads(gdf.to_json())
    except Exception as e:
        abort(500, description=f"Falha ao ler shapefile(s) de pontes BR-319: {e}")

    _pontes_br319_geojson_cache = geojson
    return jsonify(geojson)


@app.route("/layers/balsa-igapo-acu/info")
def balsa_igapo_acu_info():
    shps = _vector_sources_in_dir(BR319_BALSA_DIR)
    return jsonify(
        {
            "available": len(shps) > 0,
            "basePath": str(BR319_BALSA_DIR),
            "shapefiles": [p.name for p in shps],
            "shapefilePaths": [str(p) for p in shps],
            "count": len(shps),
        }
    )


@app.route("/layers/balsa-igapo-acu")
def balsa_igapo_acu_geojson():
    global _balsa_igapo_acu_geojson_cache
    if _balsa_igapo_acu_geojson_cache is not None:
        return jsonify(_balsa_igapo_acu_geojson_cache)

    shps = _vector_sources_in_dir(BR319_BALSA_DIR)
    if not shps:
        abort(404, description="Balsa Igapó-Açu: nenhum shapefile/geojson em assets/BR-319/BALSA_IGAPO_ACU.")

    try:
        gdf = _read_and_merge_shapefiles(shps)
        gdf = _ensure_wgs84(gdf)
        gdf = _sanitize_gdf_for_json(gdf)
        geojson = json.loads(gdf.to_json())
    except Exception as e:
        abort(500, description=f"Falha ao ler Balsa Igapó-Açu: {e}")

    _balsa_igapo_acu_geojson_cache = geojson
    return jsonify(geojson)


@app.route("/layers/hidrovias-br319/info")
def hidrovias_br319_info():
    shps = _vector_sources_in_dir(BR319_HIDROVIAS_DIR)
    return jsonify(
        {
            "available": len(shps) > 0,
            "basePath": str(BR319_HIDROVIAS_DIR),
            "shapefiles": [p.name for p in shps],
            "shapefilePaths": [str(p) for p in shps],
            "count": len(shps),
        }
    )


@app.route("/layers/hidrovias-br319")
def hidrovias_br319_geojson():
    global _hidrovias_br319_geojson_cache
    if _hidrovias_br319_geojson_cache is not None:
        return jsonify(_hidrovias_br319_geojson_cache)

    shps = _vector_sources_in_dir(BR319_HIDROVIAS_DIR)
    if not shps:
        abort(404, description="Hidrovias BR-319: nenhum shapefile/geojson em assets/BR-319/SNV_HIDROVIAS.")

    try:
        gdf = _read_and_merge_shapefiles(shps)
        gdf = _ensure_wgs84(gdf)
        gdf = _sanitize_gdf_for_json(gdf)
        geojson = json.loads(gdf.to_json())
    except Exception as e:
        abort(500, description=f"Falha ao ler Hidrovias BR-319: {e}")

    _hidrovias_br319_geojson_cache = geojson
    return jsonify(geojson)


@app.route("/layers/bueiros-br319/info")
def bueiros_br319_info():
    shps = _find_bueiros_br319_shapefiles(BR319_BUEIROS_DIR)
    if not shps:
        try:
            # Ajuda a diagnosticar: às vezes a pasta tem só .prj/.cpg/.xml mas não o .shp.
            existing_files = [p.name for p in BR319_BUEIROS_DIR.iterdir() if p.is_file()] if BR319_BUEIROS_DIR.exists() else []
            existing_files.sort(key=lambda s: s.lower())
        except Exception:
            existing_files = []
        return jsonify(
            {
                "available": False,
                "basePath": str(BR319_BUEIROS_DIR),
                "message": "Nenhum .shp de bueiros encontrado. Verifique se os arquivos .shp/.dbf/.shx estão na pasta.",
                "filesFound": existing_files,
            }
        )
    return jsonify(
        {
            "available": True,
            "basePath": str(BR319_BUEIROS_DIR),
            "shapefiles": [p.name for p in shps],
            "shapefilePaths": [str(p) for p in shps],
            "count": len(shps),
        }
    )


@app.route("/layers/bueiros-br319")
def bueiros_br319_geojson():
    global _bueiros_br319_geojson_cache
    if _bueiros_br319_geojson_cache is not None:
        return jsonify(_bueiros_br319_geojson_cache)

    shps = _find_bueiros_br319_shapefiles(BR319_BUEIROS_DIR)
    if not shps:
        abort(
            404,
            description="Bueiros BR-319: nenhum shapefile com 'Bueiros' no nome encontrado em assets/BR-319/SHP_BUEIRO.",
        )

    try:
        gdf = _read_and_merge_shapefiles(shps)
        gdf = _ensure_wgs84(gdf)
        gdf = _sanitize_gdf_for_json(gdf)
        geojson = json.loads(gdf.to_json())
    except Exception as e:
        abort(500, description=f"Falha ao ler shapefile(s) de bueiros BR-319: {e}")

    _bueiros_br319_geojson_cache = geojson
    return jsonify(geojson)


@app.route("/layers/pca-prads-br319/info")
def pca_prads_br319_info():
    shps = _shps_in_dir(BR319_PCA_PRAD_DIR)
    if not shps:
        return jsonify(
            {
                "available": False,
                "basePath": str(BR319_PCA_PRAD_DIR),
                "message": "Pasta inacessível ou nenhum .shp encontrado.",
            }
        )
    return jsonify(
        {
            "available": True,
            "basePath": str(BR319_PCA_PRAD_DIR),
            "shapefiles": [p.name for p in shps],
            "shapefile": shps[0].name,
            "shapefilePaths": [str(p) for p in shps],
            "count": len(shps),
        }
    )


@app.route("/layers/pca-prads-br319")
def pca_prads_br319_geojson():
    global _pca_prads_br319_geojson_cache
    if _pca_prads_br319_geojson_cache is not None:
        return jsonify(_pca_prads_br319_geojson_cache)

    shps = _shps_in_dir(BR319_PCA_PRAD_DIR)
    if not shps:
        abort(404, description="PCA - PRADS BR-319: nenhum shapefile encontrado em assets/BR-319/PCA_PRAD.")

    try:
        gdf = _read_and_merge_shapefiles(shps)
        gdf = _ensure_wgs84(gdf)
        gdf = _sanitize_gdf_for_json(gdf)
        geojson = json.loads(gdf.to_json())
    except Exception as e:
        abort(500, description=f"Falha ao ler shapefile(s) PCA - PRADS BR-319: {e}")

    _pca_prads_br319_geojson_cache = geojson
    return jsonify(geojson)


@app.route("/layers/pca-prads-cmm-br319/info")
def pca_prads_cmm_br319_info():
    shps = _shps_in_dir(BR319_PCA_PRAD_CMM_DIR)
    if not shps:
        return jsonify(
            {
                "available": False,
                "basePath": str(BR319_PCA_PRAD_CMM_DIR),
                "message": "Pasta inacessível ou nenhum .shp encontrado.",
            }
        )
    return jsonify(
        {
            "available": True,
            "basePath": str(BR319_PCA_PRAD_CMM_DIR),
            "shapefiles": [p.name for p in shps],
            "shapefile": shps[0].name,
            "shapefilePaths": [str(p) for p in shps],
            "count": len(shps),
        }
    )


@app.route("/layers/pca-prads-cmm-br319")
def pca_prads_cmm_br319_geojson():
    global _pca_prads_cmm_br319_geojson_cache
    if _pca_prads_cmm_br319_geojson_cache is not None:
        return jsonify(_pca_prads_cmm_br319_geojson_cache)

    shps = _shps_in_dir(BR319_PCA_PRAD_CMM_DIR)
    if not shps:
        abort(404, description="PCA - PRADS CMM BR-319: nenhum shapefile encontrado em assets/BR-319/PCA_PRAD_CMM.")

    try:
        gdf = _read_and_merge_shapefiles(shps)
        gdf = _ensure_wgs84(gdf)
        gdf = _sanitize_gdf_for_json(gdf)
        geojson = json.loads(gdf.to_json())
    except Exception as e:
        abort(500, description=f"Falha ao ler shapefile(s) PCA - PRADS CMM BR-319: {e}")

    _pca_prads_cmm_br319_geojson_cache = geojson
    return jsonify(geojson)


@app.route("/layers/prads-br319/info")
def prads_br319_info():
    shps = _shps_in_dir(BR319_PRADS_DIR)
    if not shps:
        return jsonify(
            {
                "available": False,
                "basePath": str(BR319_PRADS_DIR),
                "message": "Pasta inacessível ou nenhum .shp encontrado.",
            }
        )
    return jsonify(
        {
            "available": True,
            "basePath": str(BR319_PRADS_DIR),
            "shapefiles": [p.name for p in shps],
            "shapefile": shps[0].name,
            "shapefilePaths": [str(p) for p in shps],
            "count": len(shps),
        }
    )


@app.route("/layers/prads-br319")
def prads_br319_geojson():
    global _prads_br319_geojson_cache
    if _prads_br319_geojson_cache is not None:
        return jsonify(_prads_br319_geojson_cache)

    shps = _shps_in_dir(BR319_PRADS_DIR)
    if not shps:
        abort(
            404,
            description="PRADS BR-319: nenhum shapefile encontrado em assets/BR-319/SP_PRADES_NOVO/PRADs_BR 319.",
        )

    try:
        gdf = _read_and_merge_shapefiles(shps)
        gdf = _ensure_wgs84(gdf)
        gdf = _sanitize_gdf_for_json(gdf)
        geojson = json.loads(gdf.to_json())
    except Exception as e:
        abort(500, description=f"Falha ao ler shapefile(s) PRADS BR-319: {e}")

    _prads_br319_geojson_cache = geojson
    return jsonify(geojson)


@app.route("/layers/<layer_id>")
def layer_geojson(layer_id: str):
    """
    Retorna GeoJSON de um shapefile (camada) pelo ID.
    """
    return jsonify(_load_layer_geojson(layer_id))


@app.route("/data")
def data():
    """
    Retorna o GeoJSON do shapefile de SEGMENTOS para o Leaflet.
    Mantido por compatibilidade, mas o recomendado é usar /layers e /layers/<id>.
    """
    gdf = _load_geodataframe()
    geojson = json.loads(gdf.to_json())
    return jsonify(geojson)


@app.route("/data-files/<path:filename>")
def data_files(filename: str):
    """
    Serve arquivos de dados (GeoJSON/ZIP/etc.) por caminho relativo à pasta DATA_DIR.
    Isso permite que o frontend consuma diretamente no deploy sem depender de caminhos locais.
    """
    try:
        base = DATA_DIR.resolve()
        rel = Path(filename)
        # Normaliza e bloqueia path traversal
        full = (base / rel).resolve()
        if base not in full.parents and full != base:
            abort(403, description="Caminho inválido.")
        if not full.exists() or not full.is_file():
            abort(404, description="Arquivo não encontrado.")
        return send_from_directory(base, str(rel).replace("\\", "/"), as_attachment=False)
    except Exception as e:
        # Evita vazar detalhes do FS
        abort(404, description="Arquivo não encontrado.")


@app.route("/layers/segmentos-br319/info")
def segmentos_br319_info():
    shp = SEGMENTOS_SHP
    return jsonify(
        {
            "available": shp.exists(),
            "basePath": str(shp.parent),
            "shapefile": shp.name,
            "shapefilePath": str(shp),
        }
    )


@app.route("/layers/segmentos-br319")
def segmentos_br319_geojson():
    # Reaproveita a mesma lógica do /data, mas com rota explícita por camada.
    gdf = _load_geodataframe()
    gdf = _ensure_wgs84(gdf)
    geojson = json.loads(gdf.to_json())
    return jsonify(geojson)


@app.route("/export/shp")
def export_shp():
    """
    Exporta a camada principal (SEGMENTOS) em Shapefile.
    Retorna um .zip contendo .shp/.shx/.dbf/.prj (e arquivos auxiliares).
    """
    gdf = _load_geodataframe()
    if gdf is None or len(gdf) == 0:
        abort(404, description="No data to export")

    gdf = _ensure_wgs84(gdf)

    with tempfile.TemporaryDirectory() as tmp:
        out_dir = Path(tmp)
        stem = "segmentos"
        shp_path = out_dir / f"{stem}.shp"

        try:
            gdf.to_file(shp_path, driver="ESRI Shapefile")
        except Exception as e:
            abort(500, description=f"Failed to export shapefile: {e}")

        zip_path = out_dir / f"{stem}.zip"
        with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
            for p in out_dir.glob(f"{stem}.*"):
                if p.name == zip_path.name:
                    continue
                zf.write(p, arcname=p.name)

        return send_file(
            zip_path,
            as_attachment=True,
            download_name=f"{stem}.zip",
            mimetype="application/zip",
        )


@app.route("/health")
def health():
    return jsonify(
        {
            "status": "ok",
            "env": _runtime_env(),
            "production": IS_PRODUCTION,
            "api_only": API_ONLY,
            "frontend": _frontend_url() if API_ONLY else None,
            "low_memory": _low_memory_mode(),
            "assets_dir": str(ASSETS_DIR),
            "assets_exists": ASSETS_DIR.is_dir(),
            "layers_indexed": len(_layers_index or {}),
        }
    )


def _startup_warmup() -> None:
    """Indexa shapefiles e aquece o Limite Estadual (pode ser lento em disco de rede)."""
    global _layers_index, _limite_estadual_geojson_cache

    try:
        if os.environ.get("INFRAGEO_SKIP_INDEX", "").strip().lower() in ("1", "true", "yes", "on"):
            _layers_index = {}
        else:
            _layers_index = _discover_shapefiles()
    except Exception:
        _layers_index = {}

    # Warm-up do Limite Estadual consome muita RAM (GeoPandas + GeoJSON).
    # No Render Free/Starter (512 MB) isso derruba a instância — pular e carregar sob demanda.
    if _low_memory_mode() or os.environ.get("INFRAGEO_SKIP_LIMITE_WARMUP", "").strip().lower() in (
        "1",
        "true",
        "yes",
        "on",
    ):
        try:
            _geojson_cache.clear()
        except Exception:
            pass
        gc.collect()
        return

    # Warm-up: cacheia o Limite Estadual para evitar delay no 1º acesso.
    try:
        shp_path = _find_limite_estadual_shapefile()
        if shp_path and shp_path.exists():
            gdf = _read_and_merge_shapefiles([shp_path])
            gdf = _ensure_wgs84(gdf)
            gdf = _limite_gdf_to_clean_state_outline(gdf)
            _limite_estadual_geojson_cache = json.loads(gdf.to_json())
            del gdf
    except Exception:
        # Se falhar, mantém sob demanda (não derruba o servidor).
        pass

    # Se o encoding de shapefiles mudou em runtime, manter cache pode perpetuar '�'.
    try:
        _geojson_cache.clear()
    except Exception:
        pass
    gc.collect()


def _env_flag(name: str, default: bool = False) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() in ("1", "true", "yes", "on")


# Em Render/produção, warm-up em background para o processo escutar PORT rápido
# (health check). Forçar sync com INFRAGEO_BLOCKING_WARMUP=1.
_use_bg_warmup = _env_flag("INFRAGEO_BG_WARMUP") or bool(os.environ.get("RENDER"))
if _env_flag("INFRAGEO_BLOCKING_WARMUP"):
    _use_bg_warmup = False

if _use_bg_warmup:
    import threading

    threading.Thread(target=_startup_warmup, daemon=True, name="infrageo-warmup").start()
else:
    _startup_warmup()


if __name__ == "__main__":
    import socket

    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "5000"))
    debug = os.environ.get("FLASK_DEBUG", "1" if not IS_PRODUCTION else "0").strip().lower() in (
        "1",
        "true",
        "yes",
        "on",
    )
    local_url = f"http://127.0.0.1:{port}"

    def _lan_ips():
        ips = []
        try:
            hostname = socket.gethostname()
            for info in socket.getaddrinfo(hostname, None, socket.AF_INET):
                ip = info[4][0]
                if ip and not ip.startswith("127.") and ip not in ips:
                    ips.append(ip)
        except Exception:
            pass
        if not ips:
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                s.connect(("8.8.8.8", 80))
                ip = s.getsockname()[0]
                s.close()
                if ip and not ip.startswith("127."):
                    ips.append(ip)
            except Exception:
                pass
        return ips

    print(f"\nInfraGeo AM — modo {'desenvolvimento' if debug else 'produção local'}")
    print(f"Acesso neste PC: {local_url}")
    if host in ("0.0.0.0", "::"):
        for ip in _lan_ips():
            print(f"Outros dispositivos (mesma rede Wi‑Fi): http://{ip}:{port}")
        print("Dica: no celular, use o endereço da rede acima (firewall do Windows pode pedir permissão).\n")
    else:
        print(f"Host: {host} (defina HOST=0.0.0.0 para abrir em outros aparelhos na rede)\n")

    if debug and os.environ.get("FLASK_OPEN_BROWSER", "1").strip().lower() in ("1", "true", "yes", "on"):
        import threading
        import webbrowser

        threading.Timer(1.0, lambda: webbrowser.open(local_url)).start()

    app.run(debug=debug, use_reloader=False, host=host, port=port)

