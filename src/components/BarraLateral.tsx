import { Link, useLocation } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import Icon from './Icon'
import Marca from './Marca'
import { estaActiva, GRUPOS } from './menu'
import EnlaceLegal from './EnlaceLegal'
import './BarraLateral.css'

/** Navegación fija de escritorio. En celular su lugar lo ocupan la barra inferior y el menú derecho. */
function BarraLateral() {
  const { cerrarSesion } = useAuth()
  const { pathname } = useLocation()

  return (
    <aside className="lateral">
      <Link to="/" className="lateral__marca" aria-label="IkaMoney, ir al inicio">
        <Marca />
      </Link>

      <nav aria-label="Navegación principal">
        {GRUPOS.map((grupo) => (
          <div key={grupo.titulo} className="lateral__grupo">
            <p className="lateral__titulo" id={`grupo-${grupo.titulo}`}>
              {grupo.titulo}
            </p>
            <ul aria-labelledby={`grupo-${grupo.titulo}`}>
              {grupo.opciones.map((o) => {
                const activa = estaActiva(o, pathname)
                return (
                  <li key={o.ruta}>
                    <Link
                      to={o.ruta}
                      aria-current={activa ? 'page' : undefined}
                      className={activa ? 'lateral__opcion lateral__opcion--activa' : 'lateral__opcion'}
                    >
                      <Icon nombre={o.icono} tamano={20} />
                      <span>{o.textoLargo ?? o.texto}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="lateral__pie">
        <button type="button" className="lateral__salir" onClick={() => void cerrarSesion('manual')}>
          <Icon nombre="salirCirculo" tamano={22} />
          Salir
        </button>
        <p className="lateral__legales">
          <EnlaceLegal documento="privacidad">Aviso de privacidad</EnlaceLegal>
          <span aria-hidden="true">·</span>
          <EnlaceLegal documento="terminos">Términos</EnlaceLegal>
        </p>
      </div>
    </aside>
  )
}

export default BarraLateral
