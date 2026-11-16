import type { EscenarioSimulacion, ScoreActual } from '../types/simulador'
import { pesos } from '../utils/pesos'
import { datoDelEscenario, nombreEscenario, TONO_VEREDICTO } from '../utils/simulador'
import IconoVeredicto from './IconoVeredicto'
import './Simulador.css'

interface ComparativaProps {
  /** Solo los escenarios que aplican; los demás van en EscenariosNoViables. */
  escenarios: EscenarioSimulacion[]
  menorImpacto: string | null
  scoreActual: ScoreActual | null
  /** Si el general es "no recomendable", la de menor impacto no se presenta como sugerida. */
  hayOpcionSugerida: boolean
}

function Flecha({ cambio }: { cambio: number }) {
  if (cambio === 0) return <span>Igual que hoy</span>
  return (
    <span>
      {cambio > 0 ? '↑' : '↓'} {Math.abs(cambio)} {cambio > 0 ? 'más' : 'menos'} que hoy
    </span>
  )
}

/** Los escenarios lado a lado: mensualidad, score y veredicto. En el celular se desliza de lado. */
function ComparativaEscenarios({ escenarios, menorImpacto, scoreActual, hayOpcionSugerida }: ComparativaProps) {
  return (
    <section className="sim-comparativa" aria-labelledby="sim-comparativa-titulo">
      <h2 id="sim-comparativa-titulo" className="sim-titulo">
        Formas de pagarlo
      </h2>
      <ul className="sim-comparativa__lista">
        {escenarios.map((e) => {
          if (!e.veredicto || !e.score) return null
          const tono = TONO_VEREDICTO[e.veredicto]
          const destacada = e.id === menorImpacto
          const dato = datoDelEscenario(e)
          return (
            <li key={e.id} className={`sim-card sim-card--${tono} ${destacada ? 'sim-card--destacada' : ''}`}>
              {destacada && (
                <span className={`sim-card__sello ${hayOpcionSugerida ? '' : 'sim-card__sello--neutro'}`}>
                  {hayOpcionSugerida ? '★ Opción sugerida' : 'Menor impacto'}
                </span>
              )}
              <h3 className="sim-card__nombre">{nombreEscenario(e)}</h3>
              <p className="sim-card__tarjeta">{e.tarjeta_nombre ?? 'Pagas todo este mes'}</p>

              <p className="sim-card__monto">
                {pesos(e.mensualidad ?? 0)}
                <span>{e.tipo === 'msi' ? ' al mes' : ' hoy'}</span>
              </p>

              <p className="sim-card__score">
                Score <strong>{e.score.puntaje}</strong>
                {scoreActual && (
                  <small>
                    <Flecha cambio={e.score.cambio} />
                  </small>
                )}
              </p>

              <p className={`sim-pastilla sim-pastilla--${tono}`}>
                <IconoVeredicto veredicto={e.veredicto} tamano={16} /> {e.veredicto_texto}
              </p>
              {dato && <p className="sim-card__dato">{dato}</p>}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default ComparativaEscenarios
