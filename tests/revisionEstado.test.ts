import assert from 'node:assert/strict'
import test from 'node:test'
import {
  aPayload, cupoTrasLectura, estadoInicial, faltantesNueva, fechaCortePropuesta, hayCambios, puedeLeerConIa, reducer,
  resumenFilas, tarjetaSugerida, textoCupo, textoCupoCorto, textoLecturaUsada, textoPeso, totalFilas, validar,
} from '../src/utils/revisionEstado.ts'

const cupo = (usados: number) => ({ limite: 5, usados, restantes: 5 - usados })

test('cupo: sin dato se deja intentar y no hay texto', () => {
  assert.equal(puedeLeerConIa(null), true)
  assert.equal(textoCupo(null), null)
})

test('cupo: explicación, etiqueta corta y lectura usada', () => {
  assert.match(textoCupo(cupo(1)) ?? '', /^Son 5 en total/)
  assert.match(textoCupo(cupo(4)) ?? '', /^Te queda 1/)
  assert.deepEqual([cupo(1), cupo(4), cupo(5)].map(textoCupoCorto), ['4 gratis', '1 gratis', 'Sin lecturas gratis'])
  assert.equal(textoCupoCorto(null), null)
  assert.match(textoLecturaUsada(cupo(2)), /Te quedan 3\.$/)
  assert.match(textoLecturaUsada(cupo(5)), /Ya no te quedan/)
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

test('captura a mano: sin movimientos es válida y sin cambios no hay nada que perder', () => {
  const datos = reducer(estadoInicial, { type: 'MANUAL' })
  assert.equal(datos.filas.length, 0)
  assert.equal(validar(datos).total, 0)
  assert.equal(hayCambios(datos), false)
  assert.equal(hayCambios(reducer(datos, { type: 'EDITAR_TARJETA', campo: 'banco', valor: 'Nu' })), true)
  assert.equal(hayCambios(reducer(datos, { type: 'AGREGAR' })), true)
  assert.equal(hayCambios(estadoInicial), false)
})

test('tarjeta nueva: marca los obligatorios y el banco sirve de nombre', () => {
  let datos = reducer(estadoInicial, { type: 'MANUAL' })
  assert.deepEqual(Object.keys(faltantesNueva(aPayload(datos).tarjeta, '')),
    ['nombre', 'banco', 'limiteCredito', 'diaCorte', 'diaLimitePago'])
  for (const [campo, valor] of [['banco', 'Nu'], ['limiteCredito', '$12,500.50'], ['diaCorte', '10'], ['diaLimitePago', '30']] as const)
    datos = reducer(datos, { type: 'EDITAR_TARJETA', campo, valor })
  assert.deepEqual(faltantesNueva(aPayload(datos).tarjeta, ''), {})
  assert.equal(aPayload(datos).tarjeta?.limiteCredito, 12500.5)
})

test('sugiere la tarjeta del mismo banco solo si es una', () => {
  const tarjetas = [{ id: 1, banco: 'BBVA' }, { id: 2, banco: 'Banamex' }, { id: 3, banco: 'banamex' }]
  assert.equal(tarjetaSugerida('bbva ', tarjetas), 1)
  assert.equal(tarjetaSugerida('Banamex', tarjetas), null)
  assert.equal(tarjetaSugerida(null, tarjetas), null)
})

test('peso del archivo, resumen y total de filas', () => {
  assert.equal(textoPeso(2048), '2 KB')
  assert.equal(textoPeso(1.25 * 1024 * 1024), '1.3 MB')
  assert.equal(resumenFilas([{ esMsi: false }, { esMsi: true }]), '1 movimiento · 1 compra a MSI')
  assert.equal(totalFilas([{ monto: '1,000' }, { monto: '' }, { monto: 50.5 }]), 1050.5)
})

test('no acepta movimientos con fecha futura', () => {
  const datos = reducer(reducer(estadoInicial, { type: 'MANUAL' }), { type: 'AGREGAR' })
  const id = datos.filas[0].id
  const futuro = reducer(datos, { type: 'EDITAR_FILA', id, campo: 'fecha', valor: '2026-03-20' })
  assert.equal(validar(futuro, '2026-03-15').filas[id].fecha, 'No puede ser futura.')
})
