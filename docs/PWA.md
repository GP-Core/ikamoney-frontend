# App instalable (PWA) · T59

IKAMoney se puede instalar en el celular o la computadora y **abre sin conexión**. Esto lo dan dos piezas:

- **Manifest** (`manifest.webmanifest`): nombre, colores, orientación e íconos de la app.
- **Service worker** (`sw.js`): guarda la interfaz en el dispositivo para que la app abra aunque no haya red.

Los **datos** sin conexión (respuestas de la API) no son parte de esta tarea: son T60.

## Qué se guarda y qué no

| Se guarda (precache) | No se guarda |
|---|---|
| `index.html`, el JS y el CSS del build | Las respuestas de la API (`/api/...`), que siempre van a la red |
| Íconos, `favicon.svg`, `favicon.ico` y el manifest | Nada de lo que venga de otro dominio |
| Fuentes autoalojadas (`.woff2`), si algún día se agregan | |

Hoy son 12 archivos (unos 273 KB) en una sola caché llamada `workbox-precache-v2-...`. Si la app abre sin conexión pero la pantalla dice "No se pudo conectar con el servidor", eso es lo esperado: la interfaz sí abrió y los datos llegan con T60.

El service worker **solo existe en el build**: `npm run dev` no lo registra (así la recarga en caliente no se mezcla con la caché). Para probarlo usa `npm run build` y `npm run preview`.

## Archivos

| Archivo | Qué hace |
|---|---|
| `vite.config.ts` | Configura `vite-plugin-pwa`: manifest, qué entra a la caché y que `/api` nunca reciba `index.html` |
| `public/favicon.svg` | Símbolo del logo vectorizado. Es el favicon y la fuente de todos los íconos |
| `pwa-assets.config.ts` | Configuración del generador de íconos |
| `public/pwa-*.png`, `maskable-icon-512x512.png`, `apple-touch-icon-180x180.png`, `favicon.ico` | Íconos generados (no se editan a mano) |
| `src/hooks/useActualizacionPwa.ts` | Registra el service worker y revisa si hay versión nueva |
| `src/components/AvisoActualizacion.tsx` | Aviso de "versión nueva" y de "ya puede abrirse sin conexión" |
| `index.html` | Título, `theme-color` e íconos para el navegador y para iPhone |

Manifest: nombre `IkaMoney`, `display: standalone` (abre en ventana propia, sin barra del navegador), `orientation: portrait`, fondo de arranque arena `#F5EFE3` y color de barra azul marino `#043A5E` (guía de estilo T20).

## Íconos

El símbolo del logo solo existía a 180×165 px (`LOGOTIPOS/IKAMONEY.png`), muy poco para un ícono de 512 px, así que se vectorizó a `public/favicon.svg`:

- **Colores exactos de la guía T20**: azul `#043A5E`, verde `#4EA145` y dorado `#EFBF04` (coinciden con los del PNG).
- **Moneda**: círculo exacto. **Estrella**: polígono de 4 puntas, rellena de blanco como aparece el logo en la guía (en el PNG era un recorte transparente).
- **Anillo, flecha y hoja**: trazados del PNG y suavizados.

Para regenerar los íconos después de cambiar `public/favicon.svg`:

```bash
npm run generar-iconos
```

Sobrescribe los PNG y el `favicon.ico` de `public/`. Si Andrea entrega un SVG oficial del símbolo, basta con guardarlo como `public/favicon.svg` y correr el comando.

| Ícono | Para qué | Fondo |
|---|---|---|
| `pwa-64x64`, `pwa-192x192`, `pwa-512x512` | Escritorio, diálogo de instalación, pantalla de arranque de Android | Transparente |
| `maskable-icon-512x512` | Ícono del launcher de Android (lo recorta en círculo, gota, etc.) | Blanco |
| `apple-touch-icon-180x180` | Pantalla de inicio del iPhone (iOS pinta de negro lo transparente) | Blanco |
| `favicon.ico` (48) y `favicon.svg` | Pestaña del navegador | Transparente |

En el ícono maskable el símbolo ocupa el 70 % del lienzo y la punta de la flecha queda a 185 px del centro, dentro de la zona segura de Android (204.8 px en 512), así que no se recorta. Los íconos transparentes sobre fondo oscuro (barra de tareas de Windows en modo oscuro) pierden contraste en el anillo azul; en el celular no pasa porque Android y iPhone usan los de fondo blanco.

## Actualizaciones

Cuando se publica una versión nueva, el usuario **no tiene que reinstalar**:

1. La app revisa si hay versión nueva al abrirse, cada hora y cada vez que el usuario vuelve a ella (solo si hay internet).
2. Si la hay, la descarga en segundo plano y muestra el aviso **"Hay una versión nueva de IkaMoney"**.
3. **Actualizar** activa la versión nueva y recarga la página. **Después** cierra el aviso, y la versión nueva entra la próxima vez que la app se cierre por completo y se vuelva a abrir.

