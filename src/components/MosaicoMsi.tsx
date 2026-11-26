import { Link } from 'react-router'
import type { MesBalance, ResumenMsi } from '../types/balance'
import { cargaMsi } from '../utils/balanceVista'
import { mesNombre } from '../utils/formatMes'
import { pesos } from '../utils/pesos'
import MedidorMsi from './MedidorMsi'
import './TarjetasInicio.css'

interface MosaicoMsiProps {
  /** El mes consultado seguido de los meses proyectados. */
  meses: MesBalance[]
  msi: ResumenMsi
}

/** Meses sin intereses en dos datos: cuánto del ingreso se va en ellos y cuándo se libera dinero. */
function MosaicoMsi({ meses, msi }: MosaicoMsiProps) {
  const { delIngreso, mensualidad, liberacion } = cargaMsi(meses[0], meses)

  return (
    <Link to="/tarjetas" className="mosaico mosaico--msi">
      <h2 className="mosaico__titulo">A meses sin intereses</h2>
      {msi.planes_activos === 0 ? (
        <p className="mosaico__texto">No tienes compras a meses activas.</p>
      ) : (
        <>
          {delIngreso !== null ? (
            <>
              <p className="mosaico__cifra">
                {delIngreso}%<span> de tu ingreso</span>
              </p>
              <MedidorMsi delIngreso={delIngreso} />
            </>
          ) : (
            <p className="mosaico__cifra">{pesos(mensualidad)}</p>
          )}
          <p className="mosaico__texto">
            {liberacion
              ? `En ${mesNombre(liberacion.mes).toLowerCase()} se liberan ${pesos(liberacion.monto)} al mes.`
              : `Pagas ${pesos(mensualidad)} al mes.`}
          </p>
        </>
      )}
      <span className="mosaico__enlace">Ver tarjetas</span>
    </Link>
  )
}

export default MosaicoMsi
