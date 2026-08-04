# Uploads

Pipeline preparado para receber shapefiles ZIP:

1. Cliente envia pacote → `incoming/`
2. Worker valida/importa → move para `processed/`
3. Em caso de erro → `failed/` + log em `../logs/`

Hoje o WebGIS lê direto de `assets/`. Esta pasta habilita o fluxo
de upload futuro descrito em `docs/ARCHITECTURE.md`.
