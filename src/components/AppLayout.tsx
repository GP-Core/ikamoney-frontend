import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { useConexion } from '../hooks/useConexion'
import { useEsEscritorio } from '../hooks/useEsEscritorio'
import AvisoSinConexion from './AvisoSinConexion'
import BarraLateral from './BarraLateral'
import BarraSuperior from './BarraSuperior'
import EnlaceAvisos from './EnlaceAvisos'
import Icon from './Icon'
import Marca from './Marca'
import MenuLateral from './MenuLateral'
import { estaActiva, SECCIONES } from './menu'
import './AppLayout.css'

/**
 * Marco de las pantallas con sesión. En celular: encabezado, barra inferior y menú derecho. En
 * escritorio: barra lateral fija y barra superior. "Salir" está disponible en cualquier pantalla
 * (REQ-CU-08).
 */
function AppLayout() {
  const enLinea = useConexion()
  const escritorio = useEsEscritorio()
  const { pathname } = useLocation()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [rutaVista, setRutaVista] = useState(pathname)

  // Al cambiar de pantalla (también con "atrás") o de tamaño, el menú se cierra.
  if (rutaVista !== pathname || (escritorio && menuAbierto)) {
    setRutaVista(pathname)
    setMenuAbierto(false)
  }

  return (
    <div className="app">
      {escritorio && <BarraLateral />}

      <div className="app__columna">
        {escritorio ? (
          <BarraSuperior />
        ) : (
          <header className="app__barra">
            <Link to="/" className="app__marca" aria-label="IkaMoney, ir al inicio">
              <Marca />
            </Link>
            <div className="app__acciones">
              <EnlaceAvisos conEtiqueta />
              <button
                type="button"
                className="campana"
                aria-haspopup="dialog"
                aria-expanded={menuAbierto}
                aria-controls="menu-lateral"
                onClick={() => setMenuAbierto(true)}
              >
                <span className="campana__circulo">
                  <Icon nombre="menu" />
                </span>
                <span>Menú</span>
              </button>
            </div>
          </header>
        )}

        {!enLinea && <AvisoSinConexion />}

        <main className="app__contenido">
          <Outlet />
        </main>
      </div>

      {!escritorio && (
        <>
          <nav className="app__nav" aria-label="Navegación principal">
            {SECCIONES.map((s) => {
              const activa = estaActiva(s, pathname)
              return (
                <Link
                  key={s.ruta}
                  to={s.ruta}
                  aria-current={activa ? 'page' : undefined}
                  className={activa ? 'app__nav-item app__nav-item--activo' : 'app__nav-item'}
                >
                  <span className="app__nav-icono">
                    <Icon nombre={s.icono} />
                  </span>
                  <span>{s.texto}</span>
                </Link>
              )
            })}
          </nav>
          <MenuLateral abierto={menuAbierto} onCerrar={() => setMenuAbierto(false)} />
        </>
      )}
    </div>
  )
}

export default AppLayout
