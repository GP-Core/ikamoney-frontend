import { ApiError } from './api'
import { MODO_PRUEBA } from './auth'
import { finanzasApi } from './finanzasApi'
import type { FinanzasService } from './finanzasApi'
import { finanzasMock } from './finanzasMock'

/**
 * Servicio de tarjetas y deudas que usa toda la app.
 * Usa el mismo interruptor que la autenticación (VITE_AUTH_MOCK): con sesión de prueba
 * no hay token real, así que los datos también tienen que ser de prueba.
 */
const servicio: FinanzasService = MODO_PRUEBA ? finanzasMock : finanzasApi

/**
 * Sin conexión la app es de solo lectura (T60): no hay sincronización, así que lo que se escribiera
 * se perdería o chocaría después. Los botones y las rutas ya se apagan; esta es la última barrera
 * por si alguno se escapa. En modo de prueba es la única que frena una escritura, porque ahí no hay red.
 */
async function escribir<T>(accion: () => Promise<T>): Promise<T> {
  if (!navigator.onLine) {
    throw new ApiError(0, 'Sin conexión: no se guardó nada. Inténtalo cuando tengas internet.')
  }
  return accion()
}

export const finanzasService: FinanzasService = {
  ...servicio,
  crearTarjeta: (datos) => escribir(() => servicio.crearTarjeta(datos)),
  actualizarTarjeta: (id, datos) => escribir(() => servicio.actualizarTarjeta(id, datos)),
  eliminarTarjeta: (id) => escribir(() => servicio.eliminarTarjeta(id)),

  crearPlanMsi: (tarjetaId, datos) => escribir(() => servicio.crearPlanMsi(tarjetaId, datos)),
  actualizarPlanMsi: (id, datos) => escribir(() => servicio.actualizarPlanMsi(id, datos)),
  eliminarPlanMsi: (id) => escribir(() => servicio.eliminarPlanMsi(id)),

  crearDeuda: (datos) => escribir(() => servicio.crearDeuda(datos)),
  actualizarDeuda: (id, datos) => escribir(() => servicio.actualizarDeuda(id, datos)),
  eliminarDeuda: (id) => escribir(() => servicio.eliminarDeuda(id)),
}
