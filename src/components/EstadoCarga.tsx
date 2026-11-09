import { Link } from 'react-router'
import FormAlert from './FormAlert'

interface EstadoCargaProps {
  error: string | null
  /** A dónde regresar si no se pudo cargar. */
  regresar?: { a: string; texto: string }
}

/** Muestra "Cargando…" o el error al cargar datos de una pantalla. */
function EstadoCarga({ error, regresar = { a: '/tarjetas', texto: 'Volver a tarjetas y deudas' } }: EstadoCargaProps) {
  if (!error) {
    return (
      <p role="status" className="pagina__cargando">
        Cargando…
      </p>
    )
  }

  return (
    <div className="pagina">
      <FormAlert tipo="critico">{error}</FormAlert>
      <Link to={regresar.a} className="pagina__enlace">
        {regresar.texto}
      </Link>
    </div>
  )
}

export default EstadoCarga