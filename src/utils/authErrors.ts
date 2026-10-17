import { ApiError } from '../services/api'

/** Convierte un error de las peticiones de cuenta en un mensaje claro para el usuario. */
export function mensajeErrorAuth(error: unknown, contexto: 'login' | 'registro' | 'recuperar' | 'restablecer'): string {
  if (error instanceof TypeError) {
    return 'No pudimos conectarnos con el servidor. Revisa tu conexión e inténtalo de nuevo.'
  }
  if (!(error instanceof ApiError)) return 'Ocurrió un error inesperado. Inténtalo de nuevo.'

  if (error.status === 429) {
    return 'Hiciste demasiados intentos. Espera 15 minutos e inténtalo de nuevo.'
  }
  if (contexto === 'login' && (error.status === 401 || error.status === 400)) {
    // Mensaje general: no indica si falló el correo o la contraseña (REQ-CU-04).
    return 'Correo o contraseña incorrectos.'
  }
  if (contexto === 'registro' && error.status === 409) {
    return 'Ya existe una cuenta con ese correo. Inicia sesión o recupera tu contraseña.'
  }
  if (contexto === 'restablecer' && (error.status === 400 || error.status === 410)) {
    return 'El enlace no es válido o ya expiró. Solicita uno nuevo.'
  }
  if (error.status >= 500) return 'El servidor tuvo un problema. Inténtalo de nuevo en unos minutos.'
  return error.message
}