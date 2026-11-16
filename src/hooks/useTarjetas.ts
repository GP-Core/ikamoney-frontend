import { useEffect, useState } from 'react'
import { obtenerTarjetas } from '../services/tarjetas'
import type { Tarjeta } from '../types/simulador'

export type EstadoTarjetas = 'cargando' | 'ok' | 'error'

interface Resultado {
  intento: number
  data?: Tarjeta[]
  error?: string
}

function mensajeDeError(error: unknown): string {
  if (error instanceof TypeError) return 'No se pudo conectar con el servidor.'
  if (error instanceof Error) return error.message
  return 'Ocurrió un error inesperado.'
}

/** Carga las tarjetas activas del usuario. */
export function useTarjetas() {
  const [intento, setIntento] = useState(0)
  const [resultado, setResultado] = useState<Resultado | null>(null)

  useEffect(() => {
    let activo = true
    obtenerTarjetas()
      .then((data) => activo && setResultado({ intento, data }))
      .catch((error) => activo && setResultado({ intento, error: mensajeDeError(error) }))
    return () => {
      activo = false
    }
  }, [intento])

  const actual = resultado?.intento === intento ? resultado : null
  const estado: EstadoTarjetas = actual === null ? 'cargando' : actual.error ? 'error' : 'ok'
  return {
    estado,
    tarjetas: actual?.data ?? [],
    error: actual?.error ?? null,
    reintentar: () => setIntento((n) => n + 1),
  }
}
