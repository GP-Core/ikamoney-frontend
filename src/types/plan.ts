// Respuesta de GET /api/v1/priorizador (T43 ranking + T45 plan). Son los campos que usa la pantalla
// del plan; el backend devuelve más (ver ikamoney-backend docs/PRIORIZADOR.md). Todos los montos
// llegan como número en pesos y los meses como "AAAA-MM".

export type CodigoAvisoPlan =
  | 'EXCEDENTE_NO_SOSTENIBLE'
  | 'SIN_DINERO_EXTRA'
  | 'BASE_NO_SE_LIQUIDA'
  | 'PLAN_NO_SE_LIQUIDA'
  | 'DEUDA_SIN_PAGO_MENSUAL'

export interface AvisoPlan {
  codigo: CodigoAvisoPlan
  mensaje: string
}

/** Una deuda del ranking (T43), de la que más conviene liquidar primero a la que menos. */
export interface PosicionRanking {
  posicion: number
  /** "tarjeta-<id>" o "deuda-<id>"; une el ranking con el plan. */
  clave: string
  tipo: 'tarjeta' | 'deuda'
  id: number
  nombre: string
  saldo: number
  /** En %, como la captura el usuario. */
  tasa_anual: number
  /** Por qué va en esa posición, en dinero. Texto listo para mostrar. */
  razon: string
}

/** Lo que no entra al orden (MSI, deudas sin tasa, etc.), con su motivo. */
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

/** Cómo termina cada deuda con el plan y con el escenario base. `null` = no se liquida. */
export interface DeudaPlan {
  clave: string
  nombre: string
  posicion: number
  meses_plan: number | null
  liquidacion_plan: string | null
  intereses_plan: number | null
  meses_base: number | null
  liquidacion_base: string | null
  intereses_base: number | null
}

export interface PagoMes {
  clave: string
  /** Mínimo + abono extra. */
  pago: number
  abono_extra: number
}

export interface MesPlan {
  /** 1 = el mes en curso. */
  mes: number
  periodo: string
  /** Solo las deudas que todavía tienen saldo. */
  pagos: PagoMes[]
}

export interface TotalPlan {
  meses_plan: number | null
  liquidacion_plan: string | null
  intereses_plan: number | null
  meses_base: number | null
  liquidacion_base: string | null
  intereses_base: number | null
  /** intereses_base − intereses_plan. null si alguno de los dos escenarios no liquida. */
  ahorro: number | null
  meses_menos: number | null
}

export interface PlanResponse {
  extra_mensual: number
  /** Lo que le sobra al usuario en su peor mes, en cientos. */
  extra_sugerido: number
  presupuesto_mensual: number
  escenario_base: 'solo_minimo'
  /** Contra qué se compara el ahorro. Hay que mostrarlo junto a la cifra. */
  escenario_base_texto: string
  /** En el orden del ranking. */
  deudas: DeudaPlan[]
  total: TotalPlan
  /** Mes a mes, hasta liquidar (máximo 120 meses). */
  calendario: MesPlan[]
  calendario_completo: boolean
  avisos: AvisoPlan[]
  /** Por qué es una estimación. Hay que mostrarlos. */
  supuestos: string[]
}

export interface PriorizadorResponse {
  estado: 'calculado' | 'sin_deudas'
  /** AAAA-MM */
  periodo: string
  ranking: PosicionRanking[]
  sin_ranking: SinRanking[]
  /** Qué hacer este mes. */
  resumen: string
  /** Mensualidades de MSI del mes: pagos fijos fuera del plan. */
  msi_mes_total: number
  /** null si no hay deudas con intereses (o ninguna tiene pago mensual). */
  plan: PlanResponse | null
}
