import { MODO_PRUEBA } from './auth'
import { escribir } from './escribir'
import { finanzasApi } from './finanzasApi'
import type { FinanzasService } from './finanzasApi'
import { finanzasMock } from './finanzasMock'

/**
 * Servicio de tarjetas y deudas que usa toda la app.
 * Usa el mismo interruptor que la autenticación (VITE_AUTH_MOCK): con sesión de prueba
 * no hay token real, así que los datos también tienen que ser de prueba.
 */
const servicio: FinanzasService = MODO_PRUEBA ? finanzasMock : finanzasApi

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
