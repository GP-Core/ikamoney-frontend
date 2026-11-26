import type { PagoPayload, PagoResultado } from '../types/cuenta'
import { apiFetch, ApiError } from './api'
import { MODO_PRUEBA } from './auth'
import { escribir } from './escribir'

/** Pagar una tarjeta o un préstamo desde una cuenta con dinero. No es un gasto: baja los dos saldos. */
export function pagar(destino: 'tarjeta' | 'deuda', id: number, datos: PagoPayload): Promise<PagoResultado> {
  return escribir(async () => {
    if (MODO_PRUEBA) throw new ApiError(422, 'Los pagos no están disponibles en el modo de prueba.')
    const recurso = destino === 'tarjeta' ? 'tarjetas' : 'deudas'
    return apiFetch<PagoResultado>(`/v1/${recurso}/${id}/pagos`, { method: 'POST', body: JSON.stringify(datos) })
  })
}
