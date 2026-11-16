import type { PriorizadorResponse } from '../types/plan'
import { apiFetch } from './api'
import { PASO_EJEMPLO, planEjemplo } from './planEjemplo'

/**
 * true = datos de ejemplo (sin backend); false = GET /api/v1/priorizador (T43 + T45).
 * Se controla con VITE_PLAN_USAR_EJEMPLO, aparte de las demás pantallas.
 */
export const PLAN_USANDO_EJEMPLO = import.meta.env.VITE_PLAN_USAR_EJEMPLO !== 'false'

/** De cuánto en cuánto se mueve el abono extra. */
export const PASO_EXTRA = PLAN_USANDO_EJEMPLO ? PASO_EJEMPLO : 100

/**
 * Ranking y plan de pagos con `extraMensual` de abono extra. El cálculo es del backend: la
 * respuesta ya tiene la forma de PriorizadorResponse y no hace falta adaptarla.
 */
export async function obtenerPlan(extraMensual: number, signal?: AbortSignal): Promise<PriorizadorResponse> {
  if (PLAN_USANDO_EJEMPLO) return planEjemplo(extraMensual)
  return apiFetch<PriorizadorResponse>(`/v1/priorizador?extra_mensual=${extraMensual}`, { signal })
}
