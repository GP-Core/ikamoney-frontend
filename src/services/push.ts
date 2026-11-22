import { ApiError } from './api'
import { MODO_PRUEBA } from './auth'
import { alertasService } from './alertas'
import type { SuscripcionPush } from '../types/alerta'

/**
 * Notificaciones push de la PWA (T49, T50, IC-08).
 *
 * El permiso no lo controlamos nosotros: si la persona lo niega o lo quita en el navegador, el
 * interruptor de la app no puede quedar encendido. Este archivo habla con el navegador (permiso y
 * suscripción) y deja el registro en el servidor a alertasService. El envío lo hace el backend con sus
 * llaves VAPID (ver ikamoney-backend/docs/NOTIFICACIONES.md) y el service worker (src/sw.ts) lo muestra.
 *
 * Sin VITE_VAPID_PUBLIC_KEY la opción no se ofrece, salvo en modo de prueba, donde solo se simula el permiso.
 */

/** Error de esta pantalla con un texto que se puede mostrar tal cual. */
export class ErrorPush extends Error {}

export type PermisoPush = 'no-soportado' | 'default' | 'granted' | 'denied'

/** El navegador sabe de notificaciones y de service workers (en iPhone, solo con la app instalada). */
export function pushSoportado(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
}

/** La opción de push se ofrece: hay llave pública configurada, o es una demostración con datos de prueba. */
export function pushHabilitado(): boolean {
  return Boolean(import.meta.env.VITE_VAPID_PUBLIC_KEY) || MODO_PRUEBA
}

export function permisoPush(): PermisoPush {
  return pushSoportado() ? Notification.permission : 'no-soportado'
}

/** Pide el permiso al navegador. Si ya estaba concedido o negado, no vuelve a preguntar. */
export async function pedirPermisoPush(): Promise<PermisoPush> {
  if (!pushSoportado()) return 'no-soportado'
  try {
    return await Notification.requestPermission()
  } catch {
    return permisoPush()
  }
}

/** La llave pública VAPID viene en base64url; el navegador la quiere como bytes. */
function llaveEnBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const relleno = '='.repeat((4 - (base64url.length % 4)) % 4)
  const texto = atob((base64url + relleno).replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = new Uint8Array(texto.length)
  for (let i = 0; i < texto.length; i++) bytes[i] = texto.charCodeAt(i)
  return bytes
}

async function registroDelServiceWorker(): Promise<ServiceWorkerRegistration> {
  // getRegistration y no `ready`: en `npm run dev` no hay service worker y `ready` nunca resolvería.
  const registro = await navigator.serviceWorker.getRegistration()
  if (!registro) throw new ErrorPush('La app todavía no está lista para notificaciones. Recarga la página e inténtalo de nuevo.')
  return registro
}

/**
 * Suscribe este dispositivo al servicio de push del navegador y lo registra en el servidor.
 * Pide el permiso antes (pedirPermisoPush). En modo de prueba no hay servidor ni llave: no hace nada.
 * Lanza un ErrorPush o un ApiError, ambos con un texto para mostrar, si no se pudo.
 */
export async function suscribirPush(): Promise<void> {
  const llave = import.meta.env.VITE_VAPID_PUBLIC_KEY
  if (!llave) {
    if (MODO_PRUEBA) return
    throw new ErrorPush('Las notificaciones no están disponibles por ahora.')
  }
  try {
    const registro = await registroDelServiceWorker()
    const suscripcion =
      (await registro.pushManager.getSubscription()) ??
      (await registro.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: llaveEnBytes(llave) }))
    const { endpoint, keys } = suscripcion.toJSON()
    if (!endpoint || !keys?.p256dh || !keys.auth) throw new Error('suscripción incompleta')
    const datos: SuscripcionPush = { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } }
    // Siempre se manda, aunque ya existiera: el servidor la deja como de esta persona y renueva sus llaves.
    await alertasService.registrarPush(datos)
  } catch (error) {
    // Los textos propios y los del servidor ya se pueden mostrar; los del navegador, no.
    if (error instanceof ErrorPush || error instanceof ApiError) throw error
    throw new ErrorPush('No pudimos activar las notificaciones en este dispositivo. Inténtalo de nuevo.')
  }
}

/**
 * Quita este dispositivo de las notificaciones: primero en el servidor (mientras la sesión sigue viva) y luego
 * en el navegador. Nunca lanza: si algo falla, el servidor lo limpia solo cuando el servicio de push
 * responda que la suscripción ya no existe.
 */
export async function desuscribirPush(): Promise<void> {
  // Cerrar sesión no debe esperar a una red lenta: pasados unos segundos se sigue sin esperar la respuesta.
  await Promise.race([quitarSuscripcion(), new Promise<void>((resolve) => setTimeout(resolve, ESPERA_MAX_MS))])
}

const ESPERA_MAX_MS = 4000

async function quitarSuscripcion(): Promise<void> {
  try {
    if (!pushSoportado()) return
    const registro = await navigator.serviceWorker.getRegistration()
    const suscripcion = await registro?.pushManager?.getSubscription()
    if (!suscripcion) return
    try {
      await alertasService.quitarPush(suscripcion.endpoint)
    } catch {
      // Sin conexión o sesión vencida: igual se cancela aquí.
    }
    await suscripcion.unsubscribe()
  } catch {
    // Sin service worker o sin permiso: no hay nada que quitar.
  }
}
