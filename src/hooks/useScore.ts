import { useEffect, useState } from 'react'
import { conCopia } from '../services/offline'
import { obtenerHistorialScore, obtenerScore } from '../services/score'
import type { HistorialScore, ScoreResponse } from '../types/score'
import { useConexion } from './useConexion'

export type EstadoScore = 'cargando' | 'ok' | 'error'

interface Resultado {
  /** Identifica la petición: el reintento y si había conexión. */
  clave: string
  data?: ScoreResponse
  /** Fecha y hora de la copia mostrada; null si son datos de ahora (T60). */
  copiaDe?: Date | null
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
  const enLinea = useConexion()
  // Al perder o recuperar la conexión se vuelve a consultar (datos de ahora o copia guardada).
  const clave = `${intento}#${enLinea}`

  useEffect(() => {
    // Evita aplicar una respuesta vieja si el componente se desmontó o se reintentó.
    let activo = true
    conCopia('score', enLinea, obtenerScore)
      .then(({ datos, copiaDe }) => activo && setResultado({ clave, data: datos, copiaDe }))
      .catch((error) => activo && setResultado({ clave, error: mensajeDeError(error) }))
    return () => {
      activo = false
    }
  }, [clave, enLinea])

  const actual = resultado?.clave === clave ? resultado : null
  const estado: EstadoScore = actual === null ? 'cargando' : actual.error ? 'error' : 'ok'

  return {
    estado,
    data: actual?.data ?? null,
    copiaDe: actual?.copiaDe ?? null,
    error: actual?.error ?? null,
    reintentar: () => setIntento((n) => n + 1),
  }
}

/** Historial mensual del score. Si falla, la sección se oculta: no bloquea la pantalla del score. */
export function useHistorialScore() {
  const [resultado, setResultado] = useState<{ intento: number; data?: HistorialScore; error?: true } | null>(null)
  const enLinea = useConexion()
  const clave = enLinea ? 1 : 0

  useEffect(() => {
    let activo = true
    obtenerHistorialScore()
      .then((data) => activo && setResultado({ intento: clave, data }))
      .catch(() => activo && setResultado({ intento: clave, error: true }))
    return () => {
      activo = false
    }
  }, [clave])

  const actual = resultado?.intento === clave ? resultado : null
  return {
    cargando: actual === null,
    error: actual?.error === true,
    puntos: actual?.data?.puntos ?? [],
  }
}
