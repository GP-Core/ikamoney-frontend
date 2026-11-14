import type { PosicionRanking } from '../types/ranking'
import { dinero, ETIQUETA_SEMAFORO, nivelDeTasa, numero } from '../utils/ranking'
import IconoSemaforo from './IconoSemaforo'
import './Ranking.css'

interface DeudaRankingProps {
  deuda: PosicionRanking
  /** La primera es la acción que el usuario debe tomar. */
  destacada?: boolean
}

/** Una deuda en su posición, con sus cifras y la razón que da el motor. No decide ni cambia el orden. */
function DeudaRanking({ deuda, destacada = false }: DeudaRankingProps) {
  const nivel = nivelDeTasa(deuda.tasa_anual)
  const utilizacion = deuda.utilizacion
  const sobreLimite = utilizacion !== null && utilizacion > 100

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

      <p className="deuda__accion">
        {deuda.accion === 'abonar_extra'
          ? 'Abona todo el dinero extra que puedas'
          : deuda.pago_minimo !== null
            ? `Paga solo el mínimo: ${dinero(deuda.pago_minimo)}`
            : 'Paga solo el mínimo'}
      </p>

      <p className="deuda__explicacion">{deuda.razon}</p>

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
          <dd>{dinero(deuda.interes_mes)}</dd>
        </div>
        {utilizacion !== null && (
          <div>
            <dt>Límite usado</dt>
            <dd>{numero(utilizacion)} %</dd>
          </div>
        )}
      </dl>

      {utilizacion !== null && (
        <div
          className="deuda__barra"
          role="img"
          aria-label={`Usas el ${numero(utilizacion)} % del límite${sobreLimite ? ', por encima de tu límite' : ''}`}
        >
          <span style={{ width: `${Math.min(utilizacion, 100)}%` }} />
        </div>
      )}

      {deuda.avisos.map((aviso) => (
        <p key={aviso.codigo} className="deuda__aviso">
          {aviso.mensaje}
        </p>
      ))}
    </li>
  )
}

export default DeudaRanking
