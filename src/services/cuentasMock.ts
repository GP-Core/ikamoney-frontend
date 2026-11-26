import type { Cuenta, ListaMovimientosCuenta, MovimientoCuenta, TipoMovimientoCuenta } from '../types/cuenta'
import { ApiError } from './api'
import { idUsuarioMock } from './authMock'
import type { CuentasService } from './cuentasApi'
import { saldoDespues } from '../utils/cuentas'

/**
 * SOLO PARA DESARROLLO Y DEMOSTRACIONES.
 *
 * Simula /api/v1/cuentas dentro del navegador con las reglas del backend (tipos permitidos por clase de
 * cuenta, fecha no futura, totales del mes). Las tarjetas de crédito de prueba viven en finanzasMock y no
 * aparecen aquí. Los datos se guardan por usuario en localStorage con el prefijo `ikamoney-mock:`.
 */

interface DatosMock {
  ultimoId: number
  ultimoMovimiento: number
  cuentas: Cuenta[]
  movimientos: MovimientoCuenta[]
}

const VACIO: DatosMock = { ultimoId: 0, ultimoMovimiento: 0, cuentas: [], movimientos: [] }

export const claveCuentasMock = (idUsuario: number) => `ikamoney-mock:cuentas:${idUsuario}`

function leer(): DatosMock {
  try {
    const valor = localStorage.getItem(claveCuentasMock(idUsuarioMock()))
    return valor ? (JSON.parse(valor) as DatosMock) : { ...VACIO, cuentas: [], movimientos: [] }
  } catch {
    return { ...VACIO, cuentas: [], movimientos: [] }
  }
}

const guardar = (datos: DatosMock) => localStorage.setItem(claveCuentasMock(idUsuarioMock()), JSON.stringify(datos))
const esperar = () => new Promise((resolve) => setTimeout(resolve, 200))
const redondear2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100
const hoyIso = () => {
  const h = new Date()
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`
}
const ENTRADAS: TipoMovimientoCuenta[] = ['abono', 'pago']

export const cuentasMock: CuentasService = {
  async listar() {
    await esperar()
    return leer().cuentas
  },

  async crear(payload) {
    await esperar()
    const datos = leer()
    const cuenta: Cuenta = {
      id: ++datos.ultimoId,
      tipo: payload.tipo,
      nombre: payload.nombre,
      banco: payload.banco ?? null,
      ultimos_4: payload.ultimos_4 ?? null,
      activa: true,
      saldo_disponible: payload.saldo_disponible ?? 0,
      limite_credito: null,
      saldo_actual: null,
    }
    datos.cuentas.push(cuenta)
    guardar(datos)
    return cuenta
  },

  async editar(id, cambios) {
    await esperar()
    const datos = leer()
    const cuenta = datos.cuentas.find((c) => c.id === id)
    if (!cuenta) throw new ApiError(404, 'La cuenta no existe.')
    Object.assign(cuenta, cambios)
    guardar(datos)
    return cuenta
  },

  async eliminar(id) {
    await esperar()
    const datos = leer()
    if (!datos.cuentas.some((c) => c.id === id)) throw new ApiError(404, 'La cuenta no existe.')
    datos.cuentas = datos.cuentas.filter((c) => c.id !== id)
    datos.movimientos = datos.movimientos.filter((m) => m.cuenta_id !== id)
    guardar(datos)
  },

  async listarMovimientos(cuentaId, mes) {
    await esperar()
    const datos = leer()
    if (!datos.cuentas.some((c) => c.id === cuentaId)) throw new ApiError(404, 'La cuenta no existe.')
    const delMes = datos.movimientos
      .filter((m) => m.cuenta_id === cuentaId && m.fecha.startsWith(mes))
      .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id)
    const suma = (filtro: (m: MovimientoCuenta) => boolean) =>
      redondear2(delMes.filter((m) => m.estado_revision !== 'descartado' && filtro(m)).reduce((t, m) => t + m.monto, 0))
    const entradas = suma((m) => ENTRADAS.includes(m.tipo))
    const salidas = suma((m) => !ENTRADAS.includes(m.tipo))
    const respuesta: ListaMovimientosCuenta = {
      cuenta_id: cuentaId,
      mes,
      totales: { entradas, salidas, neto: redondear2(entradas - salidas) },
      movimientos: delMes,
    }
    return respuesta
  },

  async crearMovimiento(cuentaId, payload) {
    await esperar()
    const datos = leer()
    const cuenta = datos.cuentas.find((c) => c.id === cuentaId)
    if (!cuenta) throw new ApiError(404, 'La cuenta no existe.')
    if (!['abono', 'cargo'].includes(payload.tipo)) {
      throw new ApiError(422, 'Esa cuenta solo admite abonos y cargos.')
    }
    if (payload.fecha > hoyIso()) throw new ApiError(422, 'La fecha del movimiento no puede ser futura.')
    const movimiento: MovimientoCuenta = {
      id: ++datos.ultimoMovimiento,
      cuenta_id: cuentaId,
      estado_cuenta_id: null,
      origen: 'manual',
      estado_revision: 'confirmado',
      ...payload,
      categoria_id: payload.categoria_id ?? null,
      plan_msi_id: null,
    }
    cuenta.saldo_disponible = saldoDespues(cuenta, movimiento.tipo, movimiento.monto)
    datos.movimientos.push(movimiento)
    guardar(datos)
    return movimiento
  },

  async editarMovimiento(cuentaId, movimientoId, payload) {
    await esperar()
    const datos = leer()
    const cuenta = datos.cuentas.find((c) => c.id === cuentaId)
    const movimiento = datos.movimientos.find((m) => m.id === movimientoId && m.cuenta_id === cuentaId)
    if (!cuenta || !movimiento) throw new ApiError(404, 'El movimiento no existe.')
    // Deshacer el anterior y aplicar el nuevo, como el servidor
    cuenta.saldo_disponible = saldoDespues(cuenta, movimiento.tipo, -movimiento.monto)
    Object.assign(movimiento, payload)
    cuenta.saldo_disponible = saldoDespues(cuenta, movimiento.tipo, movimiento.monto)
    guardar(datos)
    return movimiento
  },

  async eliminarMovimiento(cuentaId, movimientoId) {
    await esperar()
    const datos = leer()
    const cuenta = datos.cuentas.find((c) => c.id === cuentaId)
    const anterior = datos.movimientos.find((m) => m.id === movimientoId && m.cuenta_id === cuentaId)
    if (!cuenta || !anterior) throw new ApiError(404, 'El movimiento no existe.')
    cuenta.saldo_disponible = saldoDespues(cuenta, anterior.tipo, -anterior.monto)
    datos.movimientos = datos.movimientos.filter((m) => m.id !== movimientoId)
    guardar(datos)
  },
}
