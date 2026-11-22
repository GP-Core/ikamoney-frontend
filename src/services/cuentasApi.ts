import type {
  Cuenta,
  CuentaPayload,
  ListaMovimientosCuenta,
  MovimientoCuenta,
  MovimientoCuentaPayload,
} from '../types/cuenta'
import { apiFetch } from './api'

/**
 * Cuentas (débito, ahorro, efectivo…) y sus movimientos. La implementación real habla con el backend;
 * la de prueba (cuentasMock.ts) simula el mismo contrato en el navegador.
 */
export interface CuentasService {
  /** Todas las cuentas, incluidas las tarjetas de crédito. */
  listar(): Promise<Cuenta[]>
  crear(datos: CuentaPayload): Promise<Cuenta>
  eliminar(id: number): Promise<void>
  /** Movimientos de la cuenta en un mes (AAAA-MM), con totales. */
  listarMovimientos(cuentaId: number, mes: string): Promise<ListaMovimientosCuenta>
  crearMovimiento(cuentaId: number, datos: MovimientoCuentaPayload): Promise<MovimientoCuenta>
  eliminarMovimiento(cuentaId: number, movimientoId: number): Promise<void>
}

const post = (datos: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(datos) })

/** Implementación real sobre /api/v1/cuentas. */
export const cuentasApi: CuentasService = {
  listar: () => apiFetch<Cuenta[]>('/v1/cuentas'),
  crear: (datos) => apiFetch<Cuenta>('/v1/cuentas', post(datos)),
  eliminar: async (id) => {
    await apiFetch<unknown>(`/v1/cuentas/${id}`, { method: 'DELETE' })
  },
  listarMovimientos: (cuentaId, mes) =>
    apiFetch<ListaMovimientosCuenta>(`/v1/cuentas/${cuentaId}/movimientos?mes=${encodeURIComponent(mes)}`),
  crearMovimiento: (cuentaId, datos) => apiFetch<MovimientoCuenta>(`/v1/cuentas/${cuentaId}/movimientos`, post(datos)),
  eliminarMovimiento: async (cuentaId, movimientoId) => {
    await apiFetch<unknown>(`/v1/cuentas/${cuentaId}/movimientos/${movimientoId}`, { method: 'DELETE' })
  },
}
