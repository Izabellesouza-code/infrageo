FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    INFRAGEO_ENV=production \
    PORT=8000 \
    WEB_CONCURRENCY=1 \
    GUNICORN_PRELOAD=false \
    GUNICORN_TIMEOUT=180 \
    INFRAGEO_BG_WARMUP=1

WORKDIR /app

# Dependências do sistema (GeoPandas / GDAL / PROJ)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gdal-bin \
    libgdal-dev \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py gunicorn.conf.py ./
COPY templates ./templates
COPY static ./static
COPY assets ./assets

EXPOSE 8000

# Render injeta PORT dinamicamente; o healthcheck respeita a variável.
HEALTHCHECK --interval=30s --timeout=10s --start-period=180s --retries=3 \
  CMD python -c "import os,urllib.request; p=os.environ.get('PORT','8000'); urllib.request.urlopen(f'http://127.0.0.1:{p}/health', timeout=5)" || exit 1

CMD ["gunicorn", "-c", "gunicorn.conf.py", "app:app"]
