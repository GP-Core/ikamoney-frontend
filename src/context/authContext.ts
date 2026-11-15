import { createContext } from 'react'
import type { LoginPayload, MotivoCierre, RegistroPayload, Usuario } from '../types/auth'

export type EstadoSesion = 'verificando' | 'autenticado' | 'anonimo'

export interface AuthContextValue {
  estado: EstadoSesion
  usuario: Usuario | null
  /** Por qué se cerró la última sesión (para avisar en la pantalla de login). */
  motivoCierre: MotivoCierre | null
  iniciarSesion(datos: LoginPayload): Promise<void>
  registrar(datos: RegistroPayload): Promise<void>
  cerrarSesion(motivo?: MotivoCierre): Promise<void>
  /**
   * Elimina la cuenta (T56): la borra en el servidor, limpia este dispositivo y cierra la sesión.
   * Si el servidor la rechaza (contraseña incorrecta, sin conexión) lanza el error y no borra nada.
   */
  eliminarCuenta(contrasena: string): Promise<void>
}

/** Contexto de sesión. Se usa con el hook useAuth(). */
export const AuthContext = createContext<AuthContextValue | null>(null)