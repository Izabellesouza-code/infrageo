# Frontend — InfraGeo AM

Hoje o mapa roda em **Leaflet** servido pelo Flask:

| Caminho atual | Função |
|---|---|
| `../templates/index.html` | Página principal |
| `../static/app.js` | Lógica do mapa / camadas / tabelas |
| `../static/app.css` | Estilos |

Esta pasta `frontend/` está preparada para uma evolução futura (React/Vite/MapLibre),
conforme `docs/ARCHITECTURE.md`.

## Subpastas

- `public/` — assets estáticos do front (ícones, favicon futuros)
- `src/components/` — UI (sidebar, legendas, tabelas)
- `src/map/` — integração com o mapa
- `src/styles/` — CSS/tema
