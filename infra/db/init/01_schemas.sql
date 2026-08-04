-- Bootstrap PostGIS (futuro)
-- Executado por infra/docker-compose quando o serviço postgis estiver ativo.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

CREATE SCHEMA IF NOT EXISTS gis;
CREATE SCHEMA IF NOT EXISTS data;
CREATE SCHEMA IF NOT EXISTS contracts;

COMMENT ON SCHEMA gis IS 'Catálogo de camadas e metadados InfraGeo';
COMMENT ON SCHEMA data IS 'Geometrias publicadas';
COMMENT ON SCHEMA contracts IS 'Contratos e vínculos geo';
