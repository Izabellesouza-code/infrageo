# InfraGeo AM — WebGIS

Sistema de geoprocessamento (Flask + Leaflet) para camadas rodoviárias e ambientais do Amazonas.

## Estrutura do repositório

```
webgis_infrageo/
├── app.py                # Aplicação Flask (entrypoint principal)
├── backend/              # Pacote backend (rotas/serviços/workers/migrations)
│   ├── app/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── models/
│   │   └── utils/
│   ├── workers/
│   └── migrations/
├── frontend/             # Evolução do front (hoje: templates/ + static/)
├── templates/            # HTML Flask
├── static/               # CSS/JS/imagens do mapa
│   ├── app.js            # Frontend principal (Leaflet)
│   └── js/               # Modularização em progresso (não usada em produção ainda)
├── assets/               # Shapefiles e GeoJSON publicados
├── config/               # Settings (paths, ambiente)
├── data/                 # Dados intermediários (raw / processed / cache)
├── uploads/              # Upload de SHP/ZIP (incoming / processed / failed)
├── storage/              # Exports e temporários
├── logs/                 # Logs de aplicação
├── tests/                # Testes unitários e de integração
├── scripts/              # Scripts de manutenção
├── tools/                # Utilitários (ex.: split_app_js.py)
├── docs/                 # Documentação
├── infra/                # Docker Compose auxiliar, SQL, nginx
├── Dockerfile
├── docker-compose.yml
├── gunicorn.conf.py
├── render.yaml
└── requirements.txt
```

O front do mapa carrega `static/js/main.js` (ES modules). O monolito antigo ficou em `static/app.js.bak`.

## Rodar local (desenvolvimento)

```bash
pip install -r requirements.txt
python app.py
```

Abre em `http://127.0.0.1:5000`.

## Rodar produção (Docker — local)

```bash
docker compose up -d --build
```

Health: `http://localhost:8000/health`

## Deploy na nuvem (Render)

Arquivos prontos: `Dockerfile` + `render.yaml`.

Passo a passo completo: [`docs/DEPLOY.md`](docs/DEPLOY.md).

Resumo: push no GitHub → Render Dashboard → **New → Blueprint** → aplicar `render.yaml` → aguardar build → abrir a URL `/health`.

Variáveis: veja `.env.example`.

## Pastas de dados

| Pasta | Uso |
|---|---|
| `assets/` | Camadas oficiais (SHP/GeoJSON) |
| `data/raw` | Entradas brutas de ETL |
| `data/processed` | Saídas processadas |
| `data/cache` | Cache local de GeoJSON |
| `uploads/` | Pacotes ZIP enviados pelo usuário |
| `storage/exports` | Exportações geradas pela API |
| `logs/` | Arquivos de log |

## Documentação

- `docs/ARCHITECTURE.md` — visão completa do sistema
- `docs/STRUCTURE.md` — mapa das pastas
- `docs/DEPLOY.md` — Docker e Render
