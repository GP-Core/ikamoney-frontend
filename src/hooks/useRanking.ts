import { useEffect, useState } from 'react'
import { obtenerRanking } from '../services/ranking'
import type { RankingResponse } from '../types/ranking'

export type EstadoRanking = 'cargando' | 'ok' | 'error'

interface Resultado {
  intento: number
  data?: RankingResponse
  error?: string
}

function mensajeDeError(error: unknown): string {
  if (error instanceof TypeError) return 'No se pudo conectar con el servidor.'
  if (error instanceof Error) return error.message
  return 'Ocurrió un error inesperado.'
}

/** Carga el ranking de deudas. Al pulsar reintentar vuelve a pedirlo. */
export function useRanking() {
  const [intento, setIntento] = useState(0)
  const [resultado, setResultado] = useState<Resultado | null>(null)

  useEffect(() => {
    let activo = true
    obtenerRanking()
      .then((data) => activo && setResultado({ intento, data }))
      .catch((error) => activo && setResultado({ intento, error: mensajeDeError(error) }))
    return () => {
      activo = false
    }
  }, [intento])

  const actual = resultado?.intento === intento ? resultado : null
  const estado: EstadoRanking = actual === null ? 'cargando' : actual.error ? 'error' : 'ok'

  return {
    estado,
    data: actual?.data ?? null,
    error: actual?.error ?? null,
    reintentar: () => setIntento((n) => n + 1),
  }
}
