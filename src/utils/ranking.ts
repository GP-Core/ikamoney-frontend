import type { DeudaRanking } from '../types/ranking'
import { pesos } from './pesos'

/** Los cuatro estados del semáforo de T20. */
export type NivelSemaforo = 'sano' | 'precaucion' | 'riesgo' | 'critico'

export const ETIQUETA_SEMAFORO: Record<NivelSemaforo, string> = {
  sano: 'Sano',
  precaucion: 'Precaución',
  riesgo: 'Riesgo',
  critico: 'Crítico',
}

/**
 * Umbrales PROVISIONALES de qué tan cara es una deuda, según su tasa anual.
 * Ni T20 ni T26 los definen: confirmar con Ramón y, si el motor devuelve el nivel, usar el suyo.
 */
export const UMBRALES_TASA = { precaucion: 1, riesgo: 30, critico: 50 }

export function nivelDeTasa(tasaAnual: number): NivelSemaforo {
  if (tasaAnual >= UMBRALES_TASA.critico) return 'critico'
  if (tasaAnual >= UMBRALES_TASA.riesgo) return 'riesgo'
  if (tasaAnual >= UMBRALES_TASA.precaucion) return 'precaucion'
  return 'sano'
}

/** 5.8 → "5.8"; 60 → "60". */
function pct(valor: number): string {
  return String(Math.round(valor * 10) / 10)
}

/** "$1,160" (redondea a pesos enteros). */
function dinero(monto: number): string {
  return pesos(Math.round(monto))
}

/**
 * Explicación de la posición en lenguaje de dinero. Usa solo los números que manda el motor
 * y nunca fórmulas ni índices: "te cuesta $X al mes", no "costo real 0.87".
 */
export function explicarPosicion(d: DeudaRanking, total: number): string {
  const partes: string[] = []

  partes.push(
    d.interes_mensual > 0
      ? `Esta ${d.tipo === 'tarjeta' ? 'tarjeta' : 'deuda'} te cuesta ${dinero(d.interes_mensual)} al mes en intereses (con IVA), con una tasa de ${pct(d.tasa_anual)} % anual.`
      : `Esta deuda no te genera intereses este mes.`,
  )

  if (d.desempate) {
    const { criterio, contra, gana } = d.desempate
    const igual = `Tiene la misma tasa que ${contra}`
    if (criterio === 'utilizacion') {
      partes.push(
        gana
          ? `${igual}, pero va antes porque tienes usado una mayor parte de su límite.`
          : `${igual}, pero ${contra} va antes porque tiene usado una mayor parte de su límite.`,
      )
    } else {
      partes.push(
        gana
          ? `${igual} y la misma utilización, así que va antes por tener menos saldo: se liquida más rápido.`
          : `${igual} y la misma utilización, pero ${contra} va antes por tener menos saldo.`,
      )
    }
  } else if (d.posicion === 1) {
    partes.push(
      total > 1
        ? `Es la que más intereses genera por cada peso que debes, por eso es la primera.`
        : `Es tu única deuda con saldo.`,
    )
  } else {
    partes.push(`Cada peso que debes aquí te cuesta menos en intereses que en las deudas de arriba.`)
  }

  return partes.join(' ')
}

/** Acción concreta de la primera deuda. Nunca dice cuánto pagar si el motor no lo calculó. */
export function accionPrincipal(d: DeudaRanking): string {
  return `Destina todo lo que puedas extra a ${d.nombre}, además de su pago mínimo de ${dinero(d.pago_minimo)}. Es la que más dinero te quita cada mes.`
}

export { dinero }
