import type { PosicionRanking } from '../types/ranking'
import { pesos } from '../utils/pesos'
import { ETIQUETA_SEMAFORO, nivelDeTasa, numero } from '../utils/ranking'
import { sinCodigosInternos } from '../utils/texto'
import AyudaTermino from './AyudaTermino'
import BotonPagar from './BotonPagar'
import IconoSemaforo from './IconoSemaforo'
import './Desplegable.css'
import './Ranking.css'
import './Semaforo.css'

interface DeudaRankingProps {
  deuda: PosicionRanking
  /** La primera es la acción que el usuario debe tomar. */
  destacada?: boolean
  /** Se registró un pago: hay que volver a calcular el orden. */
  onPagado: () => void
}

/** Qué hacer con esta deuda este mes. En préstamos no hay "mínimo", sino su pago mensual. */
function Accion({ deuda }: { deuda: PosicionRanking }) {
  const monto = deuda.pago_minimo
  const esTarjeta = deuda.tipo === 'tarjeta'

  if (deuda.accion === 'abonar_extra') {
    return (
      <>
        {esTarjeta ? (
          <>
            Paga el <AyudaTermino termino="pagoMinimo">mínimo</AyudaTermino>
          </>
        ) : (
          'Paga su mensualidad'
        )}
        {monto !== null && ` (${pesos(monto)})`} y abona aquí todo tu dinero extra
      </>
    )
  }
  if (monto === null) return <>Sigue con su pago normal</>
  return <>{esTarjeta ? 'Paga solo el mínimo' : 'Sigue con tu pago mensual'}: {pesos(monto)}</>
}

/** Una deuda en su posición, con sus cifras y la razón que da el motor. No decide ni cambia el orden. */
function DeudaRanking({ deuda, destacada = false, onPagado }: DeudaRankingProps) {
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
        <Accion deuda={deuda} />
      </p>

      <dl className="deuda__cifras">
        <div>
          <dt>Saldo</dt>
          <dd>{pesos(deuda.saldo)}</dd>
        </div>
        <div>
          <dt>
            <AyudaTermino termino="tasaAnual">Tasa anual</AyudaTermino>
          </dt>
          <dd>{numero(deuda.tasa_anual)} %</dd>
        </div>
        <div>
          <dt>Intereses al mes</dt>
          <dd>{pesos(deuda.interes_mes)}</dd>
        </div>
      </dl>

      {utilizacion !== null && (
        <div className="deuda__uso">
          <p>
            <AyudaTermino termino="usoLimite">Uso del límite</AyudaTermino>: <strong>{numero(utilizacion)} %</strong>
            {sobreLimite && ', por encima de tu límite'}
          </p>
          <div className="deuda__barra" aria-hidden="true">
            <span style={{ width: `${Math.min(utilizacion, 100)}%` }} />
          </div>
        </div>
      )}

      {deuda.avisos.map((aviso) => (
        <p key={aviso.codigo} className="deuda__aviso">
          {aviso.mensaje}
        </p>
      ))}

      <div className="deuda__pagar">
        <BotonPagar
          destino={{ tipo: deuda.tipo, id: deuda.id, nombre: deuda.nombre, minimo: deuda.pago_minimo }}
          texto={destacada ? 'Pagar o abonar extra' : 'Pagar'}
          onPagado={onPagado}
        />
      </div>

      <details className="desplegable">
        <summary>¿Por qué va en este lugar?</summary>
        <p>{sinCodigosInternos(deuda.razon)}</p>
      </details>
    </li>
  )
}

export default DeudaRanking
