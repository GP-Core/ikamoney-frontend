import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import Icon from './Icon'
import { estaActiva, GRUPOS } from './menu'
import EnlaceLegal from './EnlaceLegal'
import './MenuLateral.css'

interface MenuLateralProps {
  abierto: boolean
  onCerrar: () => void
}

/**
 * Menú que entra por la derecha, al estilo de las apps de banco: nombre y perfil arriba, la lista de
 * opciones y "Salir" fijo abajo. Con <dialog> el foco queda atrapado, Esc cierra y al cerrar el foco
 * vuelve al botón que lo abrió.
 */
function MenuLateral({ abierto, onCerrar }: MenuLateralProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const { usuario, cerrarSesion } = useAuth()
  const { pathname } = useLocation()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (abierto && !dialog.open) {
      dialog.showModal()
      // En pantallas bajas, la opción marcada no debe quedar escondida.
      dialog.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest' })
    }
    if (!abierto && dialog.open) dialog.close()
  }, [abierto])

  return (
    <dialog
      ref={ref}
      id="menu-lateral"
      className="menu"
      aria-label="Menú"
      onClose={(e) => e.target === e.currentTarget && onCerrar()}
      // El panel cubre todo el <dialog>: un clic que llega al <dialog> mismo cayó en el velo.
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div className="menu__panel">
        <div className="menu__desplazable">
          <header className="menu__cabecera">
            <p className="menu__nombre">{usuario?.nombre}</p>
            <Link
              to="/cuenta"
              className="menu__perfil"
              aria-current={pathname === '/cuenta' ? 'page' : undefined}
              onClick={onCerrar}
            >
              Perfil
            </Link>
          </header>

          <nav aria-label="Todas las opciones">
            {GRUPOS.map((grupo) => (
              <div key={grupo.titulo} className="menu__grupo">
                <p className="menu__titulo" id={`menu-${grupo.titulo}`}>
                  {grupo.titulo}
                </p>
                <ul className="menu__lista" aria-labelledby={`menu-${grupo.titulo}`}>
                  {/* Inicio se omite: en el celular ya está en la barra inferior y en el logo. */}
                  {grupo.opciones
                    .filter((o) => o.ruta !== '/')
                    .map((o) => {
                      const activa = estaActiva(o, pathname)
                      return (
                        <li key={o.ruta}>
                          <Link
                            to={o.ruta}
                            onClick={onCerrar}
                            aria-current={activa ? 'page' : undefined}
                            className={activa ? 'menu__opcion menu__opcion--activa' : 'menu__opcion'}
                          >
                            <Icon nombre={o.icono} />
                            <span>{o.textoLargo ?? o.texto}</span>
                          </Link>
                        </li>
                      )
                    })}
                </ul>
              </div>
            ))}
          </nav>

          <p className="menu__legales">
            <EnlaceLegal documento="privacidad">Aviso de privacidad</EnlaceLegal>
            <span aria-hidden="true">·</span>
            <EnlaceLegal documento="terminos">Términos</EnlaceLegal>
          </p>
        </div>

        <div className="menu__pie">
          <button
            type="button"
            className="menu__salir"
            onClick={() => {
              onCerrar()
              void cerrarSesion('manual')
            }}
          >
            <Icon nombre="salirCirculo" tamano={28} />
            Salir
          </button>
          {/* Para quien usa lector de pantalla en el celular, sin Esc ni forma de tocar el velo. */}
          <button type="button" className="menu__cerrar" onClick={onCerrar}>
            Cerrar menú
          </button>
        </div>
      </div>
    </dialog>
  )
}

export default MenuLateral
