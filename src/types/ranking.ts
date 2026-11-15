// Respuesta de GET /api/v1/priorizador (T43). El orden ya viene decidido por el motor (Fórmula 9):
// el frontend NO reordena. Montos en pesos (MXN); tasas y porcentajes en % (60 = 60 %).
// Se tipa solo lo que usa la pantalla de ranking (T44); la sección `plan` es de T46.

export type TipoDeuda = 'tarjeta' | 'deuda'
export type CriterioOrden = 'tasa' | 'utilizacion' | 'saldo' | 'empate'

export interface Aviso {
  codigo: 'LIMITE_CERO' | 'SOBRE_LIMITE' | 'SIN_PAGO_MENSUAL' | 'PAGO_NO_CUBRE_INTERES'
  mensaje: string
}

/** Contra la deuda de la posición anterior: por qué esta va después. */
export interface Comparacion {
  contra: string
  contra_nombre: string
  criterio: CriterioOrden
  ahorro_por_mil_menos: number
}

export interface PosicionRanking {
  /** 1 = la que conviene liquidar primero. */
  posicion: number
  /** "tarjeta-<id>" o "deuda-<id>". */
  clave: string
  tipo: TipoDeuda
  id: number
  nombre: string
  saldo: number
  /** Tasa anual en %, como la captura el usuario. */
  tasa_anual: number
  /** Tasa mensual en % (en tarjetas, con IVA). */
  tasa_mensual: number
  costo_anual_compuesto: number
  /** Intereses que genera este mes, en pesos. */
  interes_mes: number
  /** (saldo + MSI pendiente) ÷ límite, en %. null en deudas o con límite en cero. */
  utilizacion: number | null
  /** Tarjetas: pago mínimo. Deudas: su pago mensual. null si no se capturó. */
  pago_minimo: number | null
  /** Intereses que se dejan de pagar al mes por cada $1,000 abonados. */
  ahorro_por_mil: number
  /** Solo la posición 1 trae abonar_extra. */
  accion: 'abonar_extra' | 'pagar_minimo'
  /** Por qué va en esta posición, en dinero. Es el texto que se muestra tal cual. */
  razon: string
  /** null en la posición 1. */
  comparacion: Comparacion | null
  avisos: Aviso[]
}

/** Lo que no entra al orden, con el motivo. */
export interface SinRanking {
  clave: string
  tipo: 'tarjeta' | 'deuda' | 'msi'
  id: number
  nombre: string
  saldo: number
  pago_mensual: number | null
  motivo: 'MSI' | 'SIN_INTERESES' | 'SIN_SALDO' | 'SIN_TASA'
  mensaje: string
}

export interface BolaDeNieve {
  coincide: boolean
  mas_chica: string
  mas_chica_nombre: string
  diferencia_por_mil: number
  mensaje: string
}

export interface RankingResponse {
  /** "sin_deudas" si ninguna deuda cobra intereses: la pantalla muestra el estado positivo. */
  estado: 'calculado' | 'sin_deudas'
  /** AAAA-MM */
  periodo: string
  /** De la más cara a la más barata, ya ordenado por el motor. */
  ranking: PosicionRanking[]
  sin_ranking: SinRanking[]
  /** Qué hacer este mes. */
  resumen: string
  intereses_mes_total: number
  pagos_minimos_total: number
  msi_mes_total: number
  /** null con menos de dos deudas. */
  bola_de_nieve: BolaDeNieve | null
  supuestos: string[]
}
