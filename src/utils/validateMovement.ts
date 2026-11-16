import type { MovementFormErrors, MovementFormValues, MovementType } from '../types/movement'
import { todayISO } from './formatDate'

/** Convierte el texto del monto en número; quita $, comas y espacios. */
export function parseAmount(text: string): number {
  return Number(text.replace(/[$,\s]/g, ''))
}

/** Devuelve un mensaje por cada campo inválido. Un objeto vacío significa que todo está bien. */
export function validateMovement(values: MovementFormValues, type: MovementType): MovementFormErrors {
  const errors: MovementFormErrors = {}
  const concept = values.concept.trim()
  const raw = values.amount.replace(/[$,\s]/g, '')

  if (!concept) errors.concept = 'Escribe un concepto.'
  else if (concept.length < 3) errors.concept = 'Usa al menos 3 caracteres.'

  if (!raw) errors.amount = 'Escribe el monto.'
  else if (!/^\d+(\.\d*)?$/.test(raw)) errors.amount = 'Escribe solo números, por ejemplo 1500.50.'
  else if (/\.\d{3,}/.test(raw)) errors.amount = 'Usa máximo 2 decimales.'
  else if (Number(raw) <= 0) errors.amount = 'El monto debe ser mayor a $0.'
  else if (Number(raw) > 9_999_999) errors.amount = 'El monto máximo es $9,999,999.'

  if (!values.date) errors.date = 'Elige una fecha.'
  else if (values.date > todayISO()) errors.date = 'La fecha no puede ser futura.'

  if (type === 'gasto') {
    if (!values.category) errors.category = 'Elige una categoría.'
    if (!values.kind) errors.kind = 'Indica si es fijo o variable.'
  }
  return errors
}
