/** Formatea un monto como moneda, por ejemplo 15000 → "$ 15.000". */
export function formatMoney(amount: number, currency = 'COP', locale = 'es-CO'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}
