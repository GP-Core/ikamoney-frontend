import { createContext } from 'react'
import type { Alerta } from '../types/alerta'

export interface AlertasContextValue {
  /** Alertas activas, en el orden en que las entrega el backend. null mientras carga por primera vez. */
  alertas: Alerta[] | null
  /** Activas sin leer: el número de la campana. 0 si todavía no hay datos. */
  sinLeer: number
  cargando: boolean
  error: string | null
  /** Fecha y hora de la copia mostrada; null si son datos de ahora (T60). */
  copiaDe: Date | null
  recargar: () => void
  /** Marca o desmarca una alerta. Lanza el error si no se pudo guardar; no cambia nada en ese caso. */
  marcarLeida: (id: number, leida: boolean) => Promise<void>
}

export const AlertasContext = createContext<AlertasContextValue | null>(null)
