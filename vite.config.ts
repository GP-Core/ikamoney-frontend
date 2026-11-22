import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// El frontend llama a /api en su propio origen: así la cookie de sesión (HttpOnly, SameSite=Strict) es del mismo
// sitio y no "de terceros". En producción lo hace el rewrite de vercel.json; en desarrollo y en `npm run preview`,
// este proxy hacia el backend local.
// API_PROXY_TARGET cambia el destino si el backend corre en otro puerto (por ejemplo, para probar en paralelo).
const proxyApi = { '/api': { target: process.env.API_PROXY_TARGET ?? 'http://localhost:8000' } }

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // App instalable (T59). El service worker solo existe en el build (npm run build / preview), no en dev.
    // Guía completa: docs/PWA.md
    VitePWA({
      // Service worker propio (src/sw.ts) para poder recibir notificaciones push (T50). Hace lo mismo que el
      // generado: precache de la interfaz y de index.html para las navegaciones salvo /api/ (ver el archivo).
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      // Avisa cuando hay versión nueva y el usuario decide cuándo actualizar (ver hooks/useActualizacionPwa.ts).
      registerType: 'prompt',
      // Las previews de Vercel con protección solo entregan el manifest si la petición lleva la cookie de sesión.
      useCredentials: true,
      // Los íconos ya entran al precache por globPatterns; así no se repiten.
      includeManifestIcons: false,
      manifest: {
        id: '/',
        name: 'IkaMoney',
        short_name: 'IkaMoney',
        description: 'Tu balance del mes y la proyección de tus próximos meses, con tus compromisos a meses sin intereses.',
        lang: 'es-MX',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        // Colores de la guía de estilo T20: arena (fondo de pantallas) y azul marino (navegación).
        background_color: '#F5EFE3',
        theme_color: '#043A5E',
        categories: ['finance'],
        // Generados desde public/favicon.svg con `npm run generar-iconos` (pwa-assets.config.ts).
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      injectManifest: {
        // Solo la interfaz (app shell): HTML, CSS, JS, íconos y fuentes autoalojadas. El manifest lo agrega el plugin.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
  server: { proxy: proxyApi },
  preview: { proxy: proxyApi },
})
