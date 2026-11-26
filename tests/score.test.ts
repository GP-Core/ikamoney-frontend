import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { FactorScore } from '../src/types/score.ts'
import { calificacionDe, consejoDe, factorPrioritario, maximoPosible, ordenarFactores, resumenFactores } from '../src/utils/score.ts'

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

function factor(clave: FactorScore['clave'], subpuntaje: number, perdidos: number, valor: number | null = null): FactorScore {
  return { clave, disponible: true, subpuntaje, puntos_perdidos: perdidos, aporte: 0, valor, como_mejorar: 'Consejo del motor' } as FactorScore
}

const demo = [
  factor('relacion_deuda_ingreso', 92.53, 2.24, 31.49),
  factor('utilizacion_credito', 80.8, 4.8, 29.2),
  factor('flujo_libre', 100, 0, 22.27),
  factor('carga_msi', 69, 3.1, 14),
  factor('comportamiento_pago', 20, 8),
]
const orden = ['comportamiento_pago', 'utilizacion_credito', 'carga_msi', 'relacion_deuda_ingreso'] as FactorScore['clave'][]

test('califica cada factor y el comportamiento de pago queda como supuesto', () => {
  assert.deepEqual(demo.map((f) => calificacionDe(f)), ['bien', 'bien', 'bien', 'mejorar', 'supuesto'])
  assert.equal(calificacionDe(factor('flujo_libre', 30, 17)), 'baja')
  assert.equal(resumenFactores(demo), '3 bien · 1 puede mejorar · 1 supuesto')
})

test('un supuesto no es la recomendación y va al final de la lista', () => {
  assert.equal(factorPrioritario(demo, orden)?.clave, 'utilizacion_credito')
  assert.equal(ordenarFactores(demo, orden).at(-1)?.clave, 'comportamiento_pago')
})

test('no pide bajar la utilización de 30 % a quien ya está por debajo', () => {
  assert.match(consejoDe(demo[1]), /Ya usas menos del 30 %.*hasta 4\.8 puntos/)
  assert.equal(consejoDe(factor('utilizacion_credito', 40, 15, 50)), 'Consejo del motor')
})

test('con pagos registrados el comportamiento se califica y puede recomendarse', () => {
  assert.equal(calificacionDe(demo[4], false), 'baja')
  assert.equal(factorPrioritario(demo, orden, false)?.clave, 'comportamiento_pago')
  assert.equal(resumenFactores(demo, false), '3 bien · 1 puede mejorar · 1 te baja')
})
