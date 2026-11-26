import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { PlanResponse } from '../src/types/plan.ts'
import { abonosPorDeuda, cuandoAbonar, desplazarMeses, extraAplicable, indiceDeEjemplo, maximoDeslizador, mesesEntre } from '../src/utils/planVista.ts'

const plan = {
  calendario: [
    { mes: 1, periodo: '2026-03', pagos: [{ clave: 'tarjeta-1', pago: 4460, abono_extra: 3000 }, { clave: 'tarjeta-2', pago: 702, abono_extra: 0 }] },
    { mes: 2, periodo: '2026-04', pagos: [{ clave: 'tarjeta-1', pago: 4400, abono_extra: 3000 }, { clave: 'tarjeta-2', pago: 760, abono_extra: 0 }] },
    { mes: 7, periodo: '2026-09', pagos: [{ clave: 'tarjeta-2', pago: 5162, abono_extra: 4400 }] },
  ],
} as unknown as PlanResponse

test('abonosPorDeuda: abono inicial, extra inicial y el máximo del calendario', () => {
  const a = abonosPorDeuda(plan)
  assert.deepEqual(a.get('tarjeta-1'), { inicial: 4460, maximo: 4460, extraInicial: 3000 })
  assert.deepEqual(a.get('tarjeta-2'), { inicial: 702, maximo: 5162, extraInicial: 0 })
  assert.equal(a.get('deuda-9'), undefined)
})

test('mesesEntre cuenta meses entre dos AAAA-MM', () => {
  assert.equal(mesesEntre('2026-03', '2026-11'), 8)
  assert.equal(mesesEntre('2026-11', '2026-03'), -8)
  assert.equal(mesesEntre('2025-12', '2026-02'), 2)
})

test('desplazarMeses corre solo los textos AAAA-MM, a cualquier profundidad', () => {
  const entrada = { periodo: '2026-03', nombre: 'Tarjeta A', saldo: 20000, lista: [{ liquidacion: '2026-10' }, { liquidacion: null }], razon: 'cada 2026-13 no es mes' }
  const salida = desplazarMeses(entrada, 8)
  assert.equal(salida.periodo, '2026-11')
  assert.equal(salida.lista[0].liquidacion, '2027-06')
  assert.equal(salida.lista[1].liquidacion, null)
  assert.equal(salida.nombre, 'Tarjeta A')
  assert.equal(salida.saldo, 20000)
  assert.equal(salida.razon, 'cada 2026-13 no es mes')
  assert.equal(entrada.periodo, '2026-03') // no modifica el original
})

test('indiceDeEjemplo elige el plan de ejemplo más cercano y no se sale del arreglo', () => {
  assert.equal(indiceDeEjemplo(0, 500, 21), 0)
  assert.equal(indiceDeEjemplo(1200, 500, 21), 2)
  assert.equal(indiceDeEjemplo(1300, 500, 21), 3)
  assert.equal(indiceDeEjemplo(999999, 500, 21), 20)
  assert.equal(indiceDeEjemplo(-50, 500, 21), 0)
})

test('el tope del deslizador deja aire sobre el monto sugerido', () => {
  assert.equal(maximoDeslizador(0), 10000)
  assert.equal(maximoDeslizador(3000), 10000)
  assert.equal(maximoDeslizador(11800), 15000)
})

test('el extra aplicable se redondea hacia abajo al paso', () => {
  assert.equal(extraAplicable(11850, 100), 11800)
  assert.equal(extraAplicable(80, 100), 0)
  assert.equal(extraAplicable(-300, 100), 0)
})

test('un solo pago se anuncia como "este mes"', () => {
  assert.equal(cuandoAbonar(1), 'este mes')
  assert.equal(cuandoAbonar(3), 'al mes')
  assert.equal(cuandoAbonar(null), 'al mes')
})
