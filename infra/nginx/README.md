# Nginx — reverse proxy (opcional)

Use este diretório para configs de proxy na frente do Gunicorn
quando o deploy for em VPS (não necessário no Docker Compose simples).

Exemplo de upstream:

```
upstream infrageo {
  server webgis:8000;
}
```
