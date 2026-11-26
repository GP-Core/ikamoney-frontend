import type { ReactNode } from 'react'
import { MODO_PRUEBA } from '../services/auth'
import Marca from './Marca'
import './AuthLayout.css'

interface AuthLayoutProps {
  titulo: string
  subtitulo?: string
  children: ReactNode
  /** Enlaces o texto bajo la tarjeta (por ejemplo, "¿No tienes cuenta?"). */
  pie?: ReactNode
  /** Tarjeta más ancha, para textos largos. */
  ancho?: 'lectura'
}

/** Marco común de las pantallas de cuenta: logo, tarjeta del formulario y pie. */
function AuthLayout({ titulo, subtitulo, children, pie, ancho }: AuthLayoutProps) {
  return (
    <main className="auth">
      <div className={`auth__contenedor ${ancho ? 'auth__contenedor--lectura' : ''}`}>
        <p className="auth__marca">
          <Marca tamano="grande" />
        </p>

        <section className="auth__tarjeta" aria-labelledby="auth-titulo">
          <h1 id="auth-titulo">{titulo}</h1>
          {subtitulo && <p className="auth__subtitulo">{subtitulo}</p>}
          {children}
        </section>

        {pie && <div className="auth__pie">{pie}</div>}

        {MODO_PRUEBA && (
          <p className="auth__modo-prueba">Modo de prueba: los datos se guardan solo en este navegador.</p>
        )}
      </div>
    </main>
  )
}

export default AuthLayout