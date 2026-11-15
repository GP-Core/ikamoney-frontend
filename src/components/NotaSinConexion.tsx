import { useConexion } from '../hooks/useConexion'
import './SinConexion.css'

/** La razón, visible, de que los botones que escriben estén apagados. Con conexión no se muestra (T60). */
function NotaSinConexion() {
  const enLinea = useConexion()
  if (enLinea) return null
  return (
    <p className="sin-conexion__nota" role="note">
      Sin conexión: no puedes agregar, editar ni eliminar. Podrás hacerlo cuando vuelvas a tener internet.
    </p>
  )
}

export default NotaSinConexion
