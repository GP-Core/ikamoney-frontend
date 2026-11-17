import { MODO_PRUEBA } from './auth'
import { escribir } from './escribir'
import { movimientosApi } from './movimientosApi'
import type { MovimientosService } from './movimientosApi'
import { movimientosMock } from './movimientosMock'

/**
 * Servicio de ingresos y gastos que usa toda la app. Usa el mismo interruptor que la autenticación
 * (VITE_AUTH_MOCK): con sesión de prueba no hay token real, así que los datos también son de prueba.
 */
const servicio: MovimientosService = MODO_PRUEBA ? movimientosMock : movimientosApi

export const movimientosService: MovimientosService = {
  ...servicio,
  crear: (datos) => escribir(() => servicio.crear(datos)),
  actualizar: (id, datos) => escribir(() => servicio.actualizar(id, datos)),
  eliminar: (id) => escribir(() => servicio.eliminar(id)),
}
