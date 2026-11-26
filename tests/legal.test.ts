import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ancla, DOCUMENTOS_LEGALES } from '../src/content/legal.ts'
import type { Bloque } from '../src/content/legal.ts'

const texto = (b: Bloque) => ('p' in b ? b.p : ('ol' in b ? b.ol : b.ul).join(' '))

test('cada sección tiene título y un ancla que no se repite', () => {
  for (const { titulo, secciones } of Object.values(DOCUMENTOS_LEGALES)) {
    const anclas = secciones.map((s) => {
      assert.ok(s.titulo, `una sección sin título en ${titulo}`)
      return ancla(s.titulo)
    })
    assert.equal(new Set(anclas).size, anclas.length)
  }
  assert.equal(ancla('2. Qué datos recabamos'), '2-que-datos-recabamos')
})

test('cada documento dice cuándo se actualizó', () => {
  for (const { actualizado } of Object.values(DOCUMENTOS_LEGALES)) {
    assert.match(actualizado, /^\d{4}-\d{2}-\d{2}$/)
    assert.ok(!Number.isNaN(Date.parse(actualizado)))
  }
})

test('el aviso menciona lo que la app guarda hoy', () => {
  const aviso = DOCUMENTOS_LEGALES.privacidad.secciones.flatMap((s) => s.bloques.map(texto)).join(' ')
  for (const dato of [/tu nombre, tu correo/, /Cuentas de dinero/, /Pagos a tarjetas/, /lecturas con inteligencia/, /score y avisos/]) {
    assert.match(aviso, dato)
  }
})
