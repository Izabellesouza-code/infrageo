# Backend

Pacote Python para organização do servidor InfraGeo AM.

| Subpasta | Uso |
|---|---|
| `app/routes` | Blueprints Flask (modularização futura) |
| `app/services` | Regras de negócio / leitura de camadas |
| `app/models` | Catálogo, metadados, DTOs |
| `app/utils` | Helpers |
| `workers` | Jobs assíncronos |
| `migrations` | Schema PostGIS |

**Entrypoint atual:** `../app.py` (mantido na raiz para Docker/Gunicorn/Render).
