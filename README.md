# intalacion_aim_cf_mofo_675_sr

Proyecto web estatico para guia de instalacion de telemetria AiM en CFMoto 675 SR.

## Estructura

- `index.html`, `style.css`, `app.js`: frontend desplegable en Vercel.
- `vercel.json`: configuracion del enrutado estatico.
- `.vercelignore`: evita subir utilidades no web al deploy.
- `tools/telemetria/`: scripts y archivos Excel auxiliares (no se despliegan).

## Deploy en Vercel

1. Conectar repositorio en Vercel.
2. Framework Preset: `Other`.
3. Build Command: vacio.
4. Output Directory: vacio o `.`.
5. Deploy.

## Generar Excel de telemetria (local)

```bash
cd tools/telemetria
pip3 install -r requirements.txt
python3 generar_plan_telemetria.py
```
