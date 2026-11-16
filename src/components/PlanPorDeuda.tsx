import type { PlanResponse, PosicionRanking } from '../types/plan'
import { duracion, mesEnFrase } from '../utils/formatPlan'
import { pesos } from '../utils/pesos'
import { abonosPorDeuda } from '../utils/planVista'

interface Props {
  plan: PlanResponse
  ranking: PosicionRanking[]
}

/** Cuánto abonar a cada deuda y durante cuántos meses, en el orden del ranking. */
function PlanPorDeuda({ plan, ranking }: Props) {
  const abonos = abonosPorDeuda(plan)
  const datosRanking = new Map(ranking.map((r) => [r.clave, r]))
  // La barra se dibuja contra la deuda que más tarda; las que no se liquidan ocupan todo el ancho.
  const horizonte = Math.max(1, ...plan.deudas.map((d) => d.meses_plan ?? 0))

  return (
    <section className="porDeuda" aria-labelledby="pordeuda-titulo">
      <h2 id="pordeuda-titulo" className="plan__titulo">
        Tu plan por deuda
      </h2>
      <p className="porDeuda__ayuda">
        En este orden: el abono extra va a la primera; al liquidarla, ese dinero pasa a la siguiente.
      </p>

      <ol className="porDeuda__lista">
        {plan.deudas.map((d) => {
          const info = datosRanking.get(d.clave)
          const abono = abonos.get(d.clave)
          const ancho = d.meses_plan === null ? 100 : Math.max(4, (d.meses_plan / horizonte) * 100)
          const sube = abono !== undefined && abono.maximo > abono.inicial + 0.5
          return (
            <li key={d.clave} className="deuda">
              <div className="deuda__cabeza">
                <span className="deuda__num" aria-hidden="true">
                  {d.posicion}
                </span>
                <div className="deuda__nombre">
                  <h3>{d.nombre}</h3>
                  {info && (
                    <p>
                      {info.tipo === 'tarjeta' ? 'Tarjeta' : 'Préstamo'} · saldo {pesos(info.saldo)} · {info.tasa_anual} % anual
                    </p>
                  )}
                </div>
              </div>

              <p className="deuda__abono">
                {abono && (
                  <>
                    Abona <strong>{pesos(abono.inicial)}</strong> al mes
                  </>
                )}
                {d.meses_plan !== null ? (
                  <>
                    {' '}
                    durante <strong>{duracion(d.meses_plan)}</strong>
                  </>
                ) : (
                  <> y aun así no se liquida</>
                )}
                .
              </p>
              {abono && (abono.extraInicial > 0 || sube) && (
                <p className="deuda__nota">
                  {abono.extraInicial > 0 && <>Incluye {pesos(abono.extraInicial)} de abono extra. </>}
                  {sube && <>Sube hasta {pesos(abono.maximo)} cuando se libere dinero de otras deudas.</>}
                </p>
              )}

              <div className="deuda__barra" role="presentation">
                <span
                  className={d.meses_plan === null ? 'deuda__relleno deuda__relleno--sin' : 'deuda__relleno'}
                  style={{ width: `${ancho}%` }}
                />
              </div>
              <p className="deuda__pie">
                {d.liquidacion_plan ? <>Liquidada en {mesEnFrase(d.liquidacion_plan)}</> : <>Sin fecha de liquidación</>} ·
                intereses estimados {d.intereses_plan === null ? '—' : pesos(d.intereses_plan)}
              </p>

              {info && (
                <details className="deuda__porque">
                  <summary>¿Por qué va en este lugar?</summary>
                  <p>{info.razon}</p>
                </details>
              )}
            </li>
          )
        })}
      </ol>
      {!plan.calendario_completo && (
        <p className="porDeuda__ayuda">El plan dura más de lo que se muestra mes a mes; los abonos que ves son los de los primeros meses.</p>
      )}
    </section>
  )
}

export default PlanPorDeuda
