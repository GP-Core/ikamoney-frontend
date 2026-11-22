// Lógica de la vista de Balance (T34, RF-36 y RF-40), sin React: horizonte y meses en negativo.
import type { MesBalance } from '../types/balance.ts'
import { mesNombre } from './formatMes.ts'

/** Cuántos meses se pueden ver en el balance (RF-40). */
export const HORIZONTES = [3, 6, 12] as const
export type Horizonte = (typeof HORIZONTES)[number]
/** RF-36 y US 6.4: la proyección se ve a 6 meses por defecto. */
export const HORIZONTE_DEFECTO: Horizonte = 6
/** Clave de localStorage; lleva el prefijo `ikamoney:`, así que se borra al cerrar sesión. */
export const CLAVE_HORIZONTE = 'ikamoney:horizonte-balance'

/** Lo guardado puede venir vacío o alterado: cualquier valor que no sea 3, 6 o 12 vuelve al de por defecto. */
export function leerHorizonte(guardado: string | null): Horizonte {
  const n = Number(guardado)
  return HORIZONTES.find((h) => h === n) ?? HORIZONTE_DEFECTO
}

/** Los primeros `horizonte` meses (el consultado cuenta como el primero). Acepta listas más cortas. */
export function recortarMeses<T>(meses: T[], horizonte: number): T[] {
  return meses.slice(0, Math.max(horizonte, 0))
}

/** Meses en los que el dinero no alcanza (libre menor a cero), en orden. */
export function mesesEnNegativo(meses: MesBalance[]): MesBalance[] {
  return meses.filter((m) => m.libre < 0)
}

/** "abril", "abril y mayo", "abril, mayo y junio". */
function listaDeMeses(nombres: string[]): string {
  if (nombres.length <= 1) return nombres.join('')
  return `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`
}

/** Frase que dice sin depender del color si algún mes se queda sin dinero. */
export function fraseDeMeses(meses: MesBalance[]): string {
  const negativos = mesesEnNegativo(meses)
  if (negativos.length === 0) return 'Todos tus meses cierran con dinero libre.'
  const nombres = negativos.map((m) => mesNombre(m.mes).toLowerCase())
  return `En ${negativos.length} de tus próximos ${meses.length} meses te faltaría dinero: ${listaDeMeses(nombres)}.`
}
