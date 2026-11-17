import { MODO_PRUEBA } from './auth'

/**
 * Permiso del navegador para las notificaciones push (T49, IC-08).
 *
 * El permiso no lo controlamos nosotros: si la persona lo niega o lo quita en el navegador, el
 * interruptor de la app no puede quedar encendido. Este archivo solo habla con el navegador; guardar
 * el canal es cosa del servicio de alertas.
 *
 * El envío real de push (llaves VAPID, suscripciones y service worker) está pendiente en el
 * backend: ver docs/PWA.md. Mientras no haya VITE_VAPID_PUBLIC_KEY, la opción solo se puede
 * probar en modo de prueba.
 */

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
