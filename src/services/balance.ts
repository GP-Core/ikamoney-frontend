import type { BalanceResponse } from '../types/balance'
import { apiFetch } from './api'
import { balanceEjemplo, leerEscenario } from './balanceEjemplo'

/**
 * Mientras no esté listo el endpoint de T33 se usan datos de ejemplo.
 * Para conectar con el backend: VITE_USAR_DATOS_EJEMPLO=false en el .env y reiniciar `npm run dev`.
 */
export const USANDO_EJEMPLO = import.meta.env.VITE_USAR_DATOS_EJEMPLO !== 'false'

/** Número de meses que se piden al backend contando el mes consultado (1 actual + 5 siguientes). */
const MESES = 6

/** Balance del mes y proyección de los meses siguientes. */
export async function obtenerBalance(mes: string): Promise<BalanceResponse> {
  if (USANDO_EJEMPLO) {
    const escenario = leerEscenario()
    await new Promise((resolver) => setTimeout(resolver, 350)) // simula la red
    if (escenario === 'error') throw new Error('No se pudo cargar el balance (escenario de prueba).')
    return balanceEjemplo(mes, escenario)
  }
  return apiFetch<BalanceResponse>(`/v1/balance?mes=${mes}&meses=${MESES}`)
}
