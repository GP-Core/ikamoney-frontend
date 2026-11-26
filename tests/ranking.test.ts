import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ETIQUETA_SEMAFORO, nivelDeTasa, separarFueraDelOrden } from '../src/utils/ranking.ts'

test('la etiqueta habla de la tasa de interés', () => {
  assert.equal(ETIQUETA_SEMAFORO[nivelDeTasa(69)], 'Interés muy alto')
  assert.equal(ETIQUETA_SEMAFORO[nivelDeTasa(32)], 'Interés alto')
  assert.equal(ETIQUETA_SEMAFORO[nivelDeTasa(13.9)], 'Interés moderado')
  assert.equal(ETIQUETA_SEMAFORO[nivelDeTasa(0)], 'Interés bajo')
})

test('separa las compras a MSI del resto de lo que no entra al orden', () => {
  const { msi, otras } = separarFueraDelOrden([
    { clave: 'deuda-1', motivo: 'SIN_TASA' },
    { clave: 'msi-1', motivo: 'MSI' },
    { clave: 'msi-2', motivo: 'MSI' },
  ])
  assert.deepEqual(msi.map((i) => i.clave), ['msi-1', 'msi-2'])
  assert.deepEqual(otras.map((i) => i.clave), ['deuda-1'])
})
