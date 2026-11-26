import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Cuenta, MovimientoCuenta } from '../src/types/cuenta.ts'
import { agruparPorDia, faltaMarcar, dineroDisponible, deudaEnTarjetas, notaAlRegistrar, saldoDespues, textoTipoMovimiento } from '../src/utils/cuentas.ts'

const cuenta = (parcial: Partial<Cuenta>): Cuenta => ({
  id: 1, tipo: 'debito', nombre: 'Nómina', banco: null, ultimos_4: null, activa: true,
  saldo_disponible: 1000, limite_credito: null, saldo_actual: null, ...parcial,
})
const tarjeta = cuenta({ id: 2, tipo: 'credito', nombre: 'Nu', saldo_disponible: null, saldo_actual: 2500 })

test('"tu dinero hoy" no incluye tarjetas, cuentas "otra" ni inactivas', () => {
  const cuentas = [cuenta({}), cuenta({ tipo: 'efectivo', saldo_disponible: 0.1 }), cuenta({ tipo: 'otro' }),
    cuenta({ activa: false }), tarjeta]
  assert.equal(dineroDisponible(cuentas), 1000.1)
  assert.equal(deudaEnTarjetas(cuentas), 2500)
})

test('el efecto de cada tipo de movimiento sobre el saldo', () => {
  assert.equal(saldoDespues(cuenta({}), 'cargo', 250), 750)
  assert.equal(saldoDespues(cuenta({}), 'abono', 250), 1250)
  assert.equal(saldoDespues(tarjeta, 'cargo', 100), 2600)
  assert.equal(saldoDespues(tarjeta, 'pago', 100), 2400)
  assert.equal(saldoDespues(tarjeta, 'mensualidad_msi', 100), 2500)
})

test('agrupa por día conservando el orden', () => {
  const mov = (id: number, fecha: string) => ({ id, fecha }) as MovimientoCuenta
  const grupos = agruparPorDia([mov(1, '2026-11-08'), mov(2, '2026-11-08'), mov(3, '2026-11-01')])
  assert.deepEqual(grupos.map((g) => [g.fecha, g.movimientos.length]), [['2026-11-08', 2], ['2026-11-01', 1]])
})

test('usa palabras simples según la cuenta', () => {
  assert.equal(textoTipoMovimiento('cargo', false), 'Salió dinero')
  assert.equal(textoTipoMovimiento('cargo', true), 'Compra o cargo')
})

test('la nota dice qué pasará al guardar', () => {
  const base = { monto: 500, esIngreso: false, seRepite: false, esFuturo: false, formatear: (n: number) => `$${n}` }
  assert.equal(notaAlRegistrar({ ...base, cuenta: cuenta({}) }), 'Nómina quedará en $500.')
  assert.match(notaAlRegistrar({ ...base, cuenta: tarjeta }), /No cuenta como gasto del mes/)
  assert.match(notaAlRegistrar({ ...base, cuenta: cuenta({}), seRepite: true }), /ya lo pagaste/)
  assert.match(notaAlRegistrar({ ...base, cuenta: undefined }), /no cambia ningún saldo/)
})

test('pide marcar lo recurrente y el único con cuenta que ya llegó a su fecha', () => {
  const base = { frecuencia: 'unico' as const, pagado: false, cuenta_id: 1, cuenta_tipo: 'debito', fecha_ocurrencia: '2026-11-20' }
  assert.equal(faltaMarcar(base, '2026-11-25'), true)
  assert.equal(faltaMarcar(base, '2026-11-19'), false)
  assert.equal(faltaMarcar({ ...base, cuenta_id: null }, '2026-11-25'), false)
  assert.equal(faltaMarcar({ ...base, pagado: true }, '2026-11-25'), false)
  assert.equal(faltaMarcar({ ...base, frecuencia: 'mensual', cuenta_id: null }, '2026-11-25'), true)
})
