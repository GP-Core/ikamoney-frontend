import assert from 'node:assert/strict'
import test from 'node:test'
import {
  aPayload, cupoTrasLectura, estadoInicial, fechaCortePropuesta, puedeLeerConIa, reducer, textoCupo,
} from '../src/utils/revisionEstado.ts'

const cupo = (usados: number) => ({ limite: 5, usados, restantes: 5 - usados })

test('cupo: sin dato se deja intentar y no hay texto', () => {
  assert.equal(puedeLeerConIa(null), true)
  assert.equal(textoCupo(null), null)
})

test('cupo: texto en singular y plural', () => {
  assert.equal(textoCupo(cupo(0)), 'Te quedan 5 de 5 lecturas automáticas gratis.')
  assert.equal(textoCupo(cupo(4)), 'Te queda 1 de 5 lecturas automáticas gratis.')
})

test('cupo: agotado bloquea la lectura y manda a la captura manual', () => {
  assert.equal(puedeLeerConIa(cupo(5)), false)
  assert.match(textoCupo(cupo(5)) ?? '', /capturar los datos a mano/)
})

test('cupo: tras una lectura resta uno y no baja de cero', () => {
  assert.deepEqual(cupoTrasLectura(cupo(2)), cupo(3))
  assert.deepEqual(cupoTrasLectura(cupo(5)), cupo(5))
  assert.equal(cupoTrasLectura(null), null)
})

// ---------- Fecha de corte y payload de confirmación ----------

test('fecha de corte: el último corte que ya pasó', () => {
  const hoy = new Date(2026, 2, 15) // 15-mar-2026
  assert.equal(fechaCortePropuesta(10, hoy), '2026-03-10')
  assert.equal(fechaCortePropuesta(15, hoy), '2026-03-15') // hoy cuenta
  assert.equal(fechaCortePropuesta(20, hoy), '2026-02-20') // aún no llega: el del mes pasado
})

test('fecha de corte: meses cortos, cambio de año y sin dato', () => {
  assert.equal(fechaCortePropuesta(31, new Date(2026, 2, 1)), '2026-02-28')
  assert.equal(fechaCortePropuesta(30, new Date(2026, 0, 5)), '2025-12-30')
  assert.equal(fechaCortePropuesta(null, new Date(2026, 2, 15)), '')
  assert.equal(fechaCortePropuesta(32, new Date(2026, 2, 15)), '')
})

test('payload: los movimientos de la IA llevan lo original y los manuales no', () => {
  const respuesta = {
    tarjeta: { banco: 'BBVA', limiteCredito: 1, saldoActual: 1, tasaAnual: null, pagoMinimo: null, pagoNoIntereses: null, diaCorte: 10, diaLimitePago: 30 },
    movimientos: [{ fecha: '2026-03-02', concepto: 'GASOLINERA', monto: 450 }],
    msi: [],
  }
  let datos = reducer(estadoInicial, { type: 'CARGAR', respuesta })
  const id = datos.filas[0].id
  datos = reducer(datos, { type: 'EDITAR_FILA', id, campo: 'concepto', valor: 'GASOLINA' })
  datos = reducer(datos, { type: 'AGREGAR' })
  const [ia, manual] = aPayload(datos).movimientos
  assert.deepEqual(ia.original, { fecha: '2026-03-02', concepto: 'GASOLINERA', monto: 450 })
  assert.equal(ia.concepto, 'GASOLINA')
  assert.equal(ia.editadoPorUsuario, true)
  assert.equal(manual.origen, 'manual')
  assert.equal(manual.original, null)
})
