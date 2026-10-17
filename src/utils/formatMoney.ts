/** Formatea un monto en pesos mexicanos, por ejemplo 3838 → "$3,838.00" (RN-07, IU-06). */
export function formatMoney(amount: number, currency = 'MXN', locale = 'es-MX'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}