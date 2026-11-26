import { useSyncExternalStore } from 'react'
import { Link, useLocation } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { iniciales } from '../utils/texto'
import EnlaceAvisos from './EnlaceAvisos'
import { migasDe } from './menu'
import './BarraSuperior.css'

const HOY = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })

function suscribirDesplazamiento(alCambiar: () => void) {
  window.addEventListener('scroll', alCambiar, { passive: true })
  return () => window.removeEventListener('scroll', alCambiar)
}

/** Barra ligera de escritorio: dónde estás, los avisos y tu perfil. */
function BarraSuperior() {
  const { usuario } = useAuth()
  const { pathname } = useLocation()
  const desplazada = useSyncExternalStore(suscribirDesplazamiento, () => window.scrollY > 4)
  const migas = migasDe(pathname)

  return (
    <header className={desplazada ? 'superior superior--sombra' : 'superior'}>
      <div className="superior__interior">
        <p className="superior__migas">{migas.length > 0 ? migas.join(' › ') : HOY.format(new Date())}</p>

        <EnlaceAvisos />

        <Link to="/cuenta" className="superior__usuario">
          <span className="superior__iniciales" aria-hidden="true">
            {iniciales(usuario?.nombre ?? '')}
          </span>
          <span>
            <strong>{usuario?.nombre}</strong>
            <span>Perfil</span>
          </span>
        </Link>
      </div>
    </header>
  )
}

export default BarraSuperior
