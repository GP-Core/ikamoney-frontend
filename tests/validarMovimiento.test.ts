import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { ValoresMovimiento } from '../src/types/movimiento.ts'
import { leerMonto, validarMovimiento } from '../src/utils/validarMovimiento.ts'

function valores(extra: Partial<ValoresMovimiento> = {}): ValoresMovimiento {
  return {
    concepto: 'Renta',
    monto: '1,500.50',
    frecuencia: 'mensual',
    fecha: '2026-03-01',
    categoria_id: '',
    clase: '',
    ...extra,
  }
}

test('un ingreso válido no tiene errores', () => {
  assert.deepEqual(validarMovimiento(valores(), 'ingreso'), {})
})

test('concepto de 3 a 120 caracteres', () => {
  assert.ok(validarMovimiento(valores({ concepto: 'ab' }), 'ingreso').concepto)
  assert.equal(validarMovimiento(valores({ concepto: 'a'.repeat(120) }), 'ingreso').concepto, undefined)
  assert.ok(validarMovimiento(valores({ concepto: 'a'.repeat(121) }), 'ingreso').concepto)
})

test('monto: comas de miles, tope y decimales', () => {
  assert.ok(validarMovimiento(valores({ monto: '1,2,3' }), 'ingreso').monto)
  assert.ok(validarMovimiento(valores({ monto: '10000000000' }), 'ingreso').monto)
  assert.equal(validarMovimiento(valores({ monto: '9999999999.99' }), 'ingreso').monto, undefined)
  assert.ok(validarMovimiento(valores({ monto: '1.234' }), 'ingreso').monto)
  assert.ok(validarMovimiento(valores({ monto: '0' }), 'ingreso').monto)
  assert.ok(validarMovimiento(valores({ monto: '' }), 'ingreso').monto)
})

test('fecha: no existe, o es futura solo si es única', () => {
  assert.ok(validarMovimiento(valores({ fecha: '2026-02-31' }), 'ingreso').fecha)
  assert.equal(validarMovimiento(valores({ fecha: '2999-01-01' }), 'ingreso').fecha, undefined)
  assert.ok(validarMovimiento(valores({ fecha: '2999-01-01', frecuencia: 'unico' }), 'ingreso').fecha)
})

test('un gasto exige categoría y clase', () => {
  const e = validarMovimiento(valores(), 'gasto')
  assert.ok(e.categoria_id)
  assert.ok(e.clase)
})

test('leerMonto quita $ y comas de miles', () => {
  assert.equal(leerMonto('$1,234.50'), 1234.5)
})
