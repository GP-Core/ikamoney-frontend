import type { ScoreResponse } from '../types/score'
import { apiFetch } from './api'
import { leerEscenarioScore, scoreEjemplo } from './scoreEjemplo'

/**
 * true = datos simulados de la hoja de T26; false = GET /api/v1/score.
 * Se controla con VITE_SCORE_USAR_EJEMPLO, aparte de la del balance, para poder
 * conectar una pantalla sin tocar la otra.
 */
export const SCORE_USANDO_EJEMPLO = import.meta.env.VITE_SCORE_USAR_EJEMPLO !== 'false'

export async function obtenerScore(): Promise<ScoreResponse> {
  if (SCORE_USANDO_EJEMPLO) {
    const escenario = leerEscenarioScore()
    await new Promise((resolver) => setTimeout(resolver, 350))
    if (escenario === 'error') throw new Error('No se pudo cargar tu score (escenario de prueba).')
    return scoreEjemplo(escenario)
  }

  // Cuando exista el endpoint, aquí se adapta su respuesta a ScoreResponse si la forma es distinta.
  return apiFetch<ScoreResponse>('/v1/score')
}
