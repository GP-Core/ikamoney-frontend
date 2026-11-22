import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { FactorScore } from '../src/types/score.ts'
import { maximoPosible } from '../src/utils/score.ts'

function pago(parcial: Partial<FactorScore>): FactorScore {
  return {
    clave: 'comportamiento_pago',
    disponible: true,
    puntos_perdidos: 8,
    ...parcial,
  } as FactorScore
}

const otro = { clave: 'flujo_libre', disponible: true, puntos_perdidos: 0 } as FactorScore

test('con "solo mínimo" el score no pasa de 92', () => {
  assert.equal(maximoPosible([otro, pago({})]), 92)
})

test('sin puntos perdidos en el comportamiento de pago no hay máximo que avisar', () => {
  assert.equal(maximoPosible([otro, pago({ puntos_perdidos: 0 })]), null)
})

test('sin el factor, o si está omitido, no hay máximo', () => {
  assert.equal(maximoPosible([otro]), null)
  assert.equal(maximoPosible([pago({ disponible: false })]), null)
})
