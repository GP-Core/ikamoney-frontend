// Reglas de validación de los formularios de cuenta (REQ-CU-01 a REQ-CU-03, IU-10).
// El backend vuelve a validar todo: estas reglas solo dan aviso inmediato al usuario.

export const CONTRASENA_MIN = 8
/** bcrypt solo usa los primeros 72 bytes; se limita a 64 caracteres para no rebasarlo. */
export const CONTRASENA_MAX = 64

const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export interface RequisitoContrasena {
  id: string
  texto: string
  cumple: boolean
}

/** Lista de requisitos de la contraseña con su estado, para mostrarlos mientras se escribe. */
export function requisitosContrasena(contrasena: string): RequisitoContrasena[] {
  return [
    { id: 'largo', texto: `Al menos ${CONTRASENA_MIN} caracteres`, cumple: contrasena.length >= CONTRASENA_MIN },
    { id: 'letra', texto: 'Al menos una letra', cumple: /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(contrasena) },
    { id: 'numero', texto: 'Al menos un número', cumple: /\d/.test(contrasena) },
  ]
}

export function validarNombre(nombre: string): string | null {
  const limpio = nombre.trim()
  if (!limpio) return 'Escribe tu nombre'
  if (limpio.length < 2) return 'El nombre debe tener al menos 2 letras'
  if (limpio.length > 100) return 'El nombre no puede tener más de 100 caracteres'
  return null
}

export function validarCorreo(correo: string): string | null {
  const limpio = correo.trim()
  if (!limpio) return 'Escribe tu correo electrónico'
  if (limpio.length > 255 || !PATRON_CORREO.test(limpio)) return 'Escribe un correo válido, por ejemplo nombre@correo.com'
  return null
}

/** Valida una contraseña nueva (registro y restablecer). */
export function validarContrasenaNueva(contrasena: string): string | null {
  if (!contrasena) return 'Escribe una contraseña'
  if (contrasena.length > CONTRASENA_MAX) return `La contraseña no puede tener más de ${CONTRASENA_MAX} caracteres`
  if (requisitosContrasena(contrasena).some((r) => !r.cumple)) {
    return `La contraseña debe tener al menos ${CONTRASENA_MIN} caracteres, con letras y números`
  }
  return null
}

export function validarConfirmacion(contrasena: string, confirmacion: string): string | null {
  if (!confirmacion) return 'Vuelve a escribir la contraseña'
  if (contrasena !== confirmacion) return 'Las contraseñas no coinciden'
  return null
}