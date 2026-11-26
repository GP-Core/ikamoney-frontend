import { MODO_PRUEBA } from './auth'
import { cuentasApi } from './cuentasApi'
import type { CuentasService } from './cuentasApi'
import { cuentasMock } from './cuentasMock'
import { escribir } from './escribir'

/**
 * Servicio de cuentas (débito, ahorro, efectivo…) que usa toda la app. Usa el mismo interruptor que la
 * autenticación (VITE_AUTH_MOCK): con sesión de prueba no hay token real, así que los datos son de prueba.
 */
const servicio: CuentasService = MODO_PRUEBA ? cuentasMock : cuentasApi

export const cuentasService: CuentasService = {
  ...servicio,
  crear: (datos) => escribir(() => servicio.crear(datos)),
  editar: (id, datos) => escribir(() => servicio.editar(id, datos)),
  eliminar: (id) => escribir(() => servicio.eliminar(id)),
  crearMovimiento: (cuentaId, datos) => escribir(() => servicio.crearMovimiento(cuentaId, datos)),
  editarMovimiento: (cuentaId, movimientoId, datos) =>
    escribir(() => servicio.editarMovimiento(cuentaId, movimientoId, datos)),
  eliminarMovimiento: (cuentaId, movimientoId) => escribir(() => servicio.eliminarMovimiento(cuentaId, movimientoId)),
}
