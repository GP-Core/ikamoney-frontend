import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { SimulacionResponse } from '../src/types/simulador.ts'
import { prioridadVecina } from '../src/utils/prioridad.ts'
import {
  cambioDeScore, coloresPorFormaDePago, conceptoDeGasto, eleccionInicial, opcionVecina, ordenarConSugerida, textoRegistro,
  titularVeredicto,
} from '../src/utils/simuladorVista.ts'

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

const escenarios = [
  { id: 'contado', tipo: 'contado', meses: null, aplica: true },
  { id: 'msi-1-6', tipo: 'msi', meses: 6, aplica: true },
  { id: 'msi-1-18', tipo: 'msi', meses: 18, aplica: true },
] as unknown as SimulacionResponse['escenarios']

const resultado = (extra: Partial<SimulacionResponse>) =>
  ({ veredicto: 'recomendable', veredicto_texto: 'Recomendable', menor_impacto: 'msi-1-18', escenarios, ...extra }) as SimulacionResponse

test('ordenarConSugerida pone la sugerida primero y respeta el resto', () => {
  assert.deepEqual(ordenarConSugerida(escenarios, 'msi-1-18').map((e) => e.id), ['msi-1-18', 'contado', 'msi-1-6'])
  assert.deepEqual(ordenarConSugerida(escenarios, null).map((e) => e.id), ['contado', 'msi-1-6', 'msi-1-18'])
})

test('titularVeredicto dice a qué forma de pago se refiere', () => {
  assert.equal(titularVeredicto(resultado({})), 'Recomendable a 18 meses sin intereses')
  assert.equal(titularVeredicto(resultado({ menor_impacto: 'contado' })), 'Recomendable de contado')
  assert.equal(
    titularVeredicto(resultado({ veredicto: 'no_recomendable', veredicto_texto: 'No recomendable por ahora' })),
    'No recomendable por ahora',
  )
  assert.equal(titularVeredicto(resultado({ veredicto: null })), 'Ninguna forma de pago aplica por ahora')
})

test('coloresPorFormaDePago: azul el contado y violetas distintos para cada plazo', () => {
  const colores = coloresPorFormaDePago(escenarios)
  assert.equal(colores.get('contado'), 'var(--azul)')
  assert.notEqual(colores.get('msi-1-6'), colores.get('msi-1-18'))
})

test('empieza elegida la sugerida, salvo que no sea recomendable', () => {
  assert.equal(eleccionInicial(resultado({})), 'msi-1-18')
  assert.equal(eleccionInicial(resultado({ veredicto: 'no_recomendable' })), null)
  assert.equal(eleccionInicial(resultado({ veredicto: null })), null)
  assert.equal(eleccionInicial(resultado({ menor_impacto: 'no-existe' })), null)
})

test('las flechas recorren las opciones y dan la vuelta', () => {
  const ids = ['a', 'b', 'c']
  assert.equal(opcionVecina(ids, 'c', 'ArrowRight'), 'a')
  assert.equal(opcionVecina(ids, 'a', 'ArrowUp'), 'c')
  assert.equal(opcionVecina(ids, 'b', 'Tab'), null)
})

test('el texto del registro dice a dónde va y qué pasa', () => {
  const compra = { descripcion: 'Audífonos', precio: 1500, cuenta: 'Nómina', formatear: (n: number) => `$${n}` }
  const msi = textoRegistro({ tipo: 'msi', meses: 6, mensualidad: 250, tarjeta_nombre: 'BBVA' }, compra)
  assert.equal(msi.resumen, 'Audífonos en BBVA, a 6 meses de $250.')
  assert.match(msi.efecto, /ocupa \$1500 de tu crédito/)
  const contado = { tipo: 'contado' as const, meses: null, mensualidad: 1500, tarjeta_nombre: null }
  assert.match(textoRegistro(contado, compra).efecto, /sale de Nómina/)
  assert.match(textoRegistro(contado, { ...compra, cuenta: null }).efecto, /sin cambiar ningún saldo/)
})

test('cambio de score y concepto mínimo del gasto', () => {
  const score = (puntaje: number) => ({ score: { puntaje } as never })
  assert.equal(cambioDeScore(score(78), { puntaje: 84 }), 'Tu score pasaría de 84 a 78.')
  assert.equal(cambioDeScore(score(84), { puntaje: 84 }), 'Tu score se quedaría en 84.')
  assert.equal(cambioDeScore({ score: null }, { puntaje: 84 }), null)
  assert.equal(conceptoDeGasto('TV'), 'Compra TV')
  assert.equal(conceptoDeGasto(' Laptop '), 'Laptop')
})
