import { useContext } from 'react'
import { AlertasContext } from '../context/alertasContext'

/** Alertas del usuario y su contador. Solo funciona dentro de AlertasProvider (pantallas con sesión). */
export function useAlertas() {
  const contexto = useContext(AlertasContext)
  if (!contexto) throw new Error('useAlertas debe usarse dentro de <AlertasProvider>')
  return contexto
}
