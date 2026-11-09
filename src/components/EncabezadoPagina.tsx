import type { ReactNode } from 'react'
import { Link } from 'react-router'
import Icon from './Icon'

interface EncabezadoPaginaProps {
  titulo: string
  subtitulo?: ReactNode
  /** Enlace para regresar a la pantalla anterior. */
  regresar?: { a: string; texto: string }
}

/** Título de cada pantalla, con enlace opcional para regresar. Usa las clases de Finanzas.css. */
function EncabezadoPagina({ titulo, subtitulo, regresar }: EncabezadoPaginaProps) {
  return (
    <header className="pagina__encabezado">
      {regresar && (
        <Link to={regresar.a} className="pagina__regresar">
          <Icon nombre="regresar" tamano={20} />
          {regresar.texto}
        </Link>
      )}
      <h1>{titulo}</h1>
      {subtitulo && <p className="pagina__subtitulo">{subtitulo}</p>}
    </header>
  )
}

export default EncabezadoPagina