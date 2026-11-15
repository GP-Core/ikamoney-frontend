import type { SimulacionResponse } from '../types/simulador'
import { pesos } from '../utils/pesos'
import { datoDelEscenario, nombreEscenario, TEXTO_PRIORIDAD, TONO_VEREDICTO } from '../utils/simulador'
import IconoVeredicto from './IconoVeredicto'
import './Simulador.css'

interface ResumenVeredictoProps {
  data: SimulacionResponse
}

/** Encabezado: responde "¿debería comprarlo?" con el veredicto general que calculó el backend. */
function ResumenVeredicto({ data }: ResumenVeredictoProps) {
  const sugerida = data.escenarios.find((e) => e.id === data.menor_impacto && e.aplica)
  const tono = data.veredicto ? TONO_VEREDICTO[data.veredicto] : 'atencion'
  // La razón con reglas fijas solo se muestra cuando el dinero alcanza; si no, el dato con cifras.
  const apoyo = sugerida ? (sugerida.regla === 'RN-16' ? sugerida.razon : datoDelEscenario(sugerida)) : null

  return (
    <section className={`sim-resumen sim-resumen--${tono}`} aria-labelledby="sim-resumen-titulo">
      <p className="sim-resumen__compra">
        {data.descripcion} · {pesos(data.precio)} · {TEXTO_PRIORIDAD[data.prioridad]}
      </p>

      {data.veredicto ? (
        <h2 id="sim-resumen-titulo" className="sim-resumen__veredicto">
          <IconoVeredicto veredicto={data.veredicto} tamano={30} />
          {data.veredicto_texto}
        </h2>
      ) : (
        <h2 id="sim-resumen-titulo" className="sim-resumen__veredicto">
          Ninguna forma de pago aplica por ahora
        </h2>
      )}

      {sugerida && (
        <p className="sim-resumen__sugerida">
          {data.veredicto === 'no_recomendable' ? 'La que menos pesa' : 'Opción sugerida'}:{' '}
          <strong>{nombreEscenario(sugerida)}</strong>
          {sugerida.tarjeta_nombre && ` con ${sugerida.tarjeta_nombre}`}
          {sugerida.tipo === 'msi' && sugerida.mensualidad !== null && `, ${pesos(sugerida.mensualidad)} al mes`}.
        </p>
      )}
      {apoyo && <p className="sim-resumen__apoyo">{apoyo}</p>}

      {data.score_actual && (
        <p className="sim-resumen__score">
          Tu score hoy: <strong>{data.score_actual.puntaje}</strong> · {data.score_actual.nivel_texto}
        </p>
      )}
    </section>
  )
}

export default ResumenVeredicto
