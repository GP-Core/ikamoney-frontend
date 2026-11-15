import { NOMBRE_BASE } from './offline'
import { borrarDatosLocales } from './tokenStorage'

/**
 * Bases de IndexedDB de la app, por nombre. Solo hace falta para los navegadores que no
 * saben listar sus bases (indexedDB.databases): en los demás se borran todas las que existan.
 * Si agregas otra base, ponla aquí.
 */
const BASES_CONOCIDAS: string[] = [NOMBRE_BASE] // copias para consultar sin conexión (T60)

/** La caché de la interfaz (T59) no tiene datos del usuario y la app la necesita para abrir. */
const CACHE_DE_INTERFAZ = 'workbox-precache'

function borrarSessionStorage(): void {
  Object.keys(sessionStorage)
    .filter((clave) => clave.startsWith('ikamoney:'))
    .forEach((clave) => sessionStorage.removeItem(clave))
}

function borrarBase(nombre: string): Promise<void> {
  return new Promise((resolve) => {
    const peticion = indexedDB.deleteDatabase(nombre)
    // "blocked": otra pestaña la tiene abierta; se borra en cuanto la suelte.
    peticion.onsuccess = peticion.onerror = peticion.onblocked = () => resolve()
  })
}

async function borrarIndexedDb(): Promise<void> {
  if (!('indexedDB' in globalThis)) return
  const existentes = indexedDB.databases ? await indexedDB.databases() : []
  const nombres = new Set([...BASES_CONOCIDAS, ...existentes.flatMap((b) => (b.name ? [b.name] : []))])
  await Promise.all([...nombres].map(borrarBase))
}

/** Respuestas de la API guardadas por el service worker (T60). */
async function borrarCachesDeDatos(): Promise<void> {
  if (!('caches' in globalThis)) return
  const nombres = await caches.keys()
  await Promise.all(nombres.filter((n) => !n.startsWith(CACHE_DE_INTERFAZ)).map((n) => caches.delete(n)))
}

/** Deja de recibir notificaciones en este dispositivo. */
async function cancelarPush(): Promise<void> {
  if (!('serviceWorker' in navigator)) return
  const registro = await navigator.serviceWorker.getRegistration()
  const suscripcion = await registro?.pushManager?.getSubscription()
  await suscripcion?.unsubscribe()
}

/**
 * Borra todo lo que la app guardó del usuario en este dispositivo (T56): token,
 * almacenamiento local, IndexedDB, cachés de datos y la suscripción push.
 * Cada paso es independiente: si uno falla o el navegador no lo soporta, los demás siguen.
 */
export async function limpiarDispositivo(): Promise<void> {
  const pasos = [
    async () => borrarDatosLocales(),
    async () => borrarSessionStorage(),
    borrarIndexedDb,
    borrarCachesDeDatos,
    cancelarPush,
  ]
  await Promise.allSettled(pasos.map((paso) => paso()))
}
