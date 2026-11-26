import type { KeyboardEvent } from 'react'
import type { EscenarioSimulacion, ScoreActual } from '../types/simulador'
import { pesos } from '../utils/pesos'
import { datoDelEscenario, nombreEscenario, TONO_VEREDICTO } from '../utils/simulador'
import { opcionVecina, ordenarConSugerida } from '../utils/simuladorVista'
import IconoVeredicto from './IconoVeredicto'
import './Simulador.css'

interface ComparativaProps {
  /** Solo los escenarios que aplican; los demás van en EscenariosNoViables. */
  escenarios: EscenarioSimulacion[]
  menorImpacto: string | null
  scoreActual: ScoreActual | null
  /** Si el general es "no recomendable", la de menor impacto no se presenta como sugerida. */
  hayOpcionSugerida: boolean
  elegido: string | null
  onElegir: (id: string) => void
}

function Flecha({ cambio }: { cambio: number }) {
  if (cambio === 0) return <span>Igual que hoy</span>
  return (
    <span>
      {cambio > 0 ? '↑' : '↓'} {Math.abs(cambio)} {cambio > 0 ? 'más' : 'menos'} que hoy
    </span>
  )
}

/** Los escenarios lado a lado, para elegir uno: mensualidad, score y veredicto. En el celular se desliza de lado. */
function ComparativaEscenarios({
  escenarios, menorImpacto, scoreActual, hayOpcionSugerida, elegido, onElegir,
}: ComparativaProps) {
  const visibles = ordenarConSugerida(escenarios, menorImpacto).filter((e) => e.veredicto && e.score)
  const ids = visibles.map((e) => e.id)
  // Solo una opción recibe el Tab; entre ellas se avanza con las flechas.
  const enfocable = elegido ?? ids[0]

  function teclear(evento: KeyboardEvent<HTMLUListElement>) {
    const actual = (evento.target as HTMLElement).dataset.id
    if (!actual) return
    const esElegir = evento.key === ' ' || evento.key === 'Enter'
    const destino = esElegir ? actual : opcionVecina(ids, actual, evento.key)
    if (!destino) return
    evento.preventDefault()
    onElegir(destino)
    evento.currentTarget.querySelector<HTMLElement>(`[data-id="${destino}"]`)?.focus()
  }

  return (
    <section className="sim-comparativa" aria-labelledby="sim-comparativa-titulo">
      <h2 id="sim-comparativa-titulo" className="sim-titulo">
        Formas de pagarlo
      </h2>
      <p className="sim-comparativa__ayuda">
        Toca una para elegirla.{hayOpcionSugerida ? ' La sugerida es la que menos afecta tu dinero.' : ''}
      </p>
      <ul className="sim-comparativa__lista" role="radiogroup" aria-labelledby="sim-comparativa-titulo" onKeyDown={teclear}>
        {visibles.map((e) => {
          const tono = TONO_VEREDICTO[e.veredicto!]
          const destacada = e.id === menorImpacto
          const marcada = e.id === elegido
          const dato = datoDelEscenario(e)
          return (
            <li
              key={e.id}
              role="radio"
              aria-checked={marcada}
              tabIndex={e.id === enfocable ? 0 : -1}
              data-id={e.id}
              onClick={() => onElegir(e.id)}
              className={`sim-card sim-card--${tono} ${destacada ? 'sim-card--destacada' : ''} ${marcada ? 'sim-card--elegida' : ''}`}
            >
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
                Score <strong>{e.score!.puntaje}</strong>
                {scoreActual && (
                  <small>
                    <Flecha cambio={e.score!.cambio} />
                  </small>
                )}
              </p>

              <p className={`sim-pastilla sim-pastilla--${tono}`}>
                <IconoVeredicto veredicto={e.veredicto!} tamano={16} /> {e.veredicto_texto}
              </p>
              {dato && <p className="sim-card__dato">{dato}</p>}

              <p className="sim-card__elegir">
                <span className="sim-card__punto" aria-hidden="true" />
                {marcada ? 'Elegida' : 'Elegir'}
              </p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default ComparativaEscenarios
