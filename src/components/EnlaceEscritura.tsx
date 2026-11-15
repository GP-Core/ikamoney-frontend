import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useConexion } from '../hooks/useConexion'
import './SinConexion.css'

interface EnlaceEscrituraProps {
  to: string
  className: string
  children: ReactNode
}

/** Enlace a una pantalla que escribe (agregar, editar). Sin conexión se apaga y deja de navegar (T60). */
function EnlaceEscritura({ to, className, children }: EnlaceEscrituraProps) {
  const enLinea = useConexion()
  if (enLinea) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    )
  }
  return (
    <span className={`${className} sin-conexion__apagado`} role="link" aria-disabled="true" title="Sin conexión">
      {children}
    </span>
  )
}

export default EnlaceEscritura
