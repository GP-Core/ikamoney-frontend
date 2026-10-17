import { Link, NavLink, Outlet } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import Button from './Button'
import Icon from './Icon'
import type { NombreIcono } from './Icon'
import './AppLayout.css'

const SECCIONES: { ruta: string; texto: string; icono: NombreIcono }[] = [
  { ruta: '/', texto: 'Inicio', icono: 'inicio' },
  { ruta: '/tarjetas', texto: 'Tarjetas', icono: 'tarjeta' },
]

/**
 * Marco de las pantallas con sesión: barra superior con el botón de cerrar sesión
 * (disponible en cualquier pantalla, REQ-CU-08) y navegación inferior fija.
 */
function AppLayout() {
  const { cerrarSesion } = useAuth()

  return (
    <div className="app">
      <header className="app__barra">
        <Link to="/" className="app__marca" aria-label="IkaMoney, ir al inicio">
          <span className="app__marca-ika">Ika</span>
          <span className="app__marca-money">Money</span>
        </Link>
        <Button variante="secundario" onClick={() => cerrarSesion('manual')}>
          <Icon nombre="salir" tamano={20} />
          Cerrar sesión
        </Button>
      </header>

      <main className="app__contenido">
        <Outlet />
      </main>

      <nav className="app__nav" aria-label="Navegación principal">
        {SECCIONES.map((s) => (
          <NavLink
            key={s.ruta}
            to={s.ruta}
            end={s.ruta === '/'}
            className={({ isActive }) => (isActive ? 'app__nav-item app__nav-item--activo' : 'app__nav-item')}
          >
            <Icon nombre={s.icono} />
            <span>{s.texto}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export default AppLayout