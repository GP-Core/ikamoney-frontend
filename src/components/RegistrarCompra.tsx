import { pesos } from '../utils/pesos'
import '../pages/SimuladorPage.css'

interface RegistrarCompraProps {
  descripcion: string
  /** Meses del escenario recomendado. */
  meses: number
  tarjetaNombre: string
  mensualidad: number
  guardando: boolean
  error: string | null
  onRegistrar: () => void
}

/**
 * RF-50: convierte el escenario a MSI recomendado en una compra registrada en la tarjeta.
 * Es el único botón de acción del resultado, para no confundirlo con "volver a simular".
 */
function RegistrarCompra({ descripcion, meses, tarjetaNombre, mensualidad, guardando, error, onRegistrar }: RegistrarCompraProps) {
  return (
    <section className="sim-registrar" aria-labelledby="sim-registrar-titulo">
      <h2 id="sim-registrar-titulo" className="sim-registrar__titulo">
        ¿Vas a hacer esta compra?
      </h2>
      <p className="sim-nota">
        Se guardará “{descripcion}” en {tarjetaNombre}, a {meses} meses de {pesos(mensualidad)}. Así la verás en tus
        compras a MSI y en tu proyección.
      </p>
      {error && (
        <p className="sim-error" role="alert">
          {error}
        </p>
      )}
      <button type="button" className="sim-boton" disabled={guardando} onClick={onRegistrar}>
        {guardando ? 'Registrando…' : `Registrar esta compra a ${meses} MSI`}
      </button>
    </section>
  )
}

export default RegistrarCompra
