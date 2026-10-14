import { useEffect, useState } from 'react'
import { getHealth, pingDb } from '../services/health'

export type CheckState = 'cargando' | 'ok' | 'error'

export interface CheckResult {
  state: CheckState
  message: string
}

const LOADING: CheckResult = { state: 'cargando', message: 'Comprobando…' }

function errorMessage(error: unknown): string {
  // fetch lanza TypeError cuando no hay conexión (backend apagado o CORS).
  if (error instanceof TypeError) return 'No se pudo conectar con el backend'
  if (error instanceof Error) return error.message
  return 'Error desconocido'
}

/** Consulta /api/health y /api/ping-db al montar el componente. */
export function useBackendStatus() {
  const [api, setApi] = useState<CheckResult>(LOADING)
  const [db, setDb] = useState<CheckResult>(LOADING)

  useEffect(() => {
    // Evita actualizar el estado si el componente se desmontó antes de responder.
    let active = true

    getHealth()
      .then((data) => active && setApi({ state: 'ok', message: `Estado: ${data.status}` }))
      .catch((error) => active && setApi({ state: 'error', message: errorMessage(error) }))

    pingDb()
      .then((data) => active && setDb({ state: 'ok', message: data.message }))
      .catch((error) => active && setDb({ state: 'error', message: errorMessage(error) }))

    return () => {
      active = false
    }
  }, [])

  return { api, db }
}
