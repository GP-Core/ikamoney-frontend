import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useConexion } from '../hooks/useConexion'
import FormAlert from './FormAlert'

interface SoloConConexionProps {
  children: ReactNode
  /** A dónde regresar mientras no hay conexión. */
  regresar?: { a: string; texto: string }
}

/**
 * Envuelve las pantallas que registran o editan (T60): sin conexión no se muestran, porque lo que
 * se escribiera no se podría guardar. Si el formulario estaba abierto, se pierde lo capturado.
 */
function SoloConConexion({ children, regresar = { a: '/tarjetas', texto: 'Volver a tarjetas y deudas' } }: SoloConConexionProps) {
  const enLinea = useConexion()
  if (enLinea) return children

  return (
    <div className="pagina">
      <FormAlert tipo="precaucion">
        Sin conexión no puedes registrar, editar ni eliminar. Solo puedes consultar tus últimos datos guardados. Vuelve a
        intentarlo cuando tengas internet.
      </FormAlert>
      <Link to={regresar.a} className="pagina__enlace">
        {regresar.texto}
      </Link>
    </div>
  )
}

export default SoloConConexion
