import type { MesBalance } from '../types/balance'
import { mesNombre } from '../utils/formatMes'
import { pesos } from '../utils/pesos'
import './ResumenMes.css'

interface ResumenMesProps {
  datos: MesBalance
}

/** Resumen del mes: cuánto queda libre, de dónde viene y a dónde se va el ingreso. */
function ResumenMes({ datos }: ResumenMesProps) {
  const { ingresos, gastos_fijos, gastos_variables, msi, libre } = datos
  const gastos = gastos_fijos + gastos_variables
  const negativo = libre < 0

  // Base de la barra: lo mayor entre lo que entra y lo que sale, para que nunca pase de 100 %.
  const base = Math.max(ingresos, gastos + msi, 1)
  const porcentaje = (valor: number) => `${(Math.max(valor, 0) / base) * 100}%`

  const descripcionBarra =
    `Del ingreso de ${pesos(ingresos)}: ${pesos(gastos_fijos)} en gastos fijos, ` +
    `${pesos(gastos_variables)} en gastos variables, ${pesos(msi)} en MSI` +
    (negativo ? `; faltan ${pesos(-libre)}.` : ` y ${pesos(libre)} libres.`)

  return (
    <section className="resumen" aria-labelledby="resumen-titulo">
      <h2 id="resumen-titulo" className="resumen__etiqueta">
        {negativo ? `Te faltan en ${mesNombre(datos.mes).toLowerCase()}` : 'Te queda libre'}
      </h2>
      <p className={`resumen__libre ${negativo ? 'resumen__libre--negativo' : ''}`}>
        {pesos(Math.abs(libre))}
      </p>
      <p className="resumen__detalle">
        {negativo
          ? `Tus gastos y MSI superan tus ingresos de ${pesos(ingresos)}.`
          : `de ${pesos(ingresos)} de ingresos este mes`}
      </p>

      <div className="resumen__barra" role="img" aria-label={descripcionBarra}>
        <span className="resumen__tramo resumen__tramo--fijo" style={{ width: porcentaje(gastos_fijos) }} />
        <span className="resumen__tramo resumen__tramo--variable" style={{ width: porcentaje(gastos_variables) }} />
        <span className="resumen__tramo resumen__tramo--msi" style={{ width: porcentaje(msi) }} />
        <span className="resumen__tramo resumen__tramo--libre" style={{ width: porcentaje(libre) }} />
      </div>

      <dl className="resumen__cifras">
        <div className="resumen__cifra">
          <dt>
            <span className="punto punto--ingreso" aria-hidden="true" />
            Ingresos
          </dt>
          <dd>{pesos(ingresos)}</dd>
        </div>
        <div className="resumen__cifra">
          <dt>
            <span className="punto punto--fijo" aria-hidden="true" />
            Gastos
          </dt>
          <dd>{pesos(gastos)}</dd>
          <dd className="resumen__nota">
            {pesos(gastos_fijos)} fijos · {pesos(gastos_variables)} variables
          </dd>
        </div>
        <div className="resumen__cifra">
          <dt>
            <span className="punto punto--msi" aria-hidden="true" />
            MSI
          </dt>
          <dd>{pesos(msi)}</dd>
          <dd className="resumen__nota">mensualidades del mes</dd>
        </div>
      </dl>
    </section>
  )
}

export default ResumenMes
