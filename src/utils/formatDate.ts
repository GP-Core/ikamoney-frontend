/** Fecha de hoy en formato AAAA-MM-DD, en la zona horaria local. */
export function todayISO(): string {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

/** "2026-10-12" → "12 oct 2026". */
export function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
