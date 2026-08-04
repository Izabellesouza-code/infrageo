# Arquitetura completa — Sistema Web GIS

## Objetivo
Construir um WebGIS com **mapa interativo (Leaflet/Mapbox-like)**, múltiplas **camadas geoespaciais** (rodovias, unidades de conservação, IP4, limite estadual, contratos) e um backend preparado para **receber e publicar shapefiles** com governança (validação, versionamento, auditoria e performance).

---

## Visão geral (componentes)

### Frontend (Web)
- **Framework**: React + Vite (ou Next.js) + TypeScript.
- **Mapa**: Leaflet (simples) ou MapLibre GL (mais “Mapbox-like”, ideal para *vector tiles*).
- **Funcionalidades**:
  - Controle de camadas (visibilidade, opacidade, ordem).
  - Seleção/consulta (click/hover) e tabela de atributos (como seu protótipo).
  - Filtros por atributo e por geometria (bbox, raio, polígono).
  - Upload/gestão de arquivos (SHP/ZIP) para camadas permitidas (perfil admin).
  - Exportação (GeoJSON/CSV) e impressão (PDF) se necessário.

### Backend (API)
Dois estilos comuns (você pode combinar):
- **API de negócio** (FastAPI/Flask): autenticação, permissões, catálogo de camadas, contratos, metadados, auditoria.
- **Serviço geoespacial**:
  - Opção A (robusta/OGC): **GeoServer** (WMS/WFS) + GeoWebCache (tiles).
  - Opção B (moderna/performance): **Vector tiles** via `pg_tileserv`/`tegola`/`t-rex` (MVT) + API de consulta.
  - Opção C (simplicidade): API retorna GeoJSON (bom para poucos dados; não escala para bases grandes).

### Banco de dados espacial
- **PostgreSQL + PostGIS** como fonte única de verdade.
- Índices GiST/BRIN, *constraints* e *views* para publicar camadas.
- Metadados e versionamento (dataset/layer/version).

### Pipeline de ingestão (Shapefile → PostGIS)
- Entrada preferencial: **ZIP** contendo `.shp .shx .dbf .prj` (e `.cpg` se houver).
- Ferramentas:
  - `ogr2ogr` (GDAL) para importação e reprojeção.
  - Alternativa Python: GeoPandas (bom para protótipo; GDAL é mais confiável em produção).
- Etapas:
  - Validação do pacote (arquivos essenciais, encoding, CRS).
  - Normalização de CRS para **EPSG:4674 (SIRGAS 2000)** ou **EPSG:4326** (defina um padrão).
  - Limpeza e padronização de atributos (nomes, tipos, nulos).
  - Carga em tabela *staging* → promoção para tabela final (com versão).

### Armazenamento de arquivos (opcional)
Mesmo usando PostGIS, é útil manter o original:
- **S3/MinIO** (produção) ou diretório local (dev).
- Guarda ZIP bruto + logs de importação + relatórios de validação.

### Observabilidade e segurança
- Logs estruturados, métricas (Prometheus), rastreamento (OpenTelemetry) opcional.
- Auth: JWT/OAuth2; RBAC (admin/editor/visualizador).
- Auditoria: quem subiu o dataset, quando, hash do arquivo, status.

---

## Fluxos principais

### 1) Visualização de camadas
1. Front consulta catálogo: `GET /api/layers`
2. Usuário ativa uma camada.
3. Front solicita dados por:
   - **Tiles** (recomendado): `/{layer}/{z}/{x}/{y}.pbf` (MVT) via tegola/t-rex/pg_tileserv
   - ou WMS: GeoServer
   - ou GeoJSON: `GET /api/layers/{id}/features?bbox=...`

### 2) Upload de shapefile (admin)
1. Front envia ZIP: `POST /api/uploads` (multipart)
2. API grava o arquivo + cria registro `upload` (status = `received`)
3. Worker assíncrono processa:
   - valida → importa *staging* → promove → atualiza metadados
4. API disponibiliza status e relatório: `GET /api/uploads/{id}`

### 3) Consulta/seleção/tabela de atributos
- Click no mapa → `GET /api/layers/{id}/identify?lat=...&lng=...`
- Consulta por bbox/polígono → `POST /api/query` com GeoJSON geometry + filtros.

---

## Modelo de dados (PostGIS)

### Tabelas de catálogo (recomendado)
- **`gis.layer`**
  - `id` (uuid), `slug` (texto único), `name`, `geometry_type`, `srid`
  - `source_type` (`postgis`, `geoserver`, `external`)
  - `default_style` (json), `minzoom`, `maxzoom`, `is_public`
- **`gis.dataset`**
  - representa um “lote” importado (um ZIP)
  - `id`, `layer_id`, `version`, `uploaded_by`, `uploaded_at`, `file_uri`, `status`
  - `row_count`, `bbox`, `crs_detected`, `crs_target`, `hash_sha256`

