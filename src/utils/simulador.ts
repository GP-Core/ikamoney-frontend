import type { Prioridad } from '../types/simulador'

/** Plazos MSI que se ofrecen como atajos (la tarjeta puede no aceptar todos: lo decide el backend). */
export const PLAZOS_MSI = [3, 6, 9, 12, 18, 24] as const

/** Máximo de escenarios por simulación (lo valida el backend con 422). */
export const MAX_ESCENARIOS = 6

/** Qué significa cada nivel; refleja RN-16 del motor: la prioridad decide qué tan estricto es el veredicto. */
export const PRIORIDADES: { valor: Prioridad; etiqueta: string; ayuda: string }[] = [
  { valor: 'alta', etiqueta: 'Alta', ayuda: 'Es una necesidad: se recomienda si tu dinero alcanza, aunque tu índice baje.' },
  { valor: 'media', etiqueta: 'Media', ayuda: 'Se recomienda si tu dinero alcanza y tu índice no cae a En riesgo o Crítico.' },
  { valor: 'baja', etiqueta: 'Baja', ayuda: 'Es un gusto: solo se recomienda si tu índice no baja de nivel.' },
]

/** Convierte lo escrito ("12,300.50") en número; NaN si no es un monto válido. */
export function leerPrecio(texto: string): number {
  const limpio = texto.replace(/[\s$,]/g, '')
  if (limpio === '') return NaN
  return /^\d*\.?\d+$|^\d+\.$/.test(limpio) ? Number(limpio) : NaN
}

export function nombreTarjeta(t: { nombre: string; ultimos_4: string | null }): string {
  return t.ultimos_4 ? `${t.nombre} ••${t.ultimos_4}` : t.nombre
}
