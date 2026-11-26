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
  /** Tiene su gasto o ingreso en Balance. */
  en_balance?: boolean
  /** Pago de tarjeta o préstamo: se elimina, no se edita. */
  es_pago?: boolean
  /** Solo al crear o editar. */
  saldo_cuenta?: number | null
  saldo_negativo?: boolean
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
  /** Obligatoria en un gasto de una cuenta con dinero. */
  categoria_id?: number
}

/** Cuerpo de PUT /api/v1/cuentas/{id}. */
export interface CuentaEdicion {
  nombre?: string
  saldo_disponible?: number
}

/** Cuerpo de POST /api/v1/tarjetas/{id}/pagos y /api/v1/deudas/{id}/pagos. */
export interface PagoPayload {
  monto: number
  fecha: string
  desde_cuenta_id: number
}

export interface PagoResultado {
  movimiento_id: number
  cuenta_id: number
  monto: number
  aplicado: number
  saldo_deuda: number
  saldo_origen: number
  saldo_negativo: boolean
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
