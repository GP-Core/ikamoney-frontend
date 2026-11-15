import { useSyncExternalStore } from 'react'

function suscribir(avisar: () => void): () => void {
  window.addEventListener('online', avisar)
  window.addEventListener('offline', avisar)
  return () => {
    window.removeEventListener('online', avisar)
    window.removeEventListener('offline', avisar)
  }
}

/**
 * true si el dispositivo tiene conexión. Cambia solo cuando el navegador avisa que se perdió
 * o volvió (por ejemplo, al activar el modo avión). Sin conexión la app es de solo lectura (T60).
 */
export function useConexion(): boolean {
  return useSyncExternalStore(
    suscribir,
    () => navigator.onLine,
    () => true,
  )
}
