"""Gera pasta estática para deploy do frontend no Vercel.

Substitui url_for do Jinja por caminhos /static/... e copia static/.
A API continua no backend (Render); o vercel.json faz proxy das rotas.

Uso:
  python scripts/build_vercel_frontend.py
  cd vercel-public && npx vercel deploy --prod
"""
from __future__ import annotations

import os
import re
import shutil
import stat
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / "templates" / "index.html"
STATIC_SRC = ROOT / "static"
CFG = ROOT / "vercel-frontend" / "vercel.json"
OUT = ROOT / "vercel-public"
API_BASE = ""  # same-origin via rewrites no Vercel


def _replace_url_for(html: str) -> str:
    pattern = re.compile(
        r"""\{\{\s*url_for\(\s*['\"]static['\"]\s*,\s*filename\s*=\s*['\"]([^'\"]+)['\"]\s*\)\s*\}\}"""
    )
    return pattern.sub(r"/static/\1", html)


def _on_rm_error(func, path, _exc_info):
    try:
        os.chmod(path, stat.S_IWRITE)
        func(path)
    except Exception:
        pass


def _rmtree(path: Path) -> None:
    if not path.exists():
        return
    for _ in range(5):
        try:
            shutil.rmtree(path, onerror=_on_rm_error)
            return
        except PermissionError:
            time.sleep(0.4)
    bak = path.with_name(path.name + f".old-{int(time.time())}")
    try:
        path.rename(bak)
    except Exception as exc:
        raise RuntimeError(f"Não foi possível limpar {path}: {exc}") from exc


def main() -> None:
    _rmtree(OUT)
    OUT.mkdir(parents=True, exist_ok=True)
    static_dst = OUT / "static"
    if static_dst.exists():
        _rmtree(static_dst)
    shutil.copytree(STATIC_SRC, static_dst)
    if CFG.is_file():
        shutil.copy2(CFG, OUT / "vercel.json")

    html = TEMPLATE.read_text(encoding="utf-8")
    html = _replace_url_for(html)
    inject = (
        f'<script>window.__INFRAGEO_API__={API_BASE!r};</script>\n'
        "    <script\n"
    )
    html = html.replace(
        '<script\n      src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"',
        inject + '      src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"',
        1,
    )
    (OUT / "index.html").write_text(html, encoding="utf-8")
    print(f"OK: {OUT} ({sum(1 for _ in OUT.rglob('*') if _.is_file())} files)")


if __name__ == "__main__":
    main()
