// Tipos de ingresos y gastos (T27, T28). Copian app/schemas/movimiento.py y categoria.py del backend,
// con los mismos nombres en snake_case: si cambian allá, se actualizan aquí.

export type TipoMovimiento = 'ingreso' | 'gasto'
/** Un gasto fijo se repite; uno variable es siempre único (regla del backend). */
export type ClaseGasto = 'fijo' | 'variable'
export type Frecuencia = 'unico' | 'semanal' | 'quincenal' | 'mensual' | 'anual'

export interface Categoria {
  id: number
  nombre: string
  /** true = categoría base del sistema; false = creada por el usuario. */
  base: boolean
}

export interface Movimiento {
  /** Con prefijo del tipo: "ingreso-5", "gasto-12". */
  id: string
  tipo: TipoMovimiento
  concepto: string
  monto: number
  frecuencia: Frecuencia
  /** Fecha de inicio (AAAA-MM-DD). En un movimiento único es la fecha del movimiento. */
  fecha: string
  fecha_fin: string | null
  activo: boolean
  categoria_id: number | null
  categoria: string | null
  clase: ClaseGasto | null
}

/** Un movimiento tal como cae en el mes consultado: los recurrentes salen una vez por ocurrencia. */
export interface MovimientoDelMes extends Movimiento {
  fecha_ocurrencia: string
}

export interface Totales {
  ingresos: number
  gastos: number
  gastos_fijos: number
  gastos_variables: number
  /** Ingresos menos gastos del mes: lo que le queda al usuario. */
  balance: number
}

/** Respuesta de GET /api/v1/movimientos?mes=AAAA-MM */
export interface ListaMes {
  mes: string
  totales: Totales
  movimientos: MovimientoDelMes[]
}

/** Cuerpo de POST /api/v1/movimientos. En un gasto, categoria_id y clase son obligatorios. */
export interface MovimientoPayload {
  tipo: TipoMovimiento
  concepto: string
  monto: number
  frecuencia: Frecuencia
  fecha: string
  categoria_id?: number
  clase?: ClaseGasto
}

/** Cuerpo de PUT /api/v1/movimientos/{id}: el tipo no se puede cambiar. */
export type MovimientoEdicion = Omit<MovimientoPayload, 'tipo'>

/** Valores del formulario tal como los escribe el usuario (todo texto). */
export interface ValoresMovimiento {
  concepto: string
  monto: string
  fecha: string
  categoria_id: string
  clase: ClaseGasto | ''
  frecuencia: Frecuencia
}

export type ErroresMovimiento = Partial<Record<keyof ValoresMovimiento, string>>
