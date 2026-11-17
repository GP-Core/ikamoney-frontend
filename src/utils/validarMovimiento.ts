import type { ErroresMovimiento, TipoMovimiento, ValoresMovimiento } from '../types/movimiento'
import { todayISO } from './formatDate'

/** Convierte el texto del monto en número; quita $, comas y espacios. */
export function leerMonto(texto: string): number {
  return Number(texto.replace(/[$,\s]/g, ''))
}

/** Devuelve un mensaje por cada campo inválido. Un objeto vacío significa que todo está bien. */
export function validarMovimiento(valores: ValoresMovimiento, tipo: TipoMovimiento): ErroresMovimiento {
  const errores: ErroresMovimiento = {}
  const concepto = valores.concepto.trim()
  const crudo = valores.monto.replace(/[$,\s]/g, '')

  if (!concepto) errores.concepto = 'Escribe un concepto.'
  else if (concepto.length < 3) errores.concepto = 'Usa al menos 3 caracteres.'

  if (!crudo) errores.monto = 'Escribe el monto.'
  else if (!/^\d+(\.\d*)?$/.test(crudo)) errores.monto = 'Escribe solo números, por ejemplo 1500.50.'
  else if (/\.\d{3,}/.test(crudo)) errores.monto = 'Usa máximo 2 decimales.'
  else if (Number(crudo) <= 0) errores.monto = 'El monto debe ser mayor a $0.'
  else if (Number(crudo) > 9_999_999) errores.monto = 'El monto máximo es $9,999,999.'

  // Lo que se repite puede empezar en el futuro (por ejemplo, una renta nueva); lo que ocurre una vez, no.
  if (!valores.fecha) errores.fecha = 'Elige una fecha.'
  else if (valores.frecuencia === 'unico' && valores.fecha > todayISO()) errores.fecha = 'La fecha no puede ser futura.'

  if (tipo === 'gasto') {
    if (!valores.categoria_id) errores.categoria_id = 'Elige una categoría.'
    if (!valores.clase) errores.clase = 'Indica si es fijo o variable.'
  }
  return errores
}
