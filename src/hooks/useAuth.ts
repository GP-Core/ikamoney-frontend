import { useContext } from 'react'
import { AuthContext } from '../context/authContext'
import type { AuthContextValue } from '../context/authContext'

/** Acceso a la sesión: usuario, estado y acciones de login, registro y cierre. */
export function useAuth(): AuthContextValue {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return contexto
}