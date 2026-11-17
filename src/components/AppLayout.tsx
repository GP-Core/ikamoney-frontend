import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { useAlertas } from '../hooks/useAlertas'
import { useConexion } from '../hooks/useConexion'
import { textoContador } from '../utils/alertas'
import AvisoSinConexion from './AvisoSinConexion'
import Button from './Button'
import Icon from './Icon'
import type { NombreIcono } from './Icon'
import './AppLayout.css'

/** Las cuatro pestañas del prototipo (T21). `tambien` son pantallas hijas que dejan la pestaña marcada. */
const SECCIONES: { ruta: string; texto: string; icono: NombreIcono; tambien?: string[] }[] = [
  { ruta: '/', texto: 'Inicio', icono: 'inicio' },
  { ruta: '/simulador', texto: 'Simulador', icono: 'calculadora' },
  { ruta: '/ranking', texto: 'Deudas', icono: 'recibo', tambien: ['/plan'] },
  { ruta: '/score', texto: 'Score', icono: 'sano' },
]

/**
 * Marco de las pantallas con sesión: barra superior con el botón de cerrar sesión
 * (disponible en cualquier pantalla, REQ-CU-08) y navegación inferior fija.
 */
function AppLayout() {
  const { cerrarSesion } = useAuth()
  const enLinea = useConexion()
  const { pathname } = useLocation()
  const { sinLeer } = useAlertas()

  return (
    <div className="app">
      <header className="app__barra">
        <Link to="/" className="app__marca" aria-label="IkaMoney, ir al inicio">
          <span className="app__marca-ika">Ika</span>
          <span className="app__marca-money">Money</span>
        </Link>
        <div className="app__acciones">
          <NavLink
            to="/alertas"
            aria-label={sinLeer > 0 ? `Avisos, ${sinLeer} sin leer` : 'Avisos'}
            className={({ isActive }) => (isActive ? 'app__cuenta app__cuenta--activo' : 'app__cuenta')}
          >
            <span className="app__campana">
              <Icon nombre="campana" />
              {sinLeer > 0 && (
                <span className="app__contador" aria-hidden="true">
                  {textoContador(sinLeer)}
                </span>
              )}
            </span>
          </NavLink>
          <NavLink
            to="/cuenta"
            aria-label="Mi cuenta"
            className={({ isActive }) => (isActive ? 'app__cuenta app__cuenta--activo' : 'app__cuenta')}
          >
            <Icon nombre="usuario" />
          </NavLink>
          <Button variante="secundario" onClick={() => cerrarSesion('manual')}>
            <Icon nombre="salir" tamano={20} />
            Cerrar sesión
          </Button>
        </div>
      </header>

      {!enLinea && <AvisoSinConexion />}

      <main className="app__contenido">
        <Outlet />
      </main>

      <nav className="app__nav" aria-label="Navegación principal">
        {SECCIONES.map((s) => (
          <NavLink
            key={s.ruta}
            to={s.ruta}
            end={s.ruta === '/'}
            className={({ isActive }) =>
              isActive || s.tambien?.some((r) => pathname.startsWith(r))
                ? 'app__nav-item app__nav-item--activo'
                : 'app__nav-item'
            }
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