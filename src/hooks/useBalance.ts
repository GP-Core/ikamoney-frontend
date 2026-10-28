import { useEffect, useState } from 'react'
import { obtenerBalance } from '../services/balance'
import type { BalanceResponse } from '../types/balance'

export type EstadoBalance = 'cargando' | 'ok' | 'error'

interface Resultado {
  clave: string
  data?: BalanceResponse
  error?: string
}

function mensajeDeError(error: unknown): string {
  // fetch lanza TypeError cuando no hay conexión (backend apagado o CORS).
  if (error instanceof TypeError) return 'No se pudo conectar con el servidor.'
  if (error instanceof Error) return error.message
  return 'Ocurrió un error inesperado.'
}

/** Carga el balance de un mes. Al cambiar de mes o pulsar reintentar vuelve a pedirlo. */
export function useBalance(mes: string) {
  const [intento, setIntento] = useState(0)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const clave = `${mes}#${intento}`

  useEffect(() => {
    // Evita aplicar una respuesta vieja si el usuario ya cambió de mes o el componente se desmontó.
    let activo = true
    obtenerBalance(mes)
      .then((data) => activo && setResultado({ clave, data }))
      .catch((error) => activo && setResultado({ clave, error: mensajeDeError(error) }))
    return () => {
      activo = false
    }
  }, [mes, clave])

  // Si lo guardado no corresponde a la petición actual, todavía se está cargando.
  const actual = resultado?.clave === clave ? resultado : null
  const estado: EstadoBalance = actual === null ? 'cargando' : actual.error ? 'error' : 'ok'

  return {
    estado,
    data: actual?.data ?? null,
    error: actual?.error ?? null,
    reintentar: () => setIntento((n) => n + 1),
  }
}
