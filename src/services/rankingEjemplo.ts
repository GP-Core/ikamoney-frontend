import type { DeudaRanking, RankingResponse } from '../types/ranking'

/**
 * Datos de ejemplo de la pantalla de ranking (T44), con la forma de GET /api/v1/priorizador.
 * Salen del perfil de ejemplo de la hoja de T26: tarjeta A (saldo 20,000 · tasa 60 % · límite 60,000)
 * y tarjeta B (saldo 12,000 · tasa 45 % · límite 30,000). CP-11: 1: A (5.80 %) · 2: B (4.35 %).
 * Pagos mínimos con la fórmula 6 (CP-02): A 1,460 y B 702. Intereses con IVA: A 1,160 y B 522.
 *
 * Se elige el escenario con ?demo= en la URL (junto a ?ranking):
 *   (nada)    → perfil de T26, dos tarjetas
 *   empate    → CE-08: dos tarjetas con la misma tasa; va primero la de mayor utilización
 *   una       → una sola deuda
 *   sin_deudas→ sin deudas: estado positivo
 *   error     → falla la carga
 */
export type EscenarioRanking = 'normal' | 'empate' | 'una' | 'sin_deudas' | 'error'

const tarjeta = (
  id: string,
  posicion: number,
  nombre: string,
  saldo: number,
  tasa: number,
  limite: number,
  pago_minimo: number,
  desempate: DeudaRanking['desempate'] = null,
): DeudaRanking => {
  const costo = Math.round((tasa / 12) * 1.16 * 100) / 100
  return {
    id,
    posicion,
    nombre,
    tipo: 'tarjeta',
    saldo,
    tasa_anual: tasa,
    costo_mensual_pct: costo,
    interes_mensual: Math.round(saldo * costo) / 100,
    limite,
    utilizacion: Math.round((saldo / limite) * 10000) / 100,
    pago_minimo,
    desempate,
  }
}

const total = (deudas: DeudaRanking[]): RankingResponse => ({
  tiene_deudas: deudas.length > 0,
  deudas,
  interes_total_mensual: Math.round(deudas.reduce((s, d) => s + d.interes_mensual, 0) * 100) / 100,
})

export function leerEscenarioRanking(): EscenarioRanking {
  const v = new URLSearchParams(window.location.search).get('demo')
  return v === 'empate' || v === 'una' || v === 'sin_deudas' || v === 'error' ? v : 'normal'
}

export function rankingEjemplo(escenario: Exclude<EscenarioRanking, 'error'>): RankingResponse {
  switch (escenario) {
    case 'sin_deudas':
      return total([])
    case 'una':
      return total([tarjeta('a', 1, 'Tarjeta A', 20000, 60, 60000, 1460)])
    case 'empate':
      return total([
        tarjeta('a', 1, 'Tarjeta A', 20000, 60, 60000, 1460, { criterio: 'utilizacion', contra: 'Tarjeta C', gana: true }),
        tarjeta('c', 2, 'Tarjeta C', 6000, 60, 60000, 750, { criterio: 'utilizacion', contra: 'Tarjeta A', gana: false }),
        tarjeta('b', 3, 'Tarjeta B', 12000, 45, 30000, 702),
      ])
    default:
      return total([
        tarjeta('a', 1, 'Tarjeta A', 20000, 60, 60000, 1460),
        tarjeta('b', 2, 'Tarjeta B', 12000, 45, 30000, 702),
      ])
  }
}
