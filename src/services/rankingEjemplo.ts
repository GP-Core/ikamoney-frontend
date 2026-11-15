import type { PosicionRanking, RankingResponse } from '../types/ranking'

/**
 * Datos de ejemplo de la pantalla de ranking (T44), con la misma forma que GET /api/v1/priorizador.
 * Perfil de T25 / T26 (CP-11): Tarjeta A (60 %, $20,000) primero y Tarjeta B (45 %, $12,000) segunda.
 *
 * Se elige el escenario con ?demo= en la URL (junto a ?ranking):
 *   (nada)     → perfil de T26, dos tarjetas
 *   una        → una sola deuda
 *   sin_deudas → sin deudas: estado positivo
 *   error      → falla la carga
 */
export type EscenarioRanking = 'normal' | 'una' | 'sin_deudas' | 'error'

const tarjetaA: PosicionRanking = {
  posicion: 1, clave: 'tarjeta-1', tipo: 'tarjeta', id: 1, nombre: 'Tarjeta A',
  saldo: 20000, tasa_anual: 60, tasa_mensual: 5.8, costo_anual_compuesto: 96.71,
  interes_mes: 1160, utilizacion: 46.67, pago_minimo: 1460, ahorro_por_mil: 58,
  accion: 'abonar_extra',
  razon:
    'Es tu deuda más cara: liquídala primero. Con una tasa de 5.80 % al mes (96.7 % al año), este mes genera $1,160.00 de intereses. Cada $1,000 que le abones de más te ahorran $58.00 al mes.',
  comparacion: null,
  avisos: [],
}

const tarjetaB: PosicionRanking = {
  posicion: 2, clave: 'tarjeta-2', tipo: 'tarjeta', id: 2, nombre: 'Tarjeta B',
  saldo: 12000, tasa_anual: 45, tasa_mensual: 4.35, costo_anual_compuesto: 66.69,
  interes_mes: 522, utilizacion: 50, pago_minimo: 702, ahorro_por_mil: 43.5,
  accion: 'pagar_minimo',
  razon:
    'Va después de Tarjeta A porque su tasa es menor (4.35 % contra 5.80 % al mes): cada $1,000 abonados aquí ahorran $14.50 menos al mes que en Tarjeta A. Paga solo el mínimo ($702.00) hasta liquidar Tarjeta A. Este mes genera $522.00 de intereses.',
  comparacion: { contra: 'tarjeta-1', contra_nombre: 'Tarjeta A', criterio: 'tasa', ahorro_por_mil_menos: 14.5 },
  avisos: [],
}

const base = {
  periodo: '2026-03',
  supuestos: ['Es una estimación: supone que no haces compras nuevas con tus tarjetas y que las tasas de interés no cambian.'],
}

export function leerEscenarioRanking(): EscenarioRanking {
  const v = new URLSearchParams(window.location.search).get('demo')
  return v === 'una' || v === 'sin_deudas' || v === 'error' ? v : 'normal'
}

export function rankingEjemplo(escenario: Exclude<EscenarioRanking, 'error'>): RankingResponse {
  if (escenario === 'sin_deudas') {
    return {
      ...base, estado: 'sin_deudas', ranking: [], sin_ranking: [],
      resumen: 'No tienes deudas con intereses. ¡Sigue así!',
      intereses_mes_total: 0, pagos_minimos_total: 0, msi_mes_total: 0, bola_de_nieve: null,
    }
  }
  if (escenario === 'una') {
    return {
      ...base, estado: 'calculado', ranking: [tarjetaA], sin_ranking: [],
      resumen: 'Cubre el mínimo de tu tarjeta ($1,460.00 este mes). Todo el dinero extra que puedas, abónalo a Tarjeta A.',
      intereses_mes_total: 1160, pagos_minimos_total: 1460, msi_mes_total: 0, bola_de_nieve: null,
    }
  }
  return {
    ...base, estado: 'calculado',
    ranking: [tarjetaA, tarjetaB],
    sin_ranking: [
      {
        clave: 'msi-1', tipo: 'msi', id: 1, nombre: 'MSI 1', saldo: 8000, pago_mensual: 1000, motivo: 'MSI',
        mensaje: 'Es a meses sin intereses: no te cobra intereses si pagas la mensualidad a tiempo, así que no entra al orden (RN-19).',
      },
    ],
    resumen:
      'Primero cubre el mínimo de todas tus deudas ($2,162.00 en total este mes, más $2,000.00 de tus MSI). Todo el dinero extra que puedas, abónalo a Tarjeta A.',
    intereses_mes_total: 1682, pagos_minimos_total: 2162, msi_mes_total: 2000,
    bola_de_nieve: {
      coincide: false, mas_chica: 'tarjeta-2', mas_chica_nombre: 'Tarjeta B', diferencia_por_mil: 14.5,
      mensaje:
        'Mucha gente paga primero la deuda más chica (Tarjeta B), pero te sale más caro: cada $1,000 abonados a Tarjeta B en lugar de Tarjeta A dejan $14.50 más de intereses cada mes.',
    },
  }
}
