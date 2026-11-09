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

/** Respuesta de registro y login: token de sesión + usuario. */
export interface SesionResponse {
  access_token: string
  token_type: 'bearer'
  /** Segundos que dura el token antes de expirar. */
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

/** Respuesta genérica con un mensaje para mostrar. */
export interface MensajeResponse {
  mensaje: string
  /** Solo en modo de prueba: enlace de recuperación que en producción llega por correo. */
  enlace_prueba?: string
}

/** Motivo por el que se cerró la sesión, para avisar al usuario. */
export type MotivoCierre = 'manual' | 'expirada' | 'no_autorizada'