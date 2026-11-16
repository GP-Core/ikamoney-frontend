import type { PlanResponse } from '../types/plan.ts'
import { sumarMeses } from './formatMes.ts'

export interface AbonoDeuda {
  /** Lo que se abona el primer mes (mínimo + extra, si le toca). */
  inicial: number
  /** Lo más alto que llega a abonar en un mes (sube cuando se libera dinero de otras deudas). */
  maximo: number
  /** Parte del primer abono que va por encima del mínimo. */
  extraInicial: number
}

/** Cuánto abonar a cada deuda, leído del calendario del plan. La clave es la del ranking. */
export function abonosPorDeuda(plan: PlanResponse): Map<string, AbonoDeuda> {
  const abonos = new Map<string, AbonoDeuda>()
  for (const mes of plan.calendario) {
    for (const p of mes.pagos) {
      const actual = abonos.get(p.clave)
      if (!actual) {
        abonos.set(p.clave, { inicial: p.pago, maximo: p.pago, extraInicial: p.abono_extra })
      } else if (p.pago > actual.maximo) {
        actual.maximo = p.pago
      }
    }
  }
  return abonos
}

/** Meses de diferencia entre dos "AAAA-MM" (b − a). */
export function mesesEntre(a: string, b: string): number {
  const [aa, am] = a.split('-').map(Number)
  const [ba, bm] = b.split('-').map(Number)
  return (ba - aa) * 12 + (bm - am)
}

const ES_MES = /^\d{4}-(0[1-9]|1[0-2])$/

/** Copia el valor corriendo todo texto "AAAA-MM" `delta` meses. Lo usan los datos de ejemplo. */
export function desplazarMeses<T>(valor: T, delta: number): T {
  if (delta === 0) return valor
  if (typeof valor === 'string') return (ES_MES.test(valor) ? sumarMeses(valor, delta) : valor) as T
  if (Array.isArray(valor)) return valor.map((v) => desplazarMeses(v, delta)) as T
  if (valor !== null && typeof valor === 'object') {
    return Object.fromEntries(
      Object.entries(valor).map(([k, v]) => [k, desplazarMeses(v, delta)]),
    ) as T
  }
  return valor
}

/** Índice del plan de ejemplo más cercano al extra pedido (los ejemplos van de `paso` en `paso`). */
export function indiceDeEjemplo(extra: number, paso: number, total: number): number {
  return Math.min(Math.max(0, Math.round(extra / paso)), total - 1)
}
