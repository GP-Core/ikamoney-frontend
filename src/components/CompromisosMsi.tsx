import type { MesBalance, ResumenMsi } from '../types/balance'
import { cargaMsi, REFERENCIA_MSI } from '../utils/balanceVista'
import type { MomentoMes } from '../utils/balanceVista'
import { mesLargo, mesNombre } from '../utils/formatMes'
import { pesos } from '../utils/pesos'
import MedidorMsi from './MedidorMsi'
import './CompromisosMsi.css'

interface CompromisosMsiProps {
  /** El mes consultado seguido de todos los proyectados: no depende de cuántos se ven en la gráfica. */
  meses: MesBalance[]
  msi: ResumenMsi
  momento: MomentoMes
}

/** Dinero que ya se prometió pagar en mensualidades: cuánto pesa en el ingreso y cuándo se libera. */
function CompromisosMsi({ meses, msi, momento }: CompromisosMsiProps) {
  const { mensualidad, delIngreso, arribaDeReferencia, liberacion } = cargaMsi(meses[0], meses)
  const mes = mesNombre(meses[0].mes).toLowerCase()

  return (
    <section className="msi" aria-labelledby="msi-titulo">
      <h2 id="msi-titulo" className="msi__titulo">
        Compras a meses sin intereses
      </h2>
      <p className="msi__subtitulo">Dinero que ya prometiste pagar en mensualidades.</p>

      {msi.planes_activos === 0 ? (
        <p className="msi__vacio">No tienes compras a meses activas. Lo proyectado está libre de ese compromiso.</p>
      ) : (
        <>
          <p className="msi__porcentaje">
            {momento === 'proyeccion' ? `En ${mes} pagarías ` : ''}
            <strong>{pesos(mensualidad)}</strong> al mes
            {delIngreso !== null && (
              <>
                {' '}
                · <strong>{delIngreso} %</strong> de tu ingreso
              </>
            )}
          </p>

          {delIngreso !== null && (
            <>
              <MedidorMsi delIngreso={delIngreso} />
              <p className="msi__montos">
                {arribaDeReferencia
                  ? `Está arriba del ${REFERENCIA_MSI} % que se recomienda.`
                  : `Está dentro del ${REFERENCIA_MSI} % que se recomienda.`}
              </p>
            </>
          )}

          <dl className="msi__datos">
            <div>
              <dt>Te falta pagar</dt>
              <dd>{pesos(msi.saldo_pendiente)}</dd>
            </div>
            <div>
              <dt>Compras activas</dt>
              <dd>{msi.planes_activos}</dd>
            </div>
            {msi.ultimo_mes && (
              <div>
                <dt>Terminas en</dt>
                <dd>{mesLargo(msi.ultimo_mes).toLowerCase()}</dd>
              </div>
            )}
          </dl>

          {liberacion && (
            <p className="msi__aviso">
              En {mesNombre(liberacion.mes).toLowerCase()} se liberan <strong>{pesos(liberacion.monto)}</strong> al mes
              porque termina uno de tus planes.
            </p>
          )}
        </>
      )}
    </section>
  )
}

export default CompromisosMsi
