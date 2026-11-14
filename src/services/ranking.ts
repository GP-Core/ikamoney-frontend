import type { RankingResponse } from '../types/ranking'
import { apiFetch } from './api'
import { leerEscenarioRanking, rankingEjemplo } from './rankingEjemplo'

/**
 * true = datos de ejemplo de la hoja de T26 (sin backend); false = GET /api/v1/priorizador.
 * Se controla con VITE_RANKING_USAR_EJEMPLO. El jueves se pone en false para conectar.
 */
export const RANKING_USANDO_EJEMPLO = import.meta.env.VITE_RANKING_USAR_EJEMPLO !== 'false'

export async function obtenerRanking(): Promise<RankingResponse> {
  if (RANKING_USANDO_EJEMPLO) {
    const escenario = leerEscenarioRanking()
    await new Promise((resolver) => setTimeout(resolver, 350))
    if (escenario === 'error') throw new Error('No se pudo cargar tu ranking (escenario de prueba).')
    return rankingEjemplo(escenario)
  }
  // La respuesta del backend ya tiene la forma de RankingResponse: se muestra tal cual, sin reordenar.
  return apiFetch<RankingResponse>('/v1/priorizador')
}
