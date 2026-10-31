import type { ClaveFactor, FactorScore, NivelScore, ScoreResponse } from '../types/score'

export type Efecto = 'suma' | 'resta' | 'omitido'
export type Tono = 'bien' | 'atencion' | 'riesgo'

/** Número con un decimal como máximo y sin ceros de más: 11.11 → "11.1", 30 → "30". */
export function numero(valor: number): string {
  return String(Math.round(valor * 10) / 10)
}

/**
 * Un factor "suma" cuando aporta más de lo que deja de sumar (subpuntaje de 50 o más)
 * y "resta" cuando deja de sumar más de lo que aporta. "omitido" es el que no aplica.
 */
export function efectoDe(f: FactorScore): Efecto {
  if (!f.disponible || f.subpuntaje === null) return 'omitido'
  return f.subpuntaje >= 50 ? 'suma' : 'resta'
}

/** Primero los factores de orden_mejora (los que más puntos pierden), luego el resto por aporte. */
export function ordenarFactores(factores: FactorScore[], ordenMejora: ClaveFactor[]): FactorScore[] {
  const posicion = (f: FactorScore) => {
    const i = ordenMejora.indexOf(f.clave)
    return i === -1 ? ordenMejora.length : i
  }
  return [...factores].sort((a, b) => {
    if (a.disponible !== b.disponible) return a.disponible ? -1 : 1
    return posicion(a) - posicion(b) || b.aporte - a.aporte
  })
}

/** Los cuatro niveles de T17 se agrupan en tres tonos visuales. */
export function tonoDelNivel(nivel: NivelScore | null): Tono {
  if (nivel === 'saludable') return 'bien'
  if (nivel === 'en_revision') return 'atencion'
  return 'riesgo'
}

/** Frase corta bajo el score. Informa, no juzga. */
export const FRASE_DEL_TONO: Record<Tono, string> = {
  bien: 'Tu panorama se ve sólido. Aquí está lo que más pesa en tu score.',
  atencion: 'Vas por buen camino. Hay un par de cosas que pueden subirlo.',
  riesgo: 'Este mes hay cosas que pesan en tu score. Aquí ves cuáles y qué puede ayudar.',
}

export const TEXTO_TOPE: Record<NonNullable<ScoreResponse['motivo_tope']>, string> = {
  flujo_negativo: 'Este mes tus gastos y compromisos superan tus ingresos, y en ese caso el score no puede pasar de 59.',
  pago_con_atraso: 'Tienes un pago con atraso, y en ese caso el score no puede pasar de 59.',
}

export const TEXTO_FALTANTE: Record<string, string> = {
  ingresos: 'Tus ingresos del mes',
  gastos: 'Tus gastos del mes',
}