### Tabelas de camadas (domínio)
Você pode organizar por schema `data`:
- `data.rodovias` (LineString/MultiLineString)
- `data.unidades_conservacao` (Polygon/MultiPolygon)
- `data.ip4` (depende do seu modelo: ponto/linha/polígono)
- `data.limite_estado` (Polygon/MultiPolygon)
- `data.contratos` (frequentemente atributos + geometria associada; pode ser:
  - `data.contratos` (tabela de negócio) e
  - `data.contratos_geometrias` (um-para-muitos) ou geometria direta se 1:1)

### Regras e índices (essenciais)
- Coluna geometria: `geom geometry(<type>, <srid>)`
- Índice espacial: `CREATE INDEX ... USING GIST (geom);`
- Índice por código/chave: `CREATE INDEX ... (codigo);`
- Constraints:
  - `ST_IsValid(geom)` (com cuidado; pode ser aplicado na promoção/ETL)
  - `geom IS NOT NULL` se aplicável

---

## Publicação de mapas (três opções)

### Opção A — GeoServer (OGC clássico)
- Prós: WMS/WFS, estilos SLD, ecossistema maduro.
- Contras: vector tiles não é o foco; tuning necessário.
- Quando usar: integrações institucionais, demandas OGC, WMS/WFS obrigatório.

### Opção B — Vector tiles (recomendado para UX “Mapbox-like”)
- Backend: PostGIS + `tegola` (ou `t-rex`/`pg_tileserv`)
- Front: MapLibre GL (ou Leaflet com plugin de vector tiles)
- Prós: performance, experiência moderna, escalável.

### Opção C — GeoJSON via API (somente para bases pequenas)
- Prós: simples de implementar (parecido com seu `app.py` atual).
- Contras: pesado no browser/rede; não escala.

---

## Estrutura de repositório sugerida
```
/
  app.py                 # Flask entrypoint atual
  backend/
    app/                 # API (rotas/serviços/modelos)
    workers/             # filas (importação shapefile)
    migrations/          # Alembic/SQL
  frontend/              # Evolução UI (hoje: templates/ + static/)
  templates/             # HTML Flask
  static/                # JS/CSS Leaflet
  assets/                # Shapefiles publicados
  config/                # Settings de ambiente
  data/                  # raw / processed / cache
  uploads/               # incoming / processed / failed
  storage/               # exports / tmp
  logs/
  tests/
  infra/
    docker-compose.yml   # postgis + geoserver (opcional)
    db/init/             # SQL inicial (schemas, roles)
    nginx/
  docs/
    ARCHITECTURE.md
    STRUCTURE.md
    DEPLOY.md
```

A estrutura acima já está materializada no repositório (ver `docs/STRUCTURE.md`).

---

## Contratos e IP4 (modelagem prática)
Como “contratos” geralmente são dados administrativos, recomendo separar:
- **Contrato (negócio)**: `contracts.contract` (sem geometria, com chaves, datas, valores, status, empresa).
- **Geometria vinculada**: `contracts.contract_feature`
  - `contract_id`
  - `layer_slug` (ex.: `rodovias`, `ip4`)
  - `feature_id` (ou `geom` próprio se vier desenhado)
Isso te dá flexibilidade para associar um contrato a múltiplos segmentos/áreas.

Para **IP4**, como o termo varia por órgão, trate como uma camada normal no catálogo:
- `data.ip4` com `geom` + atributos originais
- e padronize um conjunto mínimo de chaves (ex.: `codigo`, `nome`, `classe`, etc.)

---

## Requisitos de ingestão de shapefiles (padrão)

### Entrada
- Aceitar **ZIP** com:
  - obrigatório: `.shp .shx .dbf .prj`
  - recomendado: `.cpg` (encoding)

### Normalização
- CRS alvo: escolher **EPSG:4674** (Brasil/SIRGAS) ou **EPSG:4326** (web).
- No banco, manter CRS alvo; no frontend, tiles/serviços cuidam da projeção.

### Validações mínimas
- Geometrias válidas (ou corrigidas com `ST_MakeValid` na promoção).
- Tipo geométrico esperado por camada (linha/polígono/ponto).
- Campos obrigatórios (se você quiser impor contrato de dados).

---

## APIs mínimas (proposta)
- `GET /api/layers` — catálogo
- `GET /api/layers/{slug}` — metadados (SRID, bbox, estilo)
- `GET /api/layers/{slug}/tiles/{z}/{x}/{y}.pbf` — vector tiles (se usar tegola/t-rex)
- `GET /api/layers/{slug}/features` — fallback GeoJSON por bbox/filtro
- `GET /api/layers/{slug}/identify` — retorna feições sob um ponto
- `POST /api/uploads` — upload ZIP shapefile
- `GET /api/uploads/{id}` — status + relatório
- `POST /api/datasets/{id}/promote` — promover staging→produção (admin)

---

## Stack recomendada (mínimo para produção)
- **Frontend**: React + MapLibre GL
- **API**: FastAPI (Python)
- **DB**: PostGIS
- **Tiles**: Tegola (MVT)
- **Fila/worker**: Redis + RQ/Celery (para importação)
- **Storage**: MinIO (para guardar ZIPs)
- **Deploy**: Docker + Nginx (reverse proxy) + TLS

