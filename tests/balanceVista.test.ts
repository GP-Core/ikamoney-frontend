import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { MesBalance } from '../src/types/balance.ts'
import {
  fraseDeMeses, HORIZONTE_DEFECTO, leerHorizonte, mesesEnNegativo, recortarMeses, partesDelMes, momentoDelMes, estadoDelMes, cambioEntreMeses,
  cargaMsi, partesDelAnillo, desgloseDelMes,
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

test('partesDelMes: reparte el ingreso en comprometido, variable y libre', () => {
  const partes = partesDelMes({
    mes: '2026-03', ingresos: 1000, gastos_fijos: 200, gastos_variables: 100, msi: 50, tarjetas: 150, libre: 500,
  })
  assert.deepEqual(partes.map((p) => [p.clave, p.valor, p.inicio, p.ancho, p.delIngreso]), [
    ['comprometido', 400, 0, 40, 40],
    ['variable', 100, 40, 10, 10],
    ['libre', 500, 50, 50, 50],
  ])
})

test('partesDelMes: sin dinero libre la barra no se desborda; sin ingresos no hay porcentaje', () => {
  const partes = partesDelMes({
    mes: '2026-03', ingresos: 0, gastos_fijos: 300, gastos_variables: 100, msi: 0, libre: -400,
  })
  assert.equal(partes.reduce((suma, p) => suma + p.ancho, 0), 100)
  assert.equal(partes[2].valor, 0)
  assert.equal(partes[0].delIngreso, null)
})

test('momentoDelMes: solo los meses posteriores al de hoy son proyección', () => {
  assert.equal(momentoDelMes('2026-11', '2026-11'), 'actual')
  assert.equal(momentoDelMes('2027-01', '2026-11'), 'proyeccion')
})

test('estadoDelMes: mismo tono, palabras distintas si es proyección', () => {
  const casos: [number, string, string][] = [
    [500, 'Vas bien este mes', 'Se ve con margen'],
    [50, 'Te queda poco margen', 'Quedaría poco margen'],
    [-1, 'Este mes te pasas', 'Podría faltarte dinero'],
  ]
  for (const [libre, actual, proyeccion] of casos) {
    assert.equal(estadoDelMes(libre, 1000).texto, actual)
    assert.equal(estadoDelMes(libre, 1000, 'proyeccion').texto, proyeccion)
  }
})

test('cambioEntreMeses: menciona MSI solo si explica el cambio', () => {
  const base = mes('2026-11', 1000)
  const con = (libre: number, msi: number): MesBalance => ({ ...base, libre, msi })
  assert.equal(cambioEntreMeses(con(1000, 1400), con(2400, 0)).motivo, 'msi_termina')
  assert.equal(cambioEntreMeses(con(1000, 0), con(400, 600)).motivo, 'msi_inicia')
  assert.equal(cambioEntreMeses(con(1000, 100), con(5000, 0)).motivo, null)
  assert.equal(cambioEntreMeses(con(1000, 0), con(1200, 0)).libre, 200)
})

const demo: MesBalance = {
  mes: '2026-11', ingresos: 53000, gastos_fijos: 15830, gastos_variables: 8673.33,
  tarjetas: 10592.2, msi: 6100, libre: 11804.47, acumulado: 80184.47,
}

test('cargaMsi: la mensualidad contra el ingreso y cuándo se libera', () => {
  const carga = cargaMsi(demo, [demo, { ...demo, mes: '2026-12' }, { ...demo, mes: '2027-01', msi: 4700 }])
  assert.equal(carga.delIngreso, 11.5)
  assert.equal(carga.arribaDeReferencia, true)
  assert.deepEqual(carga.liberacion, { mes: '2027-01', monto: 1400 })
})

test('cargaMsi: 10 % exacto no está arriba; sin ingresos no hay porcentaje', () => {
  assert.equal(cargaMsi({ ...demo, msi: 5300 }, []).arribaDeReferencia, false)
  assert.equal(cargaMsi({ ...demo, ingresos: 0 }, []).delIngreso, null)
})

test('partesDelAnillo: cinco partes con su porcentaje del ingreso', () => {
  assert.deepEqual(partesDelAnillo(demo).map((p) => [p.clave, p.delIngreso]), [
    ['fijo', 30], ['variable', 16], ['msi', 12], ['tarjetas', 20], ['libre', 22],
  ])
})

test('desgloseDelMes: entra, sale, sobra y de dónde sale el dinero al cierre', () => {
  const d = desgloseDelMes(demo, 68380)
  assert.deepEqual([d.entra, d.sale, d.sobra], [53000, 41195.53, 11804.47])
  assert.deepEqual([d.cierre, d.enCuentas, d.sobranteAcumulado], [80184.47, 68380, 11804.47])
  assert.equal(desgloseDelMes(demo).sobranteAcumulado, null)
})
