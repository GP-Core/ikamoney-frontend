import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router'
import { useConexion } from '../hooks/useConexion'
import { alertasService } from '../services/alertas'
import { conCopia } from '../services/offline'
import type { Alerta, ListaAlertas } from '../types/alerta'
import { mensajeError } from '../utils/errores'
import { AlertasContext } from './alertasContext'
import type { AlertasContextValue } from './alertasContext'

interface Estado {
  datos: ListaAlertas | null
  copiaDe: Date | null
  error: string | null
  /** Hubo al menos una respuesta (buena o mala). */
  listo: boolean
}

const contarSinLeer = (alertas: Alerta[]) => alertas.filter((a) => a.estado === 'activa' && !a.leida).length

/**
 * Guarda las alertas y el contador sin leer para toda la app con sesión (T48).
 * Vuelve a pedirlas al cambiar de pantalla y al volver a la pestaña: el backend recalcula las
 * alertas después de cada escritura, y los formularios navegan al guardar.
 */
export function AlertasProvider({ children }: { children: ReactNode }) {
  const enLinea = useConexion()
  const { pathname } = useLocation()
  const [estado, setEstado] = useState<Estado>({ datos: null, copiaDe: null, error: null, listo: false })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let activo = true
    conCopia('alertas', enLinea, () => alertasService.listar())
      .then(({ datos, copiaDe }) => activo && setEstado({ datos, copiaDe, error: null, listo: true }))
      // Con error se conservan los datos que ya había: la campana no debe desaparecer por un fallo suelto.
      .catch((error) => activo && setEstado((previo) => ({ ...previo, error: mensajeError(error), listo: true })))
    return () => {
      activo = false
    }
  }, [enLinea, pathname, version])

  useEffect(() => {
    const alVolver = () => {
      if (document.visibilityState === 'visible') setVersion((v) => v + 1)
    }
    document.addEventListener('visibilitychange', alVolver)
    return () => document.removeEventListener('visibilitychange', alVolver)
  }, [])

  const recargar = useCallback(() => setVersion((v) => v + 1), [])

  const marcarLeida = useCallback(async (id: number, leida: boolean) => {
    const actualizada = await alertasService.marcarLeida(id, leida)
    setEstado((previo) => {
      if (!previo.datos) return previo
      const alertas = previo.datos.alertas.map((a) => (a.id === id ? actualizada : a))
      return { ...previo, error: null, datos: { ...previo.datos, alertas, sin_leer: contarSinLeer(alertas) } }
    })
  }, [])

  const valor = useMemo<AlertasContextValue>(
    () => ({
      alertas: estado.datos?.alertas ?? null,
      sinLeer: estado.datos?.sin_leer ?? 0,
      cargando: !estado.listo,
      error: estado.error,
      copiaDe: estado.copiaDe,
      recargar,
      marcarLeida,
    }),
    [estado, recargar, marcarLeida],
  )

  return <AlertasContext.Provider value={valor}>{children}</AlertasContext.Provider>
}
