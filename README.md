# NutriScan

App de escaneo nutricional con verificación por Gmail (demo) y análisis de
comida por foto usando Claude.

## Estructura

```
├── api/
│   └── analyze.js      # función serverless: llama a Anthropic con tu API key (privada)
├── src/
│   ├── NutriScan.jsx   # componente principal de la app
│   └── main.jsx        # punto de entrada de React
├── index.html
├── package.json
└── vite.config.js
```

## Desplegar en Vercel (gratis)

1. Crea una cuenta en https://vercel.com si no tienes una.
2. Sube esta carpeta a un repositorio de GitHub (o usa `vercel` CLI directo,
   ver abajo).
3. En Vercel: **New Project** → importa el repositorio.
4. En **Settings → Environment Variables**, agrega:
   - `ANTHROPIC_API_KEY` = tu API key de https://console.anthropic.com
5. Despliega. Vercel detecta automáticamente `vite` y la carpeta `api/` como
   funciones serverless.
6. Tu app queda en una URL tipo `https://nutriscan-tuusuario.vercel.app` —
   funciona para cualquiera, sin necesidad de cuenta de Claude.

### Alternativa: desplegar con la CLI (sin GitHub)

```bash
npm install -g vercel
cd nutriscan
vercel
# sigue las instrucciones, luego:
vercel env add ANTHROPIC_API_KEY
vercel --prod
```

## Desarrollo local

```bash
npm install
npm run dev
```

Nota: en local, `/api/analyze` solo funciona corriendo con `vercel dev`
(no con `vite` solo), porque las funciones serverless son específicas de
Vercel:

```bash
npm install -g vercel
vercel dev
```

## Importante sobre seguridad

- La API key de Anthropic **nunca** debe ir en el código del navegador.
  Por eso `api/analyze.js` corre en el servidor y el frontend solo le habla
  a `/api/analyze`, nunca directo a `api.anthropic.com`.
- El login por usuario/contraseña y el código de verificación de Gmail en
  `NutriScan.jsx` son una simulación (todo vive en memoria del navegador).
  Para producción real necesitas:
  - Guardar contraseñas con hash (bcrypt/argon2) en una base de datos.
  - OAuth de Google real para verificar la cuenta de Gmail.
  - Un servicio de envío de correo (p. ej. Resend, SendGrid) para el código.
