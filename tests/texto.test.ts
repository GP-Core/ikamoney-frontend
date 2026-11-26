import assert from 'node:assert/strict'
import { test } from 'node:test'
import { iniciales, sinCodigosInternos } from '../src/utils/texto.ts'

test('iniciales toma hasta dos palabras y tolera espacios', () => {
  assert.equal(iniciales('Usuario Demo'), 'UD')
  assert.equal(iniciales('Ana'), 'A')
  assert.equal(iniciales('  ana  maría  lópez '), 'AM')
  assert.equal(iniciales(''), '')
})

test('quita los códigos internos de los textos del backend', () => {
  assert.equal(
    sinCodigosInternos('El orden sigue el método avalancha de T25 (Fórmula 9): primero la tasa.'),
    'El orden sigue el método avalancha: primero la tasa.',
  )
  assert.equal(sinCodigosInternos('Así que no entra al orden (RN-19).'), 'Así que no entra al orden.')
  assert.equal(sinCodigosInternos('Cuesta $1,000 (con 16 % de IVA).'), 'Cuesta $1,000 (con 16 % de IVA).')
})

test('quita los códigos de las fórmulas y justificaciones del score', () => {
  assert.equal(sinCodigosInternos('F12: saldos / límites × 100'), 'saldos / límites × 100')
  assert.equal(sinCodigosInternos('Es lo recomendado (T24). Se reparte (regla 3 de T25).'), 'Es lo recomendado. Se reparte.')
  assert.equal(sinCodigosInternos('Pagas solo el mínimo (supuesto de T25), porque sí.'), 'Pagas solo el mínimo, porque sí.')
  assert.equal(sinCodigosInternos('El flujo del mes (Fórmula 3 de T33).'), 'El flujo del mes.')
})
