/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

/**
 * Service worker de la PWA (T59, T50). Lo compila vite-plugin-pwa con `strategies: 'injectManifest'`
 * (vite.config.ts) e inyecta en `self.__WB_MANIFEST` la lista de archivos de la interfaz.
 *
 * Hace lo mismo que el que generaba `generateSW` (precache de la interfaz, `index.html` para las navegaciones
 * salvo `/api/`, actualización con aviso) y además muestra las notificaciones push de las alertas.
 * Solo existe en el build (`npm run build` / `preview`), nunca en `npm run dev`.
 */
declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<string | { url: string; revision: string | null }>
}

// --- Interfaz sin conexión (T59) ---
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
// Una navegación a /api nunca recibe index.html. Las respuestas de la API no se cachean aquí (eso es T60).
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html'), { denylist: [/^\/api\//] }))

// registerType: 'prompt': la versión nueva espera a que la persona acepte (hooks/useActualizacionPwa.ts).
self.addEventListener('message', (evento) => {
  if (evento.data?.type === 'SKIP_WAITING') void self.skipWaiting()
})

// --- Notificaciones push (T50) ---
const TEXTO_FIJO = 'Tienes un aviso nuevo en IkaMoney.'

interface CargaPush {
  titulo?: string
  cuerpo?: string
  url?: string
}

/** Solo rutas de la propia app: un `url` raro del mensaje no debe llevar a otro sitio. */
function rutaSegura(url: unknown): string {
  return typeof url === 'string' && url.startsWith('/') && !url.startsWith('//') ? url : '/alertas'
}

self.addEventListener('push', (evento) => {
  let carga: CargaPush = {}
  try {
    carga = (evento.data?.json() as CargaPush | undefined) ?? {}
  } catch {
    // Mensaje vacío o que no es JSON: se muestra el texto fijo.
  }
  // Nunca saldos ni datos (IC-07): el backend manda un texto fijo, y si no llega nada, este.
  evento.waitUntil(
    self.registration.showNotification(carga.titulo || 'IkaMoney', {
      body: carga.cuerpo || TEXTO_FIJO,
      icon: '/pwa-192x192.png',
      badge: '/pwa-64x64.png',
      data: { url: rutaSegura(carga.url) },
    }),
  )
})

self.addEventListener('notificationclick', (evento) => {
  evento.notification.close()
  const destino = new URL(rutaSegura((evento.notification.data as { url?: string } | null)?.url), self.location.origin).href
  evento.waitUntil(
    (async () => {
      const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const abierta = ventanas.find((v) => new URL(v.url).origin === self.location.origin)
      if (abierta) {
        await abierta.focus()
        await abierta.navigate(destino).catch(() => {})
      } else {
        await self.clients.openWindow(destino)
      }
    })(),
  )
})
