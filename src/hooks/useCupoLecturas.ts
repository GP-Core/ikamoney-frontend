import { useEffect, useState } from 'react'
import { MODO_PRUEBA } from '../services/auth'
import { obtenerCupo } from '../services/estadosCuenta'
import type { CupoExtraccion } from '../types/estadoCuenta'

/**
 * Lecturas con IA gratis (H-04). null mientras no se conoce: cargando, sin red o en modo de prueba,
 * donde no hay backend y pedirlo con el token falso cerraría la sesión.
 */
export function useCupoLecturas() {
  const [cupo, setCupo] = useState<CupoExtraccion | null>(null)

  useEffect(() => {
    if (MODO_PRUEBA) return
    let activo = true
    obtenerCupo()
      .then((c) => activo && setCupo(c))
      .catch(() => {})
    return () => {
      activo = false
    }
  }, [])

  return [cupo, setCupo] as const
}
