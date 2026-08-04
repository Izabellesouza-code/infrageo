"""Configuração Gunicorn para produção (Docker / servidor Linux)."""
import multiprocessing
import os

bind = f"0.0.0.0:{os.environ.get('PORT', '8000')}"

# Indexação de shapefiles no import é pesada: preload compartilha memória entre workers.
preload_app = os.environ.get("GUNICORN_PRELOAD", "true").strip().lower() in ("1", "true", "yes", "on")

# No Render (memória limitada) o default é 1 worker; localmente 2–4.
if os.environ.get("RENDER") or os.environ.get("INFRAGEO_ENV", "").strip().lower() == "production":
    _default_workers = 1
else:
    _default_workers = max(2, min(4, multiprocessing.cpu_count()))
workers = int(os.environ.get("WEB_CONCURRENCY", str(_default_workers)))

# Leitura/conversão GeoJSON pode demorar em camadas grandes.
timeout = int(os.environ.get("GUNICORN_TIMEOUT", "180"))
graceful_timeout = int(os.environ.get("GUNICORN_GRACEFUL_TIMEOUT", "30"))
keepalive = int(os.environ.get("GUNICORN_KEEPALIVE", "5"))

accesslog = "-"
errorlog = "-"
loglevel = os.environ.get("LOG_LEVEL", "info").lower()
capture_output = True
