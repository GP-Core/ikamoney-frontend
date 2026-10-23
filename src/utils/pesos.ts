import { formatMoney } from './formatMoney'

/** Monto en pesos mexicanos, por ejemplo 12300 → "$12,300". */
export function pesos(monto: number): string {
  return formatMoney(monto, 'MXN', 'es-MX')
}
