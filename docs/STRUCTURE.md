# Estrutura de pastas — InfraGeo AM

Mapa rápido do que cada pasta faz no sistema.

## Camada de aplicação

| Pasta | Responsabilidade |
|---|---|
| `app.py` | Entrypoint Flask atual (todas as rotas `/layers`, `/health`, `/`) |
| `backend/app/` | Pacote para modularizar rotas/serviços/modelos |
| `backend/workers/` | Jobs longos (ingestão SHP → PostGIS no futuro) |
| `backend/migrations/` | Versionamento de schema de banco |
| `config/` | Paths e flags de ambiente |
| `gunicorn.conf.py` | Workers/timeouts para Docker |

## Interface

| Pasta | Responsabilidade |
|---|---|
| `templates/` | HTML servido pelo Flask |
| `static/` | `app.js`, `app.css`, imagens |
| `frontend/` | Espaço para migração React/Vite (opcional) |

## Dados

| Pasta | Responsabilidade |
|---|---|
| `assets/` | Fonte de verdade atual dos shapefiles |
| `data/raw` | Entradas brutas de pipeline |
| `data/processed` | Resultados de ETL |
| `data/cache` | Cache em disco |
| `uploads/incoming` | ZIP/SHP recebidos |
| `uploads/processed` | Uploads já processados |
| `uploads/failed` | Uploads com erro |
| `storage/exports` | Downloads gerados |
| `storage/tmp` | Temporários seguros |

## Operação

| Pasta | Responsabilidade |
|---|---|
| `infra/` | Compose auxiliar, SQL init, nginx |
| `logs/` | Logs persistidos |
| `scripts/` | Manutenção / diagnóstico |
| `tools/` | Utilitários pontuais |
| `tests/` | Unitário + integração + fixtures |
| `docs/` | Documentação |

## Fluxo atual (simplificado)

```
Browser → Flask (app.py)
            ├─ templates/ + static/
            └─ lê geometrias em assets/**/*.shp → GeoJSON
```

## Fluxo futuro (com PostGIS)

```
Browser → API (backend/app)
            ├─ catálogo em PostGIS
            ├─ workers/ ingere uploads/
            └─ migrations/ versiona schema
```
