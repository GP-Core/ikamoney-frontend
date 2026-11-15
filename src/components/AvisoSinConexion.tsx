import Icon from './Icon'
import './SinConexion.css'

/** Franja global: avisa que no hay red y que la app, por ahora, es de solo lectura (T60). */
function AvisoSinConexion() {
  return (
    <div className="sin-conexion__franja" role="status">
      <Icon nombre="precaucion" tamano={18} />
      Sin conexión · solo lectura. Estás viendo tus últimos datos guardados.
    </div>
  )
}

export default AvisoSinConexion
