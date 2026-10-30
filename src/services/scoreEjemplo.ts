import type { FactorScore, ScoreResponse } from '../types/score'

/**
 * Datos simulados de la pantalla de score (T37), tomados de la hoja de T26.
 * Se elige el escenario con ?demo= en la URL (junto a ?score):
 *   (nada)         → CP-08 y CP-09: score 78, Atención
 *   riesgo         → CE-05: score calculado 84.5, pero el flujo negativo lo limita a 59
 *   sin_ingresos   → CE-03: no hay ingreso, se pide capturarlo
 *   sin_tarjetas   → CE-04: sin tarjetas se omite la utilización y el score es 90
 *   error          → falla la carga
 *
 * Qué viene de la hoja y qué es provisional:
 *   - De la hoja: DTI 35 %, flujo −10 %, carga MSI 17.5 %, utilización 47.78 % y sus
 *     subpuntajes 75, 20, 50 y 44.44; los scores 78, 59, 84.5 y 90; los datos de CE-03 a CE-05.
 *   - Provisional: los pesos con los que se calculan los puntos (DTI .30, flujo .25, MSI .10,
 *     utilización .25, pago .10; salen de CE-04 y CE-05), el factor "pago", los subpuntajes de
 *     los escenarios riesgo y sin_tarjetas, las sugerencias y el nombre del nivel "Saludable".
 *     Se reemplazan cuando GET /score devuelva los valores reales.
 *
 * Los puntos de cada factor se calculan como peso × (subpuntaje − 50): 50 es el punto neutro.
 */
export type EscenarioScore = 'normal' | 'riesgo' | 'sin_ingresos' | 'sin_tarjetas' | 'error'

const PESOS = { dti: 0.3, flujo: 0.25, msi: 0.1, utilizacion: 0.25, pago: 0.1 }

function puntos(clave: keyof typeof PESOS, subpuntaje: number): number {
  return Math.round(PESOS[clave] * (subpuntaje - 50) * 100) / 100
}

const SUGERENCIA_FLUJO =
  'Revisar un gasto variable o pasar una compra grande a MSI puede devolver tu flujo a positivo.'
const SUGERENCIA_UTILIZACION = 'Un pago extra a la tarjeta con más saldo reduce el porcentaje que usas de tu límite.'

const PAGO: FactorScore = {
  clave: 'pago',
  subpuntaje: 100,
  puntos: puntos('pago', 100),
  explicacion: 'Pagas más del mínimo en tus tarjetas, y eso cuenta a tu favor.',
}

export function leerEscenarioScore(): EscenarioScore {
  const valor = new URLSearchParams(window.location.search).get('demo')
  return valor === 'riesgo' || valor === 'sin_ingresos' || valor === 'sin_tarjetas' || valor === 'error'
    ? valor
    : 'normal'
}

export function scoreEjemplo(escenario: EscenarioScore): ScoreResponse {
  if (escenario === 'sin_ingresos') {
    return {
      estado: 'datos_faltantes',
      score: null,
      nivel: null,
      factores: [],
      faltantes: [
        {
          clave: 'ingreso',
          texto: 'Tu ingreso mensual',
          detalle: 'Con él calculamos cuánto de tu ingreso va a deudas, cuánto te queda libre y cuánto pesan tus MSI.',
        },
      ],
      avisos: [],
    }
  }

  if (escenario === 'riesgo') {
    // CE-05: DTI 20 %, utilización 5 %, flujo −1 %, MSI 0 %, pago total.
    return {
      estado: 'completo',
      score: 59,
      nivel: 'Riesgo',
      tope_aplicado: true,
      score_calculado: 84.5,
      motivo_tope: 'Cuando el flujo del mes es negativo, tu score no puede pasar de 59, aunque lo demás esté muy bien.',
      factores: [
        { clave: 'dti', valor: 20, subpuntaje: 100, puntos: puntos('dti', 100) },
        { clave: 'flujo', valor: -1, subpuntaje: 38, puntos: puntos('flujo', 38), sugerencia: SUGERENCIA_FLUJO },
        { clave: 'msi', valor: 0, subpuntaje: 100, puntos: puntos('msi', 100) },
        { clave: 'utilizacion', valor: 5, subpuntaje: 100, puntos: puntos('utilizacion', 100) },
        PAGO,
      ],
      sugerencia: SUGERENCIA_FLUJO,
      faltantes: [],
      avisos: [],
    }
  }

  if (escenario === 'sin_tarjetas') {
    // CE-04: DTI 15 %, flujo 10 %, MSI 0 %, pago total; sin tarjetas no hay utilización.
    return {
      estado: 'completo',
      score: 90,
      nivel: 'Saludable',
      factores: [
        { clave: 'dti', valor: 15, subpuntaje: 100, puntos: puntos('dti', 100) },
        { clave: 'flujo', valor: 10, subpuntaje: 70, puntos: puntos('flujo', 70) },
        { clave: 'msi', valor: 0, subpuntaje: 100, puntos: puntos('msi', 100) },
        { ...PAGO, explicacion: 'No tienes pagos pendientes en tarjetas, y eso cuenta a tu favor.' },
      ],
      sugerencia: null,
      faltantes: [],
      avisos: ['No tienes tarjetas registradas, así que no se evalúa el uso de tu límite de crédito.'],
    }
  }

  // CP-08 y CP-09: perfil de ejemplo.
  return {
    estado: 'completo',
    score: 78,
    nivel: 'Atención',
    factores: [
      { clave: 'dti', valor: 35, subpuntaje: 75, puntos: puntos('dti', 75) },
      { clave: 'flujo', valor: -10, subpuntaje: 20, puntos: puntos('flujo', 20), sugerencia: SUGERENCIA_FLUJO },
      { clave: 'msi', valor: 17.5, subpuntaje: 50, puntos: puntos('msi', 50) },
      {
        clave: 'utilizacion',
        valor: 47.78,
        subpuntaje: 44.44,
        puntos: puntos('utilizacion', 44.44),
        sugerencia: SUGERENCIA_UTILIZACION,
      },
      PAGO,
    ],
    sugerencia: SUGERENCIA_FLUJO,
    faltantes: [],
    avisos: [],
  }
}
