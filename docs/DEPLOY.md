# Deploy — InfraGeo AM

## 1) Render (recomendado na nuvem)

O projeto já inclui `Dockerfile` + `render.yaml` (Blueprint).
Os shapefiles em `assets/` entram na imagem Docker (~100 MB).

### Pré-requisitos

1. Conta em [https://render.com](https://render.com)
2. Repositório Git (GitHub / GitLab / Bitbucket) com **todo o código + pasta `assets/`**
3. Conta Render (plano **Free** funciona; Starter é mais estável para GIS)

### Checklist antes do push

- [ ] `assets/` versionada no Git (`.shp`, `.dbf`, `.shx`, `.prj` etc.)
- [ ] Nenhum arquivo individual > **100 MB** (limite do GitHub)
- [ ] `Dockerfile`, `render.yaml` e `gunicorn.conf.py` na raiz
- [ ] Teste local opcional: `docker compose up -d --build` → `http://localhost:8000/health`

### Passo a passo (Blueprint — mais simples)

1. Faça commit e push do projeto para o GitHub (ou outro Git).
2. Abra o [Dashboard Render](https://dashboard.render.com).
3. Clique em **New +** → **Blueprint**.
4. Conecte a conta Git e selecione o repositório `webgis_infrageo`.
5. Confirme o arquivo `render.yaml` (já vem com `plan: free`) e clique em **Apply**.
6. Aguarde o build Docker (pode levar vários minutos na 1ª vez: GDAL + pip + assets).
7. Quando o status ficar **Live**, abra a URL pública (ex.: `https://webgis-infrageo.onrender.com`).
8. Valide:
   - `https://SEU-SERVICO.onrender.com/` — mapa
   - `https://SEU-SERVICO.onrender.com/health` — deve retornar `"status":"ok"` e `"assets_exists":true`

### Limitações do Free

- **512 MB RAM / 0.1 CPU** — GeoPandas + shapefiles grandes podem ficar lentos ou estourar memória
- Dorme após **~15 min** sem acesso; a 1ª abertura depois disso demora ~1 min (cold start)
- **750 horas/mês** de instância Free por workspace
- Sem disco persistente (os dados vão dentro da imagem Docker via `assets/`)

Se travar ou cair por memória, suba para **Starter** no Dashboard (Settings → Instance Type).

### Passo a passo (Web Service manual)

1. **New +** → **Web Service** → selecione o repositório.
2. Configurações:
   - **Language / Runtime:** Docker
   - **Dockerfile Path:** `./Dockerfile`
   - **Docker Context:** `.`
   - **Health Check Path:** `/health`
   - **Instance type:** **Free**
3. Environment variables:

| Key | Value |
|---|---|
| `INFRAGEO_ENV` | `production` |
| `WEB_CONCURRENCY` | `1` |
| `GUNICORN_TIMEOUT` | `180` |
| `GUNICORN_PRELOAD` | `true` |
| `INFRAGEO_BG_WARMUP` | `1` |

4. **Create Web Service** e aguarde o deploy.
5. Não defina `PORT` manualmente — o Render injeta automaticamente.

### Depois do deploy

- Cada push na branch conectada gera um novo deploy automático.
- Logs: Dashboard → serviço → **Logs**.
- Se o health falhar: confira se `assets/` entrou na imagem e se `/health` responde 200.
- Se faltar memória: suba o plano ou mantenha `WEB_CONCURRENCY=1`.

### Região

O Blueprint usa `ohio` (mais próximo da América do Sul entre as regiões do Render).
Altere em `render.yaml` (`region:`) se preferir `oregon`, `frankfurt`, etc.

---

## 2) Docker local (produção local)

```bash
docker compose up -d --build
```

- App: `http://localhost:8000`
- Health: `http://localhost:8000/health`

Variáveis: copie `.env.example` → `.env`.

---

## 3) Gunicorn local (sem Docker)

```bash
pip install -r requirements.txt
set INFRAGEO_ENV=production
gunicorn -c gunicorn.conf.py app:app
```

---

## 4) Checklist go-live

- [ ] `assets/` com os `.shp/.dbf/.shx/.prj` necessários
- [ ] `/health` → `status: ok` e `assets_exists: true`
- [ ] `/layers` lista as camadas esperadas
- [ ] HTTPS / domínio (Render fornece HTTPS automático)
- [ ] `INFRAGEO_ENV=production`
