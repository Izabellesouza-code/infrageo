# Migrations

Migrations do banco espacial (Alembic / SQL) quando PostGIS estiver ativo.

- `versions/` — revisões versionadas
- `infra/db/init/` — SQL de bootstrap (schemas, roles)

Enquanto o WebGIS lê shapefiles de `assets/`, esta pasta fica preparada para a migração futura.
