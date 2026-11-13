import type { DeudaRanking as Deuda } from '../types/ranking'
import { dinero, ETIQUETA_SEMAFORO, explicarPosicion, nivelDeTasa } from '../utils/ranking'
import IconoSemaforo from './IconoSemaforo'
import './Ranking.css'

interface DeudaRankingProps {
  deuda: Deuda
  /** Cuántas deudas hay en total, para redactar la explicación. */
  total: number
  /** La primera es la acción que el usuario debe tomar. */
  destacada?: boolean
}

function numero(valor: number): string {
  return String(Math.round(valor * 10) / 10)
}

/** Una deuda en su posición, con sus cifras y por qué va ahí. No decide ni cambia el orden. */
function DeudaRanking({ deuda, total, destacada = false }: DeudaRankingProps) {
  const nivel = nivelDeTasa(deuda.tasa_anual)
  const sobreLimite = deuda.utilizacion !== null && deuda.utilizacion > 100

  return (
    <li className={`deuda deuda--${nivel}${destacada ? ' deuda--primera' : ''}`}>
      <div className="deuda__cabeza">
        <span className="deuda__posicion" aria-label={`Posición ${deuda.posicion}`}>
          {deuda.posicion}
        </span>
        <h3 className="deuda__nombre">{deuda.nombre}</h3>
        <span className={`semaforo semaforo--${nivel}`}>
          <IconoSemaforo nivel={nivel} />
          {ETIQUETA_SEMAFORO[nivel]}
        </span>
      </div>

      <p className="deuda__explicacion">{explicarPosicion(deuda, total)}</p>

      <dl className="deuda__cifras">
        <div>
          <dt>Saldo</dt>
          <dd>{dinero(deuda.saldo)}</dd>
        </div>
        <div>
          <dt>Tasa anual</dt>
          <dd>{numero(deuda.tasa_anual)} %</dd>
        </div>
        <div>
          <dt>Intereses al mes</dt>
          <dd>{dinero(deuda.interes_mensual)}</dd>
        </div>
        {deuda.utilizacion !== null && (
          <div>
            <dt>Límite usado</dt>
            <dd>{numero(deuda.utilizacion)} %</dd>
          </div>
        )}
      </dl>

      {deuda.utilizacion !== null && (
        <div
          className="deuda__barra"
          role="img"
          aria-label={`Usas el ${numero(deuda.utilizacion)} % del límite${sobreLimite ? ', por encima de tu límite' : ''}`}
        >
          <span style={{ width: `${Math.min(deuda.utilizacion, 100)}%` }} />
        </div>
      )}
      {sobreLimite && <p className="deuda__aviso">Tu saldo supera el límite de esta tarjeta.</p>}
    </li>
  )
}

export default DeudaRanking
