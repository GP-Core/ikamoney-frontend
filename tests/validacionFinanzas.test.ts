import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MONTO_MAXIMO, leerNumero, normalizarMonto, validarFecha, validarMonto } from '../src/utils/validacionFinanzas.ts'

test('validarFecha rechaza fechas que no existen', () => {
  assert.equal(validarFecha('2026-03-15', '2026-12-31'), null)
  assert.equal(validarFecha('2024-02-29', '2026-12-31'), null)
  assert.notEqual(validarFecha('2026-02-31', '2026-12-31'), null)
  assert.notEqual(validarFecha('2025-02-29', '2026-12-31'), null)
  assert.notEqual(validarFecha('2026-13-45', '2026-12-31'), null)
  assert.notEqual(validarFecha('0000-00-00', '2026-12-31'), null)
  assert.notEqual(validarFecha('2026-04-31', '2026-12-31'), null)
})

test('validarFecha rechaza vacío, formato raro y futuro', () => {
  assert.notEqual(validarFecha('', '2026-12-31'), null)
  assert.notEqual(validarFecha('15/03/2026', '2026-12-31'), null)
  assert.equal(validarFecha('2027-01-01', '2026-12-31'), 'La fecha no puede ser futura')
})

test('normalizarMonto: las comas solo valen como separador de miles', () => {
  assert.equal(normalizarMonto('$1,234.56'), '1234.56')
  assert.equal(normalizarMonto(' 12,500 '), '12500')
  assert.equal(normalizarMonto('1234'), '1234')
  assert.equal(normalizarMonto('1,2,3'), null)
  assert.equal(normalizarMonto('12,34'), null)
  assert.equal(normalizarMonto(',500'), null)
  assert.equal(normalizarMonto(''), '')
})

test('leerNumero: vacío es null y la coma mal puesta es NaN', () => {
  assert.equal(leerNumero(''), null)
  assert.equal(leerNumero('1,234.5'), 1234.5)
  assert.ok(Number.isNaN(leerNumero('1,2,3')))
  assert.ok(Number.isNaN(leerNumero('abc')))
})

test('validarMonto aplica el tope y los decimales', () => {
  assert.equal(validarMonto('1,234.56'), null)
  assert.equal(validarMonto(String(MONTO_MAXIMO)), null)
  assert.notEqual(validarMonto('10000000000'), null)
  assert.notEqual(validarMonto('1,2,3'), null)
  assert.notEqual(validarMonto('10.123'), null)
  assert.notEqual(validarMonto('0'), null)
  assert.equal(validarMonto('0', { permitirCero: true }), null)
  assert.notEqual(validarMonto('-5'), null)
  assert.notEqual(validarMonto(''), null)
})
