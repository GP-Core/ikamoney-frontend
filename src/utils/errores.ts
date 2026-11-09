import { ApiError } from '../services/api'

/** Convierte un error al cargar o guardar datos en un mensaje claro para el usuario. */
export function mensajeError(error: unknown): string {
  if (error instanceof TypeError) {
    return 'No pudimos conectarnos con el servidor. Revisa tu conexión e inténtalo de nuevo.'
  }
  if (!(error instanceof ApiError)) return 'Ocurrió un error inesperado. Inténtalo de nuevo.'
  if (error.status === 401) return 'Tu sesión expiró. Vuelve a iniciar sesión.'
  if (error.status === 404) return 'No encontramos esa información. Puede que ya se haya eliminado.'
  if (error.status >= 500) return 'El servidor tuvo un problema. Inténtalo de nuevo en unos minutos.'
  return error.message
}