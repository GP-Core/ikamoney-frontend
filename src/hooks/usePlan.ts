import { useEffect, useState } from 'react'
import { obtenerPlan, PLAN_USANDO_EJEMPLO } from '../services/plan'
import type { PriorizadorResponse } from '../types/plan'

export type EstadoPlan = 'cargando' | 'ok' | 'error'

/** Espera a que el usuario deje de mover el control antes de pedir el plan al servidor. */
const ESPERA_MS = PLAN_USANDO_EJEMPLO ? 0 : 250

interface Respuesta {
  extra: number
  intento: number
  error?: string
}

function mensajeDeError(error: unknown): string {
  // fetch lanza TypeError cuando no hay conexión (backend apagado o CORS).
  if (error instanceof TypeError) return 'No se pudo conectar con el servidor.'
  if (error instanceof Error) return error.message
  return 'Ocurrió un error inesperado.'
}

/**
 * Pide el plan para un abono extra. Conserva el último plan mientras llega el nuevo, para que la
 * pantalla no parpadee al mover el control, y cancela la petición anterior si el extra cambia.
 */
export function usePlan(extra: number) {
  const [intento, setIntento] = useState(0)
  const [datos, setDatos] = useState<PriorizadorResponse | null>(null)
  const [respuesta, setRespuesta] = useState<Respuesta | null>(null)

  useEffect(() => {
    const cancelar = new AbortController()
    const espera = setTimeout(() => {
      obtenerPlan(extra, cancelar.signal)
        .then((data) => {
          if (cancelar.signal.aborted) return
          setDatos(data)
          setRespuesta({ extra, intento })
        })
        .catch((error) => {
          if (cancelar.signal.aborted) return
          setRespuesta({ extra, intento, error: mensajeDeError(error) })
        })
    }, ESPERA_MS)
    return () => {
      clearTimeout(espera)
      cancelar.abort()
    }
  }, [extra, intento])

  const alDia = respuesta?.extra === extra && respuesta.intento === intento
  const fallo = alDia ? (respuesta.error ?? null) : null
  const estado: EstadoPlan = datos ? 'ok' : fallo ? 'error' : 'cargando'

  return {
    estado,
    data: datos,
    /** Error de la primera carga (pantalla completa). */
    error: datos ? null : fallo,
    /** Error al actualizar con otro extra: se avisa pero se conserva el último plan. */
    errorAlActualizar: datos ? fallo : null,
    /** true mientras llega la respuesta para el extra actual. */
    actualizando: datos !== null && !alDia,
    reintentar: () => setIntento((n) => n + 1),
  }
}
