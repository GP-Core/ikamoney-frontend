import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Deuda, Tarjeta } from '../src/types/finanzas.ts'
import { proximosPagos } from '../src/utils/finanzas.ts'

const tarjeta = (id: number, extra: Partial<Tarjeta> = {}): Tarjeta => ({
  id, nombre: `Tarjeta ${id}`, banco: 'Banco', ultimos_4: null, limite_credito: 10000, saldo_actual: 1000,
  dia_corte: 1, dia_pago: 20, tasa_anual: 60, activa: true, planes_msi: [], ...extra,
})

const deuda = (id: number, extra: Partial<Deuda> = {}): Deuda => ({
  id, nombre: `Préstamo ${id}`, acreedor: null, tipo: 'prestamo_personal', monto_original: 5000, saldo_actual: 3000,
  tasa_anual: null, pago_mensual: 500, dia_pago: 18, fecha_inicio: null, estatus: 'activa', ...extra,
})

const hoy = new Date(2026, 2, 15)

test('proximosPagos ordena por fecha y pasa al mes siguiente si el día ya pasó', () => {
  const pagos = proximosPagos([tarjeta(1, { dia_pago: 10 }), tarjeta(2, { dia_pago: 20 })], [deuda(1)], hoy)
  assert.deepEqual(pagos.map((p) => [p.clave, p.dias]), [['deuda-1', 3], ['tarjeta-2', 5], ['tarjeta-1', 26]])
  assert.equal(pagos[2].fecha.getMonth(), 3)
  assert.equal(pagos[0].minimo, 500)
  assert.equal(pagos[1].sinIntereses, 1000)
})

test('proximosPagos excluye lo que no se debe o no tiene fecha', () => {
  const pagos = proximosPagos(
    [tarjeta(1, { saldo_actual: 0 }), tarjeta(2, { activa: false })],
    [deuda(1, { dia_pago: null }), deuda(2, { pago_mensual: null }), deuda(3, { estatus: 'liquidada' })],
    hoy,
  )
  assert.deepEqual(pagos, [])
})

test('proximosPagos usa el último día cuando el mes es más corto', () => {
  const [pago] = proximosPagos([tarjeta(1, { dia_pago: 31 })], [], new Date(2026, 1, 10))
  assert.equal(pago.fecha.getDate(), 28)
  assert.equal(pago.dias, 18)
})
