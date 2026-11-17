import type { Frecuencia, MovimientoDelMes, TipoMovimiento } from '../types/movimiento'
import { formatDate } from '../utils/formatDate'
import { formatMoney } from '../utils/formatMoney'
import './MovementList.css'

interface MovementListProps {
  tipo: TipoMovimiento
  movimientos: MovimientoDelMes[]
  /** Sin conexión no se edita ni se elimina (T60). */
  soloLectura: boolean
  onEditar: (movimiento: MovimientoDelMes) => void
  onEliminar: (movimiento: MovimientoDelMes) => void
}

const dinero = (n: number) => formatMoney(n, 'MXN', 'es-MX')

const TEXTO_FRECUENCIA: Record<Frecuencia, string | null> = {
  unico: null,
  semanal: 'Cada semana',
  quincenal: 'Cada quincena',
  mensual: 'Cada mes',
}

/** Listado de ingresos o gastos del mes con editar y eliminar; muestra el estado vacío si no hay nada. */
function MovementList({ tipo, movimientos, soloLectura, onEditar, onEliminar }: MovementListProps) {
  const esGasto = tipo === 'gasto'

  if (movimientos.length === 0) {
    return (
      <div className="empty">
        <div className="empty__icon" aria-hidden="true">
          $
        </div>
        <h2>{esGasto ? 'No hay gastos en este mes' : 'No hay ingresos en este mes'}</h2>
        <p>
          {esGasto
            ? 'Registra tus gastos fijos y variables para saber cuánto dinero te queda cada mes.'
            : 'Registra tu sueldo y otros ingresos para empezar a ver tu panorama.'}
        </p>
      </div>
    )
  }

  const ordenados = [...movimientos].sort((a, b) => b.fecha_ocurrencia.localeCompare(a.fecha_ocurrencia))

  return (
    <ul className="mlist">
      {/* Un movimiento recurrente sale varias veces en el mes con el mismo id: la fecha completa la llave. */}
      {ordenados.map((m) => (
        <li key={`${m.id}-${m.fecha_ocurrencia}`} className="mlist__item">
          <div className="mlist__row">
            <div>
              <p className="mlist__name">{m.concepto}</p>
              <p className="mlist__meta">
                {formatDate(m.fecha_ocurrencia)}
                {m.categoria && ` · ${m.categoria}`}
                {TEXTO_FRECUENCIA[m.frecuencia] && ` · ${TEXTO_FRECUENCIA[m.frecuencia]}`}
              </p>
            </div>
            <p className={`mlist__amount mlist__amount--${m.tipo}`}>
              {esGasto ? '−' : '+'}
              {dinero(m.monto)}
            </p>
          </div>
          <div className="mlist__row mlist__row--foot">
            {m.clase && (
              <span className={`mlist__badge mlist__badge--${m.clase}`}>{m.clase === 'fijo' ? 'Fijo' : 'Variable'}</span>
            )}
            <div className="mlist__actions">
              <button type="button" disabled={soloLectura} onClick={() => onEditar(m)} aria-label={`Editar ${m.concepto}`}>
                Editar
              </button>
              <button
                type="button"
                className="mlist__delete"
                disabled={soloLectura}
                onClick={() => onEliminar(m)}
                aria-label={`Eliminar ${m.concepto}`}
              >
                Eliminar
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

export default MovementList
