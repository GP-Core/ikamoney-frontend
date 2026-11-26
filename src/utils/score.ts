import type { ClaveFactor, FactorScore, NivelScore, ScoreResponse } from '../types/score'

export type Tono = 'bien' | 'atencion' | 'riesgo'
export type Calificacion = 'bien' | 'mejorar' | 'baja' | 'supuesto' | 'omitido'

export const TEXTO_SUPUESTO_PAGO =
  'Faltan pagos por registrar del último periodo; por ahora suponemos que pagas solo el mínimo.'

export const ETIQUETA_CALIFICACION: Record<Calificacion, string> = {
  bien: 'Bien',
  mejorar: 'Puede mejorar',
  baja: 'Te baja',
  supuesto: 'Supuesto',
  omitido: 'No aplica',
}

/** Número con un decimal como máximo y sin ceros de más: 11.11 → "11.1", 30 → "30". */
export function numero(valor: number): string {
  return String(Math.round(valor * 10) / 10)
}

/** El backend dice si el comportamiento de pago se midió o se supuso (`comportamiento_supuesto`). */
function esSupuesto(f: FactorScore, pagoSupuesto: boolean): boolean {
  return f.clave === 'comportamiento_pago' && pagoSupuesto
}

/** Qué tan bien va un factor según su calificación de 0 a 100. */
export function calificacionDe(f: FactorScore, pagoSupuesto = true): Calificacion {
  if (!f.disponible || f.subpuntaje === null) return 'omitido'
  if (esSupuesto(f, pagoSupuesto)) return 'supuesto'
  if (f.subpuntaje >= 80) return 'bien'
  return f.subpuntaje >= 50 ? 'mejorar' : 'baja'
}

/** "3 bien · 1 puede mejorar · 1 supuesto". */
export function resumenFactores(factores: FactorScore[], pagoSupuesto = true): string {
  const grupos: [Calificacion, string][] = [
    ['bien', 'bien'],
    ['mejorar', 'puede mejorar'],
    ['baja', 'te baja'],
    ['supuesto', 'supuesto'],
  ]
  const calificaciones = factores.map((f) => calificacionDe(f, pagoSupuesto))
  return grupos
    .map(([clave, texto]) => [calificaciones.filter((c) => c === clave).length, texto] as const)
    .filter(([n]) => n > 0)
    .map(([n, texto]) => `${n} ${texto}`)
    .join(' · ')
}

/** Por puntos que se pueden ganar (orden_mejora); al final, lo que es supuesto y lo que no aplica. */
export function ordenarFactores(factores: FactorScore[], ordenMejora: ClaveFactor[], pagoSupuesto = true): FactorScore[] {
  const grupo = (f: FactorScore) => (!f.disponible ? 2 : esSupuesto(f, pagoSupuesto) ? 1 : 0)
  const posicion = (f: FactorScore) => {
    const i = ordenMejora.indexOf(f.clave)
    return i === -1 ? ordenMejora.length : i
  }
  return [...factores].sort((a, b) => grupo(a) - grupo(b) || posicion(a) - posicion(b) || b.aporte - a.aporte)
}

/** El factor con más puntos por ganar que sí se mide: un supuesto no puede ser la recomendación. */
export function factorPrioritario(
  factores: FactorScore[],
  ordenMejora: ClaveFactor[],
  pagoSupuesto = true,
): FactorScore | null {
  for (const clave of ordenMejora) {
    const factor = factores.find((f) => f.clave === clave)
    if (factor && factor.disponible && !esSupuesto(factor, pagoSupuesto)) return factor
  }
  return null
}

// Puntos de referencia de utilización en reglas_score.json: hasta 10 % vale 100; 30 % es lo recomendado.
const UTILIZACION_RECOMENDADA = 30
const UTILIZACION_IDEAL = 10

/** El consejo del motor, salvo cuando pide algo que el usuario ya cumple. */
export function consejoDe(f: FactorScore): string {
  if (f.clave === 'utilizacion_credito' && f.valor !== null && f.valor < UTILIZACION_RECOMENDADA) {
    return `Ya usas menos del ${UTILIZACION_RECOMENDADA} % de tu límite. Acercarlo al ${UTILIZACION_IDEAL} % te daría hasta ${numero(f.puntos_perdidos)} puntos más.`
  }
  return f.como_mejorar
}

/** Los cuatro niveles de T17 con el semáforo de T20. */
export function semaforoDelNivel(nivel: NivelScore | null): 'sano' | 'precaucion' | 'riesgo' | 'critico' {
  if (nivel === 'saludable') return 'sano'
  if (nivel === 'en_revision') return 'precaucion'
  return nivel === 'critico' ? 'critico' : 'riesgo'
}

/** Para la frase bajo el nivel bastan tres tonos. */
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

/**
 * Lo más alto que puede llegar el score mientras la forma de pago sea un supuesto: 100 menos los
 * puntos que deja de sumar ese factor. Se calcula con la respuesta para no escribir el número a mano.
 * null si ese factor no limita el score.
 */
export function maximoPosible(factores: FactorScore[]): number | null {
  const pago = factores.find((f) => f.clave === 'comportamiento_pago')
  if (!pago || !pago.disponible || pago.puntos_perdidos <= 0) return null
  return Math.round(100 - pago.puntos_perdidos)
}
