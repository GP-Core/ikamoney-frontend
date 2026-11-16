// Tipos de los movimientos (ingresos y gastos) capturados por el usuario.

export type MovementType = 'ingreso' | 'gasto'
export type ExpenseKind = 'fijo' | 'variable'

export const EXPENSE_CATEGORIES = [
  'Vivienda',
  'Alimentos',
  'Transporte',
  'Servicios',
  'Salud',
  'Educación',
  'Entretenimiento',
  'Tarjetas y deudas',
  'Otros',
] as const

export interface Movement {
  id: string
  type: MovementType
  concept: string
  amount: number
  /** Fecha en formato AAAA-MM-DD. */
  date: string
  /** Solo en gastos; en ingresos es una cadena vacía. */
  category: string
  /** Solo en gastos; en ingresos es null. */
  kind: ExpenseKind | null
}

/** Valores del formulario tal como los escribe el usuario (todo texto). */
export interface MovementFormValues {
  concept: string
  amount: string
  date: string
  category: string
  kind: ExpenseKind | ''
}

export type MovementFormErrors = Partial<Record<keyof MovementFormValues, string>>
