import type { HistorialScore, ScoreResponse } from '../types/score'
import { apiFetch } from './api'
import { historialEjemplo, leerEscenarioScore, scoreEjemplo } from './scoreEjemplo'

/**
 * true = datos de ejemplo (sin backend); false = GET /api/v1/score (T35).
 * Se controla con VITE_SCORE_USAR_EJEMPLO, aparte de la del balance.
 */
export const SCORE_USANDO_EJEMPLO = import.meta.env.VITE_SCORE_USAR_EJEMPLO !== 'false'

export async function obtenerScore(): Promise<ScoreResponse> {
  if (SCORE_USANDO_EJEMPLO) {
    const escenario = leerEscenarioScore()
    await new Promise((resolver) => setTimeout(resolver, 350))
    if (escenario === 'error') throw new Error('No se pudo cargar tu score (escenario de prueba).')
    return scoreEjemplo(escenario)
  }

  // La respuesta del backend ya tiene la forma de ScoreResponse: no hace falta adaptarla.
  return apiFetch<ScoreResponse>('/v1/score')
}

/** Último score de cada uno de los últimos `meses` meses (GET /api/v1/score/historial). */
export async function obtenerHistorialScore(meses = 12): Promise<HistorialScore> {
  if (SCORE_USANDO_EJEMPLO) {
    await new Promise((resolver) => setTimeout(resolver, 350))
    return historialEjemplo()
  }
  return apiFetch<HistorialScore>(`/v1/score/historial?meses=${meses}`)
}
