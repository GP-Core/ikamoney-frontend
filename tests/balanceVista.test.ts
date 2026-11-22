import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { MesBalance } from '../src/types/balance.ts'
import {
  fraseDeMeses, HORIZONTE_DEFECTO, leerHorizonte, mesesEnNegativo, recortarMeses,
} from '../src/utils/balanceVista.ts'

const mes = (periodo: string, libre: number): MesBalance => ({
  mes: periodo, ingresos: 0, gastos_fijos: 0, gastos_variables: 0, msi: 0, libre,
})
const doce = Array.from({ length: 12 }, (_, i) => mes(`2026-${String(i + 1).padStart(2, '0')}`, 100))

test('horizonte: 6 por defecto y solo 3, 6 o 12', () => {
  assert.equal(HORIZONTE_DEFECTO, 6)
  assert.equal(leerHorizonte(null), 6)
  assert.equal(leerHorizonte(''), 6)
  assert.equal(leerHorizonte('abc'), 6)
  assert.equal(leerHorizonte('7'), 6)
  assert.equal(leerHorizonte('3'), 3)
  assert.equal(leerHorizonte('12'), 12)
})

test('recortar: los primeros N meses, aunque haya menos', () => {
  assert.equal(recortarMeses(doce, 3).length, 3)
  assert.equal(recortarMeses(doce, 12).length, 12)
  assert.equal(recortarMeses(doce.slice(0, 4), 12).length, 4)
  assert.equal(recortarMeses(doce, 6)[0].mes, '2026-01')
  assert.deepEqual(recortarMeses(doce, 0), [])
})

test('meses en negativo: solo los que tienen libre menor a cero', () => {
  const meses = [mes('2026-03', 500), mes('2026-04', -1), mes('2026-05', 0), mes('2026-06', -300)]
  assert.deepEqual(mesesEnNegativo(meses).map((m) => m.mes), ['2026-04', '2026-06'])
})

test('frase: sin meses negativos', () => {
  assert.equal(fraseDeMeses(doce.slice(0, 6)), 'Todos tus meses cierran con dinero libre.')
})

test('frase: nombra los meses en que falta dinero', () => {
  const uno = [mes('2026-03', 10), mes('2026-04', -5), mes('2026-05', 10)]
  assert.equal(fraseDeMeses(uno), 'En 1 de tus próximos 3 meses te faltaría dinero: abril.')
  const dos = [mes('2026-03', 10), mes('2026-04', -5), mes('2026-05', -1), mes('2026-06', 10)]
  assert.equal(fraseDeMeses(dos), 'En 2 de tus próximos 4 meses te faltaría dinero: abril y mayo.')
  const tres = [mes('2026-04', -1), mes('2026-05', -1), mes('2026-06', -1)]
  assert.equal(fraseDeMeses(tres), 'En 3 de tus próximos 3 meses te faltaría dinero: abril, mayo y junio.')
})
