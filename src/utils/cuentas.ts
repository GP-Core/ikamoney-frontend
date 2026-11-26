// Lógica de cuentas y saldos, sin React. Repite las reglas del backend (docs/SALDOS.md) solo para
// anticipar al usuario qué va a pasar; los saldos reales siempre los calcula el servidor.
import type { Cuenta, MovimientoCuenta, TipoMovimientoCuenta } from '../types/cuenta.ts'
import type { MovimientoDelMes } from '../types/movimiento.ts'

/** Las cuentas cuyo saldo es "tu dinero hoy" (igual que el backend). */
const TIPOS_DINERO_HOY = ['debito', 'ahorro', 'efectivo', 'monedero']

const centavos = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

export function esCredito(c: Pick<Cuenta, 'tipo'>): boolean {
  return c.tipo === 'credito'
}

export function saldoDe(c: Pick<Cuenta, 'tipo' | 'saldo_actual' | 'saldo_disponible'>): number {
  return (esCredito(c) ? c.saldo_actual : c.saldo_disponible) ?? 0
}

export function dineroDisponible(cuentas: Cuenta[]): number {
  return centavos(
    cuentas.filter((c) => c.activa && TIPOS_DINERO_HOY.includes(c.tipo)).reduce((s, c) => s + saldoDe(c), 0),
  )
}

export function deudaEnTarjetas(cuentas: Cuenta[]): number {
  return centavos(cuentas.filter((c) => c.activa && esCredito(c)).reduce((s, c) => s + saldoDe(c), 0))
}

/** "Tu dinero" y "Tarjetas de crédito", en el orden en que llegan. */
export function agruparCuentas(cuentas: Cuenta[]): { dinero: Cuenta[]; tarjetas: Cuenta[] } {
  return { dinero: cuentas.filter((c) => !esCredito(c)), tarjetas: cuentas.filter(esCredito) }
}

export function esEntrada(tipo: TipoMovimientoCuenta): boolean {
  return tipo === 'abono' || tipo === 'pago'
}

export function textoTipoMovimiento(tipo: TipoMovimientoCuenta, credito: boolean): string {
  const textos: Record<TipoMovimientoCuenta, string> = {
    abono: 'Entró dinero',
    cargo: credito ? 'Compra o cargo' : 'Salió dinero',
    pago: 'Pago a la tarjeta',
    interes: 'Intereses',
    comision: 'Comisión',
    mensualidad_msi: 'Mensualidad MSI',
  }
  return textos[tipo]
}

/** Cómo quedaría el saldo (en crédito, lo que se debe) tras un movimiento. */
export function saldoDespues(
  cuenta: Pick<Cuenta, 'tipo' | 'saldo_actual' | 'saldo_disponible'>,
  tipo: TipoMovimientoCuenta,
  monto: number,
): number {
  const saldo = saldoDe(cuenta)
  if (esCredito(cuenta)) {
    if (tipo === 'pago') return centavos(saldo - monto)
    return centavos(tipo === 'mensualidad_msi' ? saldo : saldo + monto)
  }
  return centavos(tipo === 'abono' ? saldo + monto : saldo - monto)
}

/** Movimientos agrupados por fecha, conservando el orden (más reciente primero). */
export function agruparPorDia(movimientos: MovimientoCuenta[]): { fecha: string; movimientos: MovimientoCuenta[] }[] {
  const grupos: { fecha: string; movimientos: MovimientoCuenta[] }[] = []
  for (const m of movimientos) {
    const ultimo = grupos[grupos.length - 1]
    if (ultimo?.fecha === m.fecha) ultimo.movimientos.push(m)
    else grupos.push({ fecha: m.fecha, movimientos: [m] })
  }
  return grupos
}

/** Qué pasará al guardar un gasto o ingreso con esa cuenta, en una frase. */
export function notaAlRegistrar(opciones: {
  cuenta: Cuenta | undefined
  monto: number
  esIngreso: boolean
  seRepite: boolean
  esFuturo: boolean
  formatear: (n: number) => string
}): string {
  const { cuenta, monto, esIngreso, seRepite, esFuturo, formatear } = opciones
  if (!cuenta) return 'Cuenta en tu Balance, pero no cambia ningún saldo.'
  if (esCredito(cuenta)) {
    return `Sube lo que debes en ${cuenta.nombre}. No cuenta como gasto del mes: sale cuando pagas la tarjeta.`
  }
  if (seRepite || esFuturo) {
    return `El saldo cambia cuando marques que ${esIngreso ? 'ya te cayó' : 'ya lo pagaste'}.`
  }
  if (!(monto > 0)) return `${esIngreso ? 'Subirá' : 'Bajará'} el saldo de ${cuenta.nombre}.`
  const queda = saldoDespues(cuenta, esIngreso ? 'abono' : 'cargo', monto)
  return `${cuenta.nombre} quedará en ${formatear(queda)}.`
}

/**
 * Falta marcarlo como pagado o recibido: lo recurrente, y lo único con cuenta que se registró con fecha
 * futura y ya llegó. `hoy` es AAAA-MM-DD.
 */
export function faltaMarcar(
  m: Pick<MovimientoDelMes, 'frecuencia' | 'pagado' | 'cuenta_id' | 'cuenta_tipo' | 'fecha_ocurrencia'>,
  hoy: string,
): boolean {
  if (m.pagado) return false
  if (m.frecuencia !== 'unico') return m.fecha_ocurrencia <= hoy
  return !!m.cuenta_id && m.cuenta_tipo !== 'credito' && m.fecha_ocurrencia <= hoy
}
