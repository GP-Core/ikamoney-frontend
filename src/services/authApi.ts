import type {
  LoginPayload,
  MensajeResponse,
  RecuperarPayload,
  RegistroPayload,
  RestablecerPayload,
  SesionResponse,
  Usuario,
} from '../types/auth'
import { apiFetch } from './api'

/**
 * Operaciones de autenticación. La implementación real habla con el backend;
 * la de prueba (authMock.ts) simula el mismo contrato en el navegador.
 */
export interface AuthService {
  registrar(datos: RegistroPayload): Promise<SesionResponse>
  iniciarSesion(datos: LoginPayload): Promise<SesionResponse>
  obtenerUsuarioActual(): Promise<Usuario>
  cerrarSesion(): Promise<void>
  recuperarContrasena(datos: RecuperarPayload): Promise<MensajeResponse>
  restablecerContrasena(datos: RestablecerPayload): Promise<void>
}

/**
 * Implementación real con los endpoints /api/auth/* (ver docs/contrato-api-auth.md).
 * La contraseña viaja en texto dentro de HTTPS y el backend la guarda con hash
 * (bcrypt o Argon2, IC-11): el frontend nunca la guarda ni la cifra por su cuenta.
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

  obtenerUsuarioActual: () => apiFetch<Usuario>('/auth/me'),

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
}