import type { Movement, MovementType } from '../types/movement'
import { formatDate } from '../utils/formatDate'
import { formatMoney } from '../utils/formatMoney'
import './MovementList.css'

interface MovementListProps {
  type: MovementType
  movements: Movement[]
  /** true cuando el usuario no ha capturado nada de ningún tipo. */
  noData: boolean
  onEdit: (movement: Movement) => void
  onDelete: (movement: Movement) => void
  onLoadSample: () => void
}

const money = (n: number) => formatMoney(n, 'MXN', 'es-MX')

/** Listado de ingresos o gastos con editar y eliminar; muestra el estado vacío si no hay nada. */
function MovementList({ type, movements, noData, onEdit, onDelete, onLoadSample }: MovementListProps) {
  const isExpense = type === 'gasto'

  if (movements.length === 0) {
    return (
      <div className="empty">
        <div className="empty__icon" aria-hidden="true">
          $
        </div>
        <h2>{isExpense ? 'Aún no has capturado gastos' : 'Aún no has capturado ingresos'}</h2>
        <p>
          {isExpense
            ? 'Registra tus gastos fijos y variables para saber cuánto dinero te queda cada mes.'
            : 'Registra tu sueldo y otros ingresos para empezar a ver tu panorama.'}
        </p>
        {noData && (
          <button type="button" className="empty__link" onClick={onLoadSample}>
            Ver con datos de ejemplo
          </button>
        )}
      </div>
    )
  }

  const sorted = [...movements].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <ul className="mlist">
      {sorted.map((m) => (
        <li key={m.id} className="mlist__item">
          <div className="mlist__row">
            <div>
              <p className="mlist__name">{m.concept}</p>
              <p className="mlist__meta">
                {formatDate(m.date)}
                {m.category && ` · ${m.category}`}
              </p>
            </div>
            <p className={`mlist__amount mlist__amount--${m.type}`}>
              {isExpense ? '−' : '+'}
              {money(m.amount)}
            </p>
          </div>
          <div className="mlist__row mlist__row--foot">
            {m.kind && <span className={`mlist__badge mlist__badge--${m.kind}`}>{m.kind === 'fijo' ? 'Fijo' : 'Variable'}</span>}
            <div className="mlist__actions">
              <button type="button" onClick={() => onEdit(m)} aria-label={`Editar ${m.concept}`}>
                Editar
              </button>
              <button type="button" className="mlist__delete" onClick={() => onDelete(m)} aria-label={`Eliminar ${m.concept}`}>
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
