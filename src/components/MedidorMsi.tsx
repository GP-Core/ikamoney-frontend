import { REFERENCIA_MSI } from '../utils/balanceVista'
import './MedidorMsi.css'

/** Escala mínima de la barra: el score da cero puntos a este factor a partir de 25 %. */
const ESCALA = 25

/** Barra rayada con el % del ingreso que se va en MSI y una marca en el 10 % recomendado. */
function MedidorMsi({ delIngreso }: { delIngreso: number }) {
  const maximo = Math.max(ESCALA, delIngreso)

  return (
    <span
      className="medidor-msi"
      role="img"
      aria-label={`${delIngreso} % de tu ingreso; se recomienda no pasar de ${REFERENCIA_MSI} %`}
    >
      <span className="medidor-msi__pista">
        <span className="medidor-msi__relleno" style={{ width: `${(delIngreso / maximo) * 100}%` }} />
      </span>
      <span className="medidor-msi__marca" style={{ left: `${(REFERENCIA_MSI / maximo) * 100}%` }}>
        <span>{REFERENCIA_MSI} %</span>
      </span>
    </span>
  )
}

export default MedidorMsi
