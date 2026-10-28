/** Utilidades para meses con formato "AAAA-MM". Todo en UTC para que no cambie con la zona horaria. */

function aFecha(mes: string): Date {
  const [anio, numero] = mes.split('-').map(Number)
  return new Date(Date.UTC(anio, numero - 1, 1))
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/** Mes de hoy según el reloj del dispositivo. */
export function mesActual(): string {
  const hoy = new Date()
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
}

/** Suma (o resta) meses: sumarMeses("2026-11", 2) → "2027-01". */
export function sumarMeses(mes: string, cantidad: number): string {
  const fecha = aFecha(mes)
  fecha.setUTCMonth(fecha.getUTCMonth() + cantidad)
  return `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, '0')}`
}

/** "2026-10" → "Octubre de 2026". */
export function mesLargo(mes: string): string {
  const texto = new Intl.DateTimeFormat('es-MX', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(aFecha(mes))
  return capitalizar(texto)
}

/** "2026-10" → "Octubre". */
export function mesNombre(mes: string): string {
  return capitalizar(
    new Intl.DateTimeFormat('es-MX', { month: 'long', timeZone: 'UTC' }).format(aFecha(mes)),
  )
}

/** "2026-10" → "oct". */
export function mesCorto(mes: string): string {
  return new Intl.DateTimeFormat('es-MX', { month: 'short', timeZone: 'UTC' })
    .format(aFecha(mes))
    .replace('.', '')
}

/** Monto abreviado para los ejes de la gráfica: 12500 → "$12.5k". */
export function pesosCompacto(monto: number): string {
  if (Math.abs(monto) < 1000) return `$${Math.round(monto)}`
  const miles = monto / 1000
  return `$${Number.isInteger(miles) ? miles : miles.toFixed(1)}k`
}
