import { ApiError } from './api'

/**
 * Sin conexión la app es de solo lectura (T60): no hay sincronización, así que lo que se escribiera
 * se perdería o chocaría después. Los botones y las rutas ya se apagan; esta es la última barrera
 * por si alguno se escapa. En modo de prueba es la única que frena una escritura, porque ahí no hay red.
 */
export async function escribir<T>(accion: () => Promise<T>): Promise<T> {
  if (!navigator.onLine) {
    throw new ApiError(0, 'Sin conexión: no se guardó nada. Inténtalo cuando tengas internet.')
  }
  return accion()
}
