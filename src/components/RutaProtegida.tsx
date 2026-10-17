import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import PantallaCargando from './PantallaCargando'

/** Solo deja pasar si hay sesión; si no, manda al login y recuerda a dónde quería ir. */
export function RutaProtegida({ children }: { children: ReactNode }) {
  const { estado } = useAuth()
  const ubicacion = useLocation()

  if (estado === 'verificando') return <PantallaCargando />
  if (estado === 'anonimo') return <Navigate to="/iniciar-sesion" replace state={{ desde: ubicacion.pathname }} />
  return children
}

/** Pantallas de cuenta (login, registro…): si ya hay sesión, manda al inicio. */
export function RutaPublica({ children }: { children: ReactNode }) {
  const { estado } = useAuth()

  if (estado === 'verificando') return <PantallaCargando />
  if (estado === 'autenticado') return <Navigate to="/" replace />
  return children
}