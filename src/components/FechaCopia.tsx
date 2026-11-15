import Icon from './Icon'
import './SinConexion.css'

const FORMATO = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' })

interface FechaCopiaProps {
  /** Fecha y hora en que se guardaron los datos; null si los datos son los de ahora. */
  fecha: Date | null
}

/**
 * Una línea que deja claro que lo que se ve es una copia vieja, no el saldo de ahorita (T60).
 * Si los datos están al día no muestra nada.
 */
function FechaCopia({ fecha }: FechaCopiaProps) {
  if (!fecha) return null
  return (
    <p className="sin-conexion__fecha" role="status">
      <Icon nombre="info" tamano={20} />
      <span>
        <strong>Datos guardados el {FORMATO.format(fecha)}</strong>
        <br />
        No son actuales; se actualizarán cuando vuelvas a tener conexión.
      </span>
    </p>
  )
}

export default FechaCopia
