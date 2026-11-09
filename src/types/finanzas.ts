// Tipos de tarjetas, compras a MSI y otras deudas (T30).
// Siguen el modelo de datos de T18 y deben coincidir con docs/contrato-api-finanzas.md.

export type EstatusMsi = 'activo' | 'liquidado' | 'cancelado'
export type Origen = 'manual' | 'extraido'

/** Compra a meses sin intereses ligada a una tarjeta (tabla plan_msi). */
export interface PlanMsi {
  id: number
  tarjeta_id: number
  descripcion: string
  monto_original: number
  num_mensualidades: number
  mensualidades_pagadas: number
  monto_mensualidad: number
  /** Fecha en formato AAAA-MM-DD. */
  fecha_compra: string
  estatus: EstatusMsi
  origen: Origen
}

/** POST /api/tarjetas/{id}/msi y PUT /api/msi/{id} */
export interface PlanMsiPayload {
  descripcion: string
  monto_original: number
  num_mensualidades: number
  mensualidades_pagadas: number
  monto_mensualidad: number
  fecha_compra: string
}

/** Tarjeta de crédito (tabla tarjeta) con sus compras a MSI. */
export interface Tarjeta {
  id: number
  /** Alias que le da el usuario, por ejemplo "BBVA Azul". */
  nombre: string
  banco: string
  /** Solo los últimos 4 dígitos. Nunca el número completo ni el CVV. */
  ultimos_4: string | null
  limite_credito: number
  /** Lo que se debe sin contar lo pendiente de las compras a MSI. */
  saldo_actual: number
  dia_corte: number
  dia_pago: number
  /** Porcentaje anual, por ejemplo 60 = 60 %. */
  tasa_anual: number | null
  /** Pago mínimo del estado de cuenta. Si es null, la app lo estima (fórmula 6 de T25). */
  pago_minimo: number | null
  activa: boolean
  planes_msi: PlanMsi[]
}

/** POST /api/tarjetas y PUT /api/tarjetas/{id} */
export type TarjetaPayload = Omit<Tarjeta, 'id' | 'activa' | 'planes_msi'>

export type TipoDeuda =
  | 'prestamo_personal'
  | 'credito_auto'
  | 'credito_hipotecario'
  | 'credito_tienda'
  | 'familiar_amigo'
  | 'otro'

/** Préstamos y deudas que no son tarjeta ni MSI (tabla deuda). */
export interface Deuda {
  id: number
  nombre: string
  acreedor: string | null
  tipo: TipoDeuda
  monto_original: number
  saldo_actual: number
  tasa_anual: number | null
  pago_mensual: number | null
  dia_pago: number | null
  pagos_restantes: number | null
  fecha_inicio: string | null
  estatus: 'activa' | 'liquidada'
}

/** POST /api/deudas y PUT /api/deudas/{id} */
export type DeudaPayload = Omit<Deuda, 'id' | 'estatus'>