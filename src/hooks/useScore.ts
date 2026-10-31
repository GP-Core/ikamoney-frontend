import { useEffect, useState } from 'react'
import { obtenerScore } from '../services/score'
import type { ScoreResponse } from '../types/score'

export type EstadoScore = 'cargando' | 'ok' | 'error'

interface Resultado {
  intento: number
  data?: ScoreResponse
  error?: string
}

function mensajeDeError(error: unknown): string {
  // fetch lanza TypeError cuando no hay conexión (backend apagado o CORS).
  if (error instanceof TypeError) return 'No se pudo conectar con el servidor.'
  if (error instanceof Error) return error.message
  return 'Ocurrió un error inesperado.'
}

/** Carga el score del usuario. Al pulsar reintentar vuelve a pedirlo. */
export function useScore() {
  const [intento, setIntento] = useState(0)
  const [resultado, setResultado] = useState<Resultado | null>(null)

  useEffect(() => {
    // Evita aplicar una respuesta vieja si el componente se desmontó o se reintentó.
    let activo = true
    obtenerScore()
      .then((data) => activo && setResultado({ intento, data }))
      .catch((error) => activo && setResultado({ intento, error: mensajeDeError(error) }))
    return () => {
      activo = false
    }
  }, [intento])

  const actual = resultado?.intento === intento ? resultado : null
  const estado: EstadoScore = actual === null ? 'cargando' : actual.error ? 'error' : 'ok'

  return {
    estado,
    data: actual?.data ?? null,
    error: actual?.error ?? null,
    reintentar: () => setIntento((n) => n + 1),
  }
}
