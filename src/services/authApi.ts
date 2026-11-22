import type {
  EliminarCuentaPayload,
  LoginPayload,
  MensajeResponse,
  RecuperarPayload,
  RegistroPayload,
  RestablecerPayload,
  SesionResponse,
  UsuarioConSesion,
} from '../types/auth'
import { apiFetch } from './api'

/**
 * Operaciones de autenticación. La implementación real habla con el backend;
 * la de prueba (authMock.ts) simula el mismo contrato en el navegador.
 */
export interface AuthService {
  registrar(datos: RegistroPayload): Promise<SesionResponse>
  iniciarSesion(datos: LoginPayload): Promise<SesionResponse>
  obtenerUsuarioActual(): Promise<UsuarioConSesion>
  cerrarSesion(): Promise<void>
  recuperarContrasena(datos: RecuperarPayload): Promise<MensajeResponse>
  restablecerContrasena(datos: RestablecerPayload): Promise<void>
  /** Borra la cuenta y todos sus datos en el servidor (T56). Contraseña incorrecta: error 403. */
  eliminarCuenta(datos: EliminarCuentaPayload): Promise<void>
}

/**
 * Implementación real con los endpoints /api/auth/* (ver docs/contrato-api-auth.md).
 * La contraseña viaja en texto dentro de HTTPS y el backend la guarda con hash
 * (bcrypt o Argon2, IC-11): el frontend nunca la guarda ni la cifra por su cuenta.
 * La sesión va en una cookie HttpOnly que pone el backend: aquí no se lee ni se guarda ningún token.
 */
export const authApi: AuthService = {
  registrar: (datos) =>
    apiFetch<SesionResponse>('/auth/registro', {
      method: 'POST',
      body: JSON.stringify(datos),
      conToken: false,
    }),

  iniciarSesion: (datos) =>
    apiFetch<SesionResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(datos),
      conToken: false,
    }),

  obtenerUsuarioActual: () => apiFetch<UsuarioConSesion>('/auth/me'),

  cerrarSesion: () => apiFetch<void>('/auth/logout', { method: 'POST' }),

  recuperarContrasena: (datos) =>
    apiFetch<MensajeResponse>('/auth/recuperar-contrasena', {
      method: 'POST',
      body: JSON.stringify(datos),
      conToken: false,
    }),

  restablecerContrasena: (datos) =>
    apiFetch<void>('/auth/restablecer-contrasena', {
      method: 'POST',
      body: JSON.stringify(datos),
      conToken: false,
    }),

  // DELETE /api/v1/cuenta (ikamoney-backend/docs/ELIMINAR_CUENTA.md). Responde 204 sin cuerpo.
  eliminarCuenta: (datos) => apiFetch<void>('/v1/cuenta', { method: 'DELETE', body: JSON.stringify(datos) }),
}