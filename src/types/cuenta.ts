// Tipos de cuentas (débito, ahorro, efectivo…) y sus movimientos. Copian app/schemas/cuenta_financiera.py
// del backend, con los mismos nombres en snake_case. No confundir con la "cuenta" de usuario (/cuenta).

export type TipoCuenta = 'credito' | 'debito' | 'ahorro' | 'efectivo' | 'monedero' | 'otro'
/** Las de crédito se registran en /tarjetas; aquí solo se crean las demás. */
export type TipoCuentaNueva = Exclude<TipoCuenta, 'credito'>
export type TipoMovimientoCuenta = 'cargo' | 'pago' | 'interes' | 'comision' | 'mensualidad_msi' | 'abono'

export interface Cuenta {
  id: number
  tipo: TipoCuenta
  nombre: string
  banco: string | null
  ultimos_4: string | null
  activa: boolean
  /** Cuentas que no son de crédito. */
  saldo_disponible: number | null
  /** Solo tipo 'credito'. */
  limite_credito: number | null
  /** Solo tipo 'credito': lo que se debe. */
  saldo_actual: number | null
}

export interface CuentaPayload {
  tipo: TipoCuentaNueva
  nombre: string
  banco?: string
  ultimos_4?: string
  saldo_disponible?: number
}

export interface MovimientoCuenta {
  id: number
  cuenta_id: number
  estado_cuenta_id: number | null
  origen: 'extraido' | 'manual'
  estado_revision: 'pendiente' | 'confirmado' | 'corregido' | 'descartado'
  fecha: string
  descripcion: string
  monto: number
  tipo: TipoMovimientoCuenta
  categoria_id: number | null
  plan_msi_id: number | null
}

export interface TotalesCuenta {
  entradas: number
  salidas: number
  neto: number
}

/** Respuesta de GET /api/v1/cuentas/{id}/movimientos?mes=AAAA-MM */
export interface ListaMovimientosCuenta {
  cuenta_id: number
  mes: string | null
  totales: TotalesCuenta
  movimientos: MovimientoCuenta[]
}

/** Cuerpo de POST /api/v1/cuentas/{id}/movimientos. */
export interface MovimientoCuentaPayload {
  fecha: string
  descripcion: string
  monto: number
  tipo: TipoMovimientoCuenta
}

/** Qué tipos admite cada clase de cuenta (misma regla que el backend). */
export const TIPOS_DE_MOVIMIENTO: Record<'credito' | 'otras', { valor: TipoMovimientoCuenta; texto: string }[]> = {
  credito: [
    { valor: 'cargo', texto: 'Cargo' },
    { valor: 'pago', texto: 'Pago' },
    { valor: 'interes', texto: 'Interés' },
    { valor: 'comision', texto: 'Comisión' },
  ],
  otras: [
    { valor: 'abono', texto: 'Abono (entra dinero)' },
    { valor: 'cargo', texto: 'Cargo (sale dinero)' },
  ],
}

export const NOMBRES_TIPO_CUENTA: Record<TipoCuenta, string> = {
  credito: 'Crédito',
  debito: 'Débito',
  ahorro: 'Ahorro',
  efectivo: 'Efectivo',
  monedero: 'Monedero',
  otro: 'Otra',
}
