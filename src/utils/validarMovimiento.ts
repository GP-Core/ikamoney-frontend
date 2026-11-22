import type { ErroresMovimiento, TipoMovimiento, ValoresMovimiento } from '../types/movimiento'
import { todayISO } from './formatDate.ts'
import { MONTO_MAXIMO, leerNumero, validarFecha, validarMonto } from './validacionFinanzas.ts'

/** Convierte el texto del monto en número (ya validado); quita $, comas de miles y espacios. */
export function leerMonto(texto: string): number {
  return leerNumero(texto) ?? Number.NaN
}

/** Devuelve un mensaje por cada campo inválido. Un objeto vacío significa que todo está bien. */
export function validarMovimiento(valores: ValoresMovimiento, tipo: TipoMovimiento): ErroresMovimiento {
  const errores: ErroresMovimiento = {}
  const concepto = valores.concepto.trim()

  if (!concepto) errores.concepto = 'Escribe un concepto.'
  else if (concepto.length < 3) errores.concepto = 'Usa al menos 3 caracteres.'
  else if (concepto.length > 120) errores.concepto = 'Usa máximo 120 caracteres.'

  const errorMonto = validarMonto(valores.monto)
  if (errorMonto) errores.monto = errorMonto
  else if (leerMonto(valores.monto) > MONTO_MAXIMO) errores.monto = 'La cantidad es demasiado grande'

  // Lo que se repite puede empezar en el futuro (por ejemplo, una renta nueva); lo que ocurre una vez, no.
  if (!valores.fecha) errores.fecha = 'Elige una fecha.'
  else {
    const errorFecha = validarFecha(valores.fecha, valores.frecuencia === 'unico' ? todayISO() : '9999-12-31')
    if (errorFecha) errores.fecha = errorFecha
  }

  if (tipo === 'gasto') {
    if (!valores.categoria_id) errores.categoria_id = 'Elige una categoría.'
    if (!valores.clase) errores.clase = 'Indica si es fijo o variable.'
  }
  return errores
}
