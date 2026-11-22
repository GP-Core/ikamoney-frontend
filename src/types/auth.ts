// Tipos de la autenticación (T51). Deben coincidir con docs/contrato-api-auth.md.

export interface Usuario {
  id: number
  nombre: string
  correo: string
  moneda: string
}

/** POST /api/auth/registro */
export interface RegistroPayload {
  nombre: string
  correo: string
  contrasena: string
  acepta_terminos: boolean
}

/** POST /api/auth/login */
export interface LoginPayload {
  correo: string
  contrasena: string
}

/** GET /api/auth/me: el usuario y, con el backend real, cuántos segundos le quedan a la sesión. */
export interface UsuarioConSesion extends Usuario {
  expira_en?: number
}

/**
 * Respuesta de registro y login. Con el backend real el token va en una cookie HttpOnly y no viene en el
 * cuerpo; solo el modo de prueba o un backend en transición (TOKEN_EN_RESPUESTA=true) lo incluyen.
 */
export interface SesionResponse {
  access_token?: string
  token_type?: 'bearer'
  /** Segundos que dura la sesión antes de expirar. */
  expira_en: number
  usuario: Usuario
}

/** POST /api/auth/recuperar-contrasena */
export interface RecuperarPayload {
  correo: string
}

/** POST /api/auth/restablecer-contrasena */
export interface RestablecerPayload {
  token: string
  contrasena: string
}

/** DELETE /api/v1/cuenta (T56): la contraseña actual confirma el borrado. */
export interface EliminarCuentaPayload {
  contrasena: string
}

/** Respuesta genérica con un mensaje para mostrar. */
export interface MensajeResponse {
  mensaje: string
  /** Solo en modo de prueba: enlace de recuperación que en producción llega por correo. */
  enlace_prueba?: string
}

/** Motivo por el que se cerró la sesión, para avisar al usuario. */
export type MotivoCierre = 'manual' | 'expirada' | 'no_autorizada' | 'cuenta_eliminada'