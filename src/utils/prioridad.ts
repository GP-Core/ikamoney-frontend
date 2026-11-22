import type { Prioridad } from '../types/simulador.ts'

/** Orden del selector de prioridad, de izquierda a derecha. */
export const ORDEN_PRIORIDAD: Prioridad[] = ['alta', 'media', 'baja']

/**
 * Prioridad a la que se pasa con una tecla en el selector (patrón de grupo de radio):
 * flechas izquierda/arriba y derecha/abajo, con vuelta al llegar a un extremo; Inicio y Fin
 * van al primero y al último. Con cualquier otra tecla devuelve null (no se hace nada).
 */
export function prioridadVecina(actual: Prioridad, tecla: string): Prioridad | null {
  const n = ORDEN_PRIORIDAD.length
  const i = ORDEN_PRIORIDAD.indexOf(actual)
  if (tecla === 'ArrowRight' || tecla === 'ArrowDown') return ORDEN_PRIORIDAD[(i + 1) % n]
  if (tecla === 'ArrowLeft' || tecla === 'ArrowUp') return ORDEN_PRIORIDAD[(i - 1 + n) % n]
  if (tecla === 'Home') return ORDEN_PRIORIDAD[0]
  if (tecla === 'End') return ORDEN_PRIORIDAD[n - 1]
  return null
}
