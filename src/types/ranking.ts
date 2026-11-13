// Contrato propuesto para GET /api/v1/priorizador (T44). El orden ya viene decidido por el motor
// (fórmula 9 de T26): el frontend NO reordena. Montos en pesos (MXN); tasas y porcentajes en % (60 = 60 %).

export type TipoDeuda = 'tarjeta' | 'otra'

/** Cómo se resolvió un empate de tasa con otra deuda (CE-08 de T26). */
export interface Desempate {
  /** Regla que decidió: primero la mayor utilización; si también empatan, el menor saldo. */
  criterio: 'utilizacion' | 'saldo'
  /** Nombre de la otra deuda con la misma tasa. */
  contra: string
  /** true: esta deuda quedó por delante de `contra`; false: quedó detrás. */
  gana: boolean
}

export interface DeudaRanking {
  id: string
  /** Posición que asignó el motor, empezando en 1. */
  posicion: number
  nombre: string
  tipo: TipoDeuda
  saldo: number
  /** Tasa anual en %. */
  tasa_anual: number
  /** Costo mensual de la tasa con IVA, en % (60 % anual → 5.80). Es el criterio de orden. */
  costo_mensual_pct: number
  /** Lo que el saldo te cuesta cada mes en intereses con IVA, en pesos (saldo × costo_mensual_pct / 100). */
  interes_mensual: number
  /** Límite de la tarjeta. null en deudas que no son tarjeta. */
  limite: number | null
  /** saldo / límite × 100. null si no hay límite. Puede pasar de 100. */
  utilizacion: number | null
  /** Pago mínimo del mes, en pesos. */
  pago_minimo: number
  desempate: Desempate | null
}

export interface RankingResponse {
  /** false si el usuario no tiene deudas con saldo: la pantalla muestra el estado positivo. */
  tiene_deudas: boolean
  /** Ya ordenadas por el motor, de la primera a la última. */
  deudas: DeudaRanking[]
  /** Suma de interes_mensual de todas las deudas, en pesos. */
  interes_total_mensual: number
}
