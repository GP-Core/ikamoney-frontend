import { useEffect, useState } from 'react'
import type { Movement, MovementType } from '../types/movement'
import { useMovements } from '../hooks/useMovements'
import { formatMoney } from '../utils/formatMoney'
import Modal from '../components/Modal'
import MovementForm from '../components/MovementForm'
import MovementList from '../components/MovementList'
import './MovementsPage.css'

const money = (n: number) => formatMoney(n, 'MXN', 'es-MX')

/** Pantalla de movimientos: resumen, listados de gastos/ingresos y formularios de alta y edición. */
function MovementsPage() {
  const { movements, add, update, remove, loadSample } = useMovements()
  const [tab, setTab] = useState<MovementType>('gasto')
  // null = cerrado; con "movement" es edición, sin él es alta.
  const [form, setForm] = useState<{ movement?: Movement } | null>(null)
  const [toDelete, setToDelete] = useState<Movement | null>(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 2500)
    return () => clearTimeout(timer)
  }, [toast])

  const total = (type: MovementType) =>
    movements.filter((m) => m.type === type).reduce((sum, m) => sum + m.amount, 0)
  const income = total('ingreso')
  const expenses = total('gasto')
  const left = income - expenses
  const label = tab === 'gasto' ? 'gasto' : 'ingreso'
  const shown = movements.filter((m) => m.type === tab)

  function save(data: Omit<Movement, 'id'>) {
    if (form?.movement) update({ ...data, id: form.movement.id })
    else add(data)
    setToast(`${data.type === 'gasto' ? 'Gasto' : 'Ingreso'} ${form?.movement ? 'actualizado' : 'guardado'}`)
    setForm(null)
  }

  function confirmDelete() {
    if (!toDelete) return
    remove(toDelete.id)
    setToast(`${toDelete.type === 'gasto' ? 'Gasto' : 'Ingreso'} eliminado`)
    setToDelete(null)
  }

  return (
    <main className="movements">
      <h1>Movimientos</h1>

      <section className="movements__summary" aria-label="Resumen">
        <p className="movements__eyebrow">Te quedan</p>
        <p className="movements__balance">{money(left)}</p>
        <dl>
          <div>
            <dt>Ingresos</dt>
            <dd>{money(income)}</dd>
          </div>
          <div>
            <dt>Gastos</dt>
            <dd>{money(expenses)}</dd>
          </div>
        </dl>
        {movements.length > 0 && left < 0 && (
          <p className="movements__warn" role="status">
            ⚠ Estás gastando más de lo que ingresas.
          </p>
        )}
      </section>

      <div className="movements__tabs" role="tablist" aria-label="Tipo de movimiento">
        {(['gasto', 'ingreso'] as const).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
            {t === 'gasto' ? 'Gastos' : 'Ingresos'} ({movements.filter((m) => m.type === t).length})
          </button>
        ))}
      </div>

      <MovementList
        type={tab}
        movements={shown}
        noData={movements.length === 0}
        onEdit={(movement) => setForm({ movement })}
        onDelete={setToDelete}
        onLoadSample={loadSample}
      />

      <div className="movements__bar">
        <button type="button" className="btn btn--primary" onClick={() => setForm({})}>
          + Agregar {label}
        </button>
      </div>

      <Modal
        open={form !== null}
        title={`${form?.movement ? 'Editar' : 'Nuevo'} ${label}`}
        onClose={() => setForm(null)}
      >
        <MovementForm type={tab} initial={form?.movement} onSubmit={save} onCancel={() => setForm(null)} />
      </Modal>

      <Modal open={toDelete !== null} title="¿Eliminar este movimiento?" onClose={() => setToDelete(null)}>
        <p>
          {toDelete?.concept} · {toDelete && money(toDelete.amount)}. Esta acción no se puede deshacer.
        </p>
        <div className="movements__confirm">
          <button type="button" className="btn btn--ghost" onClick={() => setToDelete(null)}>
            Cancelar
          </button>
          <button type="button" className="btn btn--danger" onClick={confirmDelete}>
            Eliminar
          </button>
        </div>
      </Modal>

      {toast && (
        <div className="movements__toast" role="status">
          {toast}
        </div>
      )}
    </main>
  )
}

export default MovementsPage
