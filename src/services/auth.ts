import { authApi } from './authApi'
import type { AuthService } from './authApi'
import { authMock } from './authMock'

/** true cuando VITE_AUTH_MOCK=true: la autenticación funciona sin backend. */
export const MODO_PRUEBA = import.meta.env.VITE_AUTH_MOCK === 'true'

/** Servicio de autenticación que usa toda la app. */
export const authService: AuthService = MODO_PRUEBA ? authMock : authApi