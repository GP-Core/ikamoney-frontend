import assert from 'node:assert/strict'
import { test } from 'node:test'
import { destinoDeAlerta, errorDias, errorUmbral, ordenarAlertas, textoContador, tipoDeSeveridad } from '../src/utils/alertas.ts'

test('destinoDeAlerta: cada regla lleva a su acción', () => {
  assert.deepEqual(destinoDeAlerta({ regla: 'AL-01', referencia: 'proyeccion' }).a, '/balance')
  assert.equal(destinoDeAlerta({ regla: 'AL-02', referencia: 'tarjeta:7' }).a, '/ranking')
  assert.equal(destinoDeAlerta({ regla: 'AL-04', referencia: 'tarjeta:7' }).a, '/ranking')
  assert.equal(destinoDeAlerta({ regla: 'AL-03', referencia: 'tarjeta:7:2026-04-30' }).a, '/tarjetas/7')
})

test('destinoDeAlerta: referencia rota o regla desconocida cae en tarjetas', () => {
  assert.equal(destinoDeAlerta({ regla: 'AL-03', referencia: 'proyeccion' }).a, '/tarjetas')
  assert.equal(destinoDeAlerta({ regla: 'AL-03', referencia: 'tarjeta:abc' }).a, '/tarjetas')
  assert.equal(destinoDeAlerta({ regla: 'AL-03', referencia: 'tarjeta:0' }).a, '/tarjetas')
  assert.equal(destinoDeAlerta({ regla: 'AL-09' as 'AL-01', referencia: 'x' }).a, '/tarjetas')
})

test('ordenarAlertas: no leídas primero y, dentro de cada grupo, la más reciente', () => {
  const lista = [
    { id: 1, leida: true, creada_en: '2026-11-17T09:00:00' },
    { id: 2, leida: false, creada_en: '2026-11-15T09:00:00' },
    { id: 3, leida: false, creada_en: '2026-11-16T09:00:00' },
    { id: 4, leida: true, creada_en: '2026-11-18T09:00:00' },
  ]
  assert.deepEqual(
    ordenarAlertas(lista).map((a) => a.id),
    [3, 2, 4, 1],
  )
  assert.deepEqual(lista.map((a) => a.id), [1, 2, 3, 4], 'no modifica la lista original')
})

test('tipoDeSeveridad usa los colores del semáforo', () => {
  assert.equal(tipoDeSeveridad('atencion'), 'precaucion')
  assert.equal(tipoDeSeveridad('critica'), 'critico')
})

test('textoContador: vacío sin pendientes y 9+ como tope', () => {
  assert.equal(textoContador(0), '')
  assert.equal(textoContador(3), '3')
  assert.equal(textoContador(9), '9')
  assert.equal(textoContador(10), '9+')
})

test('errorUmbral y errorDias respetan los rangos del backend', () => {
  assert.equal(errorUmbral(70), null)
  assert.equal(errorUmbral(10), null)
  assert.equal(errorUmbral(100), null)
  assert.notEqual(errorUmbral(9), null)
  assert.notEqual(errorUmbral(101), null)
  assert.notEqual(errorUmbral(70.5), null)
  assert.notEqual(errorUmbral(Number.NaN), null)
  assert.equal(errorDias(3), null)
  assert.notEqual(errorDias(0), null)
  assert.notEqual(errorDias(16), null)
  assert.notEqual(errorDias(2.5), null)
})