No se recarga sola para no interrumpir a alguien que está capturando datos. Vercel sirve el HTML con `cache-control: public, max-age=0, must-revalidate`, así que cada despliegue se detecta.

La primera vez que se abre la app, cuando termina de guardar la interfaz, aparece **"IkaMoney ya puede abrirse sin conexión"**. Sirve de señal para las pruebas: a partir de ahí ya se puede probar en modo avión.

## Cómo probar

### En la computadora

```bash
npm run build
```

```bash
npm run preview
```

1. Abre <http://localhost:4173> en Chrome o Edge.
2. DevTools → **Application** → **Manifest**: no debe haber errores de instalación. En la barra de direcciones aparece el ícono de instalar.
3. **Sin conexión**: DevTools → **Network** → **Offline** (o detén `npm run preview`) y recarga. La app debe abrir.
4. **Actualización**: cambia algo, vuelve a hacer `npm run build`, reinicia `npm run preview` y recarga. Debe aparecer el aviso de versión nueva.

### En el celular (necesita HTTPS)

El service worker y la instalación **solo funcionan con HTTPS** (o en `localhost`). Probar por la red local con `http://192.168.x.x` **no sirve** para esto, aunque la pantalla se vea bien.

Opciones:

- **Vercel**: sube la rama y usa la URL de preview que crea Vercel, o pásala a `main` para probar en <https://ikamoney-dun.vercel.app>.
- **Android sin desplegar**: activa la depuración USB en el celular, conéctalo, abre `chrome://inspect` en la computadora, activa **Port forwarding** de `4173` a `localhost:4173` y abre `http://localhost:4173` en el Chrome del celular.
- **iPhone**: necesita HTTPS sí o sí (Vercel o un túnel HTTPS).

Pasos:

- **Android (Chrome)**: puede aparecer el aviso "Instalar app"; si no, menú **⋮** → **Instalar app** (o "Agregar a pantalla principal"). Abre en ventana propia, con pantalla de arranque arena y el ícono.
- **iPhone (Safari)**: no hay aviso automático. Botón **Compartir** → **Agregar a pantalla de inicio**. Usa el `apple-touch-icon`; la pantalla de arranque es blanca, porque iOS no la toma del manifest.
- **Sin conexión**: abre la app una vez con internet y espera el aviso "ya puede abrirse sin conexión". Pon el celular en modo avión y ábrela desde el ícono de la pantalla de inicio.

### Resultados (para T63)

| Fecha | Dispositivo | Sistema y navegador | ¿Se instaló? | ¿Abre sin conexión? | ¿Llegó la actualización? | Notas |
|---|---|---|---|---|---|---|
| | | | | | | |

## Problemas frecuentes

| Síntoma | Qué revisar |
|---|---|
| No aparece "Instalar" | Que la URL sea HTTPS y que DevTools → Application → Manifest no muestre errores. Si cerraste el aviso, Chrome tarda en volver a mostrarlo: usa el menú ⋮ |
| La preview de Vercel pide iniciar sesión y no se puede instalar | La protección de Vercel exige la cookie de sesión. El manifest ya se pide con credenciales (`useCredentials`); si aun así falla, prueba en producción o desactiva la protección de las previews |
| En la preview la API falla | El backend solo acepta `https://ikamoney-dun.vercel.app` y `http://localhost:5173` (`CORS_ORIGINS`). Para T59 no importa: se valida la interfaz |
| No veo mis cambios | Pulsa **Actualizar** en el aviso o cierra la app por completo. En `npm run dev` no hay service worker |
| Hay que quitar el service worker de emergencia | En `vite.config.ts` agrega `selfDestroying: true` a `VitePWA` y despliega: el service worker se desregistra solo y borra su caché |
| `npm audit` marca 4 avisos "low" | Vienen de `deepmerge`, dentro de `workbox-build`, que solo se usa al compilar. No corras `npm audit fix --force`: bajaría `vite-plugin-pwa` a la 0.2.1 |

## Para T60 (datos sin conexión)

- La caché de respuestas de la API va en `workbox.runtimeCaching` dentro de `vite.config.ts` (por ejemplo, `NetworkFirst` para `/api/v1/...`), o en un service worker propio con `strategies: 'injectManifest'` si hace falta más control. El precache de la interfaz se queda como está.
- **Fuentes**: hoy la app usa las del sistema (T34). Si se adoptan las de la guía T20 (Playfair Display y Source Sans 3), deben ir **autoalojadas** (por ejemplo con `@fontsource`) para que entren al precache; desde el CDN de Google Fonts no funcionarían sin conexión.
