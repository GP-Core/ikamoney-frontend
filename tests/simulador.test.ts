import assert from 'node:assert/strict'
import { test } from 'node:test'
import { prioridadVecina } from '../src/utils/prioridad.ts'

test('las flechas avanzan y retroceden por alta, media y baja', () => {
  assert.equal(prioridadVecina('alta', 'ArrowRight'), 'media')
  assert.equal(prioridadVecina('media', 'ArrowDown'), 'baja')
  assert.equal(prioridadVecina('baja', 'ArrowLeft'), 'media')
  assert.equal(prioridadVecina('media', 'ArrowUp'), 'alta')
})

test('las flechas dan la vuelta en los extremos', () => {
  assert.equal(prioridadVecina('baja', 'ArrowRight'), 'alta')
  assert.equal(prioridadVecina('alta', 'ArrowLeft'), 'baja')
})

test('Inicio y Fin van al primero y al último', () => {
  assert.equal(prioridadVecina('media', 'Home'), 'alta')
  assert.equal(prioridadVecina('media', 'End'), 'baja')
})

test('otras teclas no cambian nada', () => {
  assert.equal(prioridadVecina('media', 'Tab'), null)
  assert.equal(prioridadVecina('media', 'a'), null)
})
