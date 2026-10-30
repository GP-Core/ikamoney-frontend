import type { MesBalance, ResumenMsi } from '../types/balance'
import { mesLargo, mesNombre } from '../utils/formatMes'
import { pesos } from '../utils/pesos'
import './CompromisosMsi.css'

interface CompromisosMsiProps {
  /** El mes consultado seguido de los meses proyectados (los mismos de la gráfica). */
  meses: MesBalance[]
  msi: ResumenMsi
}

/** Cuánto de lo proyectado ya está comprometido en mensualidades de MSI, y cuándo se libera. */
function CompromisosMsi({ meses, msi }: CompromisosMsiProps) {
  const totalMsi = meses.reduce((suma, m) => suma + m.msi, 0)
  const totalEgresos = meses.reduce((suma, m) => suma + m.gastos_fijos + m.gastos_variables + (m.tarjetas ?? 0) + m.msi,0,)  
  const porcentaje = totalEgresos > 0 ? Math.round((totalMsi / totalEgresos) * 100) : 0

  // Primer mes en que baja el MSI: ahí se libera dinero.
  const indiceLiberacion = meses.findIndex((m, i) => i > 0 && m.msi < meses[i - 1].msi)
  const liberacion =
    indiceLiberacion > 0
      ? { mes: meses[indiceLiberacion].mes, monto: meses[indiceLiberacion - 1].msi - meses[indiceLiberacion].msi }
      : null

  if (msi.planes_activos === 0) {
    return (
      <section className="msi" aria-labelledby="msi-titulo">
        <h2 id="msi-titulo" className="msi__titulo">
          Compromisos a MSI
        </h2>
        <p className="msi__vacio">No tienes compras a meses sin intereses activas. Lo proyectado está libre de ese compromiso.</p>
      </section>
    )
  }

  return (
    <section className="msi" aria-labelledby="msi-titulo">
      <h2 id="msi-titulo" className="msi__titulo">
        Compromisos a MSI
      </h2>

      <p className="msi__porcentaje">
        <strong>{porcentaje}%</strong> de lo que saldrá en los próximos {meses.length} meses ya está comprometido en
        mensualidades.
      </p>
      <div
        className="msi__barra"
        role="img"
        aria-label={`${pesos(totalMsi)} de ${pesos(totalEgresos)} proyectados son MSI (${porcentaje}%)`}
      >
        <span className="msi__relleno" style={{ width: `${porcentaje}%` }} />
      </div>
      <p className="msi__montos">
        {pesos(totalMsi)} de {pesos(totalEgresos)}
      </p>

      <dl className="msi__datos">
        <div>
          <dt>Saldo pendiente</dt>
          <dd>{pesos(msi.saldo_pendiente)}</dd>
        </div>
        <div>
          <dt>Planes activos</dt>
          <dd>{msi.planes_activos}</dd>
        </div>
        {msi.ultimo_mes && (
          <div>
            <dt>Terminas de pagar</dt>
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
    </section>
  )
}

export default CompromisosMsi
