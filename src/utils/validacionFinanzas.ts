// Validación de los formularios de tarjetas, MSI y deudas (REQ-TD-09).
// Los campos llegan como texto; cada función devuelve el mensaje de error o null si está bien.

/** Convierte "12,500.50" o "$12500" en número. Devuelve null si está vacío y NaN si no es número. */
export function leerNumero(texto: string): number | null {
  const limpio = texto.replace(/[\s$,]/g, '')
  if (!limpio) return null
  return /^-?\d+(\.\d+)?$/.test(limpio) ? Number(limpio) : Number.NaN
}

interface OpcionesMonto {
  obligatorio?: boolean
  /** true si se acepta 0 (por ejemplo, un saldo ya pagado). */
  permitirCero?: boolean
}

export function validarMonto(texto: string, { obligatorio = true, permitirCero = false }: OpcionesMonto = {}): string | null {
  const valor = leerNumero(texto)
  if (valor === null) return obligatorio ? 'Escribe una cantidad' : null
  if (Number.isNaN(valor)) return 'Escribe solo números, por ejemplo 12500.50'
  if (valor < 0) return 'La cantidad no puede ser negativa'
  if (valor === 0 && !permitirCero) return 'La cantidad debe ser mayor a cero'
  if (!/^-?\d+(\.\d{1,2})?$/.test(texto.replace(/[\s$,]/g, ''))) return 'Usa máximo dos decimales'
  if (valor > 9_999_999_999.99) return 'La cantidad es demasiado grande'
  return null
}

export function validarEntero(texto: string, min: number, max: number, obligatorio = true): string | null {
  const valor = leerNumero(texto)
  if (valor === null) return obligatorio ? 'Escribe un número' : null
  if (Number.isNaN(valor) || !Number.isInteger(valor)) return 'Escribe un número entero'
  if (valor < min || valor > max) return `Debe estar entre ${min} y ${max}`
  return null
}

export function validarDia(texto: string, obligatorio = true): string | null {
  const error = validarEntero(texto, 1, 31, obligatorio)
  return error ? (leerNumero(texto) === null ? 'Escribe el día del mes' : 'Escribe un día del 1 al 31') : null
}

export function validarTasa(texto: string): string | null {
  const valor = leerNumero(texto.replace('%', ''))
  if (valor === null) return null
  if (Number.isNaN(valor)) return 'Escribe solo el número, por ejemplo 45.5'
  if (valor < 0 || valor > 999.99) return 'La tasa debe estar entre 0 y 999.99 %'
  return null
}

export function validarTexto(texto: string, max: number, mensajeVacio: string | null): string | null {
  const limpio = texto.trim()
  if (!limpio) return mensajeVacio
  if (limpio.length > max) return `Máximo ${max} caracteres`
  return null
}

export function validarUltimos4(texto: string): string | null {
  const limpio = texto.trim()
  if (!limpio) return null
  return /^\d{4}$/.test(limpio) ? null : 'Escribe solo los últimos 4 números de la tarjeta'
}

export function validarFecha(texto: string, max: string): string | null {
  if (!texto) return 'Elige la fecha'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return 'La fecha no es válida'
  if (texto > max) return 'La fecha no puede ser futura'
  return null
}

/** Número de un campo ya validado (los vacíos opcionales quedan en null). */
export function numeroONulo(texto: string): number | null {
  const valor = leerNumero(texto.replace('%', ''))
  return valor === null || Number.isNaN(valor) ? null : valor
}

/** Indica si un objeto de errores tiene al menos un error. */
export function hayErrores(errores: Record<string, string | null>): boolean {
  return Object.values(errores).some(Boolean)
}