import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { EXPENSE_CATEGORIES } from '../types/movement'
import type {
  ExpenseKind,
  Movement,
  MovementFormErrors,
  MovementFormValues,
  MovementType,
} from '../types/movement'
import { todayISO } from '../utils/formatDate'
import { parseAmount, validateMovement } from '../utils/validateMovement'
import './MovementForm.css'

interface MovementFormProps {
  type: MovementType
  /** Si viene un movimiento, el formulario es de edición. */
  initial?: Movement
  onSubmit: (data: Omit<Movement, 'id'>) => void
  onCancel: () => void
}

type FieldName = keyof MovementFormValues

/** Formulario de alta/edición de ingreso o gasto, con validaciones. */
function MovementForm({ type, initial, onSubmit, onCancel }: MovementFormProps) {
  const isExpense = type === 'gasto'
  const formRef = useRef<HTMLFormElement>(null)
  const [values, setValues] = useState<MovementFormValues>({
    concept: initial?.concept ?? '',
    amount: initial ? String(initial.amount) : '',
    date: initial?.date ?? todayISO(),
    category: initial?.category ?? '',
    kind: initial?.kind ?? '',
  })
  const [errors, setErrors] = useState<MovementFormErrors>({})

  // Revisa un solo campo (al salir de él o mientras se corrige).
  function checkField(name: FieldName, next: MovementFormValues = values) {
    const message = validateMovement(next, type)[name]
    setErrors((prev) => ({ ...prev, [name]: message }))
  }

  function change(name: FieldName, value: string) {
    const next = { ...values, [name]: value } as MovementFormValues
    setValues(next)
    if (errors[name]) checkField(name, next)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const found = validateMovement(values, type)
    setErrors(found)
    const first = (Object.keys(found) as FieldName[])[0]
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
      return
    }
    onSubmit({
      type,
      concept: values.concept.trim(),
      amount: Math.round(parseAmount(values.amount) * 100) / 100,
      date: values.date,
      category: isExpense ? values.category : '',
      kind: isExpense ? (values.kind as ExpenseKind) : null,
    })
  }

  // Props comunes de cada campo de texto.
  const field = (name: FieldName) => ({
    id: `mf-${name}`,
    name,
    value: values[name],
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? `mf-${name}-error` : undefined,
    onChange: (e: { target: { value: string } }) => change(name, e.target.value),
    onBlur: () => checkField(name),
  })

  const error = (name: FieldName) =>
    errors[name] && (
      <p className="mform__error" id={`mf-${name}-error`} role="alert">
        <span aria-hidden="true">⚠</span> {errors[name]}
      </p>
    )

  return (
    <form ref={formRef} className="mform" onSubmit={handleSubmit} noValidate>
      <div className="mform__field">
        <label htmlFor="mf-concept">Concepto</label>
        <input {...field('concept')} maxLength={60} autoComplete="off" placeholder="Ej. Renta, Sueldo, Súper" />
        {error('concept')}
      </div>

      <div className="mform__field">
        <label htmlFor="mf-amount">Monto (MXN)</label>
        <input {...field('amount')} inputMode="decimal" autoComplete="off" placeholder="$0.00" />
        {error('amount')}
      </div>

      <div className="mform__field">
        <label htmlFor="mf-date">Fecha</label>
        <input {...field('date')} type="date" max={todayISO()} />
        {error('date')}
      </div>

      {isExpense && (
        <>
          <div className="mform__field">
            <label htmlFor="mf-category">Categoría</label>
            <select {...field('category')}>
              <option value="">Elige una categoría</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            {error('category')}
          </div>

          <fieldset className="mform__field">
            <legend>¿Es fijo o variable?</legend>
            <div className="mform__radios">
              {(
                [
                  ['fijo', 'Fijo', 'Se repite igual cada mes'],
                  ['variable', 'Variable', 'Cambia de monto'],
                ] as const
              ).map(([value, label, hint]) => (
                <label key={value} className="mform__radio">
                  <input
                    type="radio"
                    name="kind"
                    value={value}
                    checked={values.kind === value}
                    aria-invalid={Boolean(errors.kind)}
                    onChange={() => {
                      change('kind', value)
                      setErrors((prev) => ({ ...prev, kind: undefined }))
                    }}
                  />
                  <span>
                    <strong>{label}</strong>
                    <small>{hint}</small>
                  </span>
                </label>
              ))}
            </div>
            {error('kind')}
          </fieldset>
        </>
      )}

      <div className="mform__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn btn--primary">
          Guardar
        </button>
      </div>
    </form>
  )
}

export default MovementForm
