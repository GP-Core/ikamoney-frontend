import type { PlanResponse } from '../types/plan'
import { duracion, mesEnFrase } from '../utils/formatPlan'
import { pesos } from '../utils/pesos'

/** Ahorro estimado. Siempre dice contra qué se compara: una cifra sin referencia no se audita. */
function AhorroPlan({ plan }: { plan: PlanResponse }) {
  const { total } = plan
  const nunca = 'Nunca termina'

  return (
    <section className="ahorro" aria-labelledby="ahorro-titulo">
      <h2 id="ahorro-titulo" className="plan__titulo">
        Lo que te ahorras (estimado)
      </h2>

      {total.ahorro === null ? (
        <p className="ahorro__texto">
          {total.intereses_base === null
            ? 'Pagando solo el mínimo, alguna de tus deudas nunca se terminaría de pagar, así que no hay una cifra de ahorro que comparar.'
            : 'Con este presupuesto tus deudas no se terminan de pagar, así que aún no hay un ahorro que calcular.'}
        </p>
      ) : (
        <>
          <p className="ahorro__cifra">{pesos(Math.max(0, total.ahorro))}</p>
          <p className="ahorro__texto">
            menos en intereses
            {total.meses_menos !== null && total.meses_menos > 0 && <> y {duracion(total.meses_menos)} menos de deuda</>}.
          </p>
        </>
      )}

      <div className="ahorro__compara">
        <p className="ahorro__referencia">
          <strong>Comparado con:</strong> {plan.escenario_base_texto}
        </p>
        <dl className="ahorro__tabla">
          <div>
            <dt />
            <dd>Solo mínimos</dd>
            <dd>Tu plan</dd>
          </div>
          <div>
            <dt>Intereses totales</dt>
            <dd>{total.intereses_base === null ? '—' : pesos(total.intereses_base)}</dd>
            <dd>{total.intereses_plan === null ? '—' : pesos(total.intereses_plan)}</dd>
          </div>
          <div>
            <dt>Libre de deudas</dt>
            <dd>{total.liquidacion_base ? mesEnFrase(total.liquidacion_base) : nunca}</dd>
            <dd>{total.liquidacion_plan ? mesEnFrase(total.liquidacion_plan) : nunca}</dd>
          </div>
        </dl>
      </div>
    </section>
  )
}

export default AhorroPlan
