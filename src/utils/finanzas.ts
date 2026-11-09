// Cálculos de tarjetas, MSI y deudas. Siguen las fórmulas de T25 y la hoja de referencia T26.
// Son solo para mostrar información: el motor oficial de cálculo vive en el backend (T33).

import type { Deuda, PlanMsi, Tarjeta, TipoDeuda } from '../types/finanzas'

const IVA = 0.16
/** Pago mínimo, regla de Banxico: 1.5 % del saldo + intereses, o 1.25 % de la línea (el mayor). */
const PCT_SALDO_MIN = 0.015
const PCT_LINEA_MIN = 0.0125
/** Un saldo menor o igual a esto se considera liquidado. */
const UMBRAL_SALDO_CERO = 0.005

export type Nivel = 'sano' | 'precaucion' | 'riesgo' | 'critico'

export const NIVEL_TEXTO: Record<Nivel, string> = {
  sano: 'Sano',
  precaucion: 'Precaución',
  riesgo: 'Riesgo',
  critico: 'Crítico',
}

export const TIPO_DEUDA_TEXTO: Record<TipoDeuda, string> = {
  prestamo_personal: 'Préstamo personal',
  credito_auto: 'Crédito de auto',
  credito_hipotecario: 'Crédito hipotecario',
  credito_tienda: 'Crédito de tienda',
  familiar_amigo: 'Familiar o amigo',
  otro: 'Otro',
}

export const redondear2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

const sumar = (valores: number[]) => redondear2(valores.reduce((total, v) => total + v, 0))

// ---------- Compras a MSI ----------

export function calcularMensualidad(montoOriginal: number, numMensualidades: number): number {
  return redondear2(montoOriginal / numMensualidades)
}

export function mensualidadesRestantes(plan: PlanMsi): number {
  return Math.max(plan.num_mensualidades - plan.mensualidades_pagadas, 0)
}

/** Lo que falta pagar de una compra a MSI (se deriva, no se guarda: T18 4.1). */
export function saldoPendienteMsi(plan: PlanMsi): number {
  if (plan.estatus !== 'activo') return 0
  return redondear2(mensualidadesRestantes(plan) * plan.monto_mensualidad)
}

export function planesActivos(tarjeta: Tarjeta): PlanMsi[] {
  return tarjeta.planes_msi.filter((p) => p.estatus === 'activo' && mensualidadesRestantes(p) > 0)
}

export function saldoMsiTarjeta(tarjeta: Tarjeta): number {
  return sumar(planesActivos(tarjeta).map(saldoPendienteMsi))
}

/** Suma de las mensualidades MSI que se pagan este mes en la tarjeta. */
export function mensualidadesMsiTarjeta(tarjeta: Tarjeta): number {
  return sumar(planesActivos(tarjeta).map((p) => p.monto_mensualidad))
}

// ---------- Tarjetas ----------

/** Todo lo que se debe en la tarjeta: saldo + lo pendiente de MSI. */
export function deudaTarjeta(tarjeta: Tarjeta): number {
  return redondear2(tarjeta.saldo_actual + saldoMsiTarjeta(tarjeta))
}

export function disponibleTarjeta(tarjeta: Tarjeta): number {
  return redondear2(Math.max(tarjeta.limite_credito - deudaTarjeta(tarjeta), 0))
}

/** Utilización de la tarjeta incluyendo MSI (fórmula 12 de T25). Devuelve una proporción: 0.3 = 30 %. */
export function utilizacion(tarjeta: Tarjeta): number | null {
  if (tarjeta.limite_credito <= 0) return null
  return deudaTarjeta(tarjeta) / tarjeta.limite_credito
}

export function utilizacionTotal(tarjetas: Tarjeta[]): number | null {
  const limite = sumar(tarjetas.map((t) => t.limite_credito))
  if (limite <= 0) return null
  return sumar(tarjetas.map(deudaTarjeta)) / limite
}

/** Semáforo de utilización (T24): menos de 30 % sano, 30–49 % precaución, 50 % o más riesgo, límite rebasado crítico. */
export function nivelUtilizacion(proporcion: number): Nivel {
  if (proporcion >= 1) return 'critico'
  if (proporcion >= 0.5) return 'riesgo'
  if (proporcion >= 0.3) return 'precaucion'
  return 'sano'
}

/** Intereses de un mes con IVA (fórmula 5 de T25). Null si no hay tasa registrada. */
export function interesMensual(saldo: number, tasaAnual: number | null): number | null {
  if (tasaAnual === null) return null
  return redondear2((saldo * tasaAnual) / 100 / 12 * (1 + IVA))
}

/** Pago mínimo estimado con la regla de Banxico (fórmula 6 de T25). */
export function pagoMinimoEstimado(tarjeta: Tarjeta): number | null {
  const saldo = tarjeta.saldo_actual
  if (saldo <= UMBRAL_SALDO_CERO) return 0
  const interes = interesMensual(saldo, tarjeta.tasa_anual)
  if (interes === null) return null
  const porSaldo = PCT_SALDO_MIN * saldo + interes
  const porLinea = PCT_LINEA_MIN * tarjeta.limite_credito
  return redondear2(Math.min(Math.max(porSaldo, porLinea), saldo + interes))
}

/** Pago mínimo del estado de cuenta o, si no se capturó, el estimado. */
export function pagoMinimo(tarjeta: Tarjeta): { monto: number | null; estimado: boolean } {
  if (tarjeta.pago_minimo !== null) return { monto: tarjeta.pago_minimo, estimado: false }
  return { monto: pagoMinimoEstimado(tarjeta), estimado: true }
}

/** Pago para no generar intereses: saldo + mensualidades MSI del mes (fórmula 7 de T25). */
export function pagoNoIntereses(tarjeta: Tarjeta): number {
  return redondear2(tarjeta.saldo_actual + mensualidadesMsiTarjeta(tarjeta))
}

// ---------- Resumen de todo ----------

export function totalDeuda(tarjetas: Tarjeta[], deudas: Deuda[]): number {
  return sumar([...tarjetas.map(deudaTarjeta), ...deudas.map((d) => d.saldo_actual)])
}

/** Compromisos del mes: pagos mínimos + mensualidades MSI + pagos de otras deudas. */
export function compromisosDelMes(tarjetas: Tarjeta[], deudas: Deuda[]): number {
  return sumar([
    ...tarjetas.map((t) => (pagoMinimo(t).monto ?? 0) + mensualidadesMsiTarjeta(t)),
    ...deudas.filter((d) => d.estatus === 'activa').map((d) => d.pago_mensual ?? 0),
  ])
}

// ---------- Fechas ----------

function fechaConDia(anio: number, mes: number, dia: number): Date {
  // Si el mes tiene menos días, se usa el último día del mes (T18 4.3).
  const ultimoDia = new Date(anio, mes + 1, 0).getDate()
  return new Date(anio, mes, Math.min(dia, ultimoDia))
}

/** Próxima fecha (hoy incluido) que cae en ese día del mes. */
export function proximaFecha(dia: number, hoy = new Date()): Date {
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  const esteMes = fechaConDia(inicioHoy.getFullYear(), inicioHoy.getMonth(), dia)
  if (esteMes >= inicioHoy) return esteMes
  return fechaConDia(inicioHoy.getFullYear(), inicioHoy.getMonth() + 1, dia)
}

export function diasHasta(fecha: Date, hoy = new Date()): number {
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  return Math.round((fecha.getTime() - inicioHoy.getTime()) / 86_400_000)
}

/** "30 de octubre" */
export function formatFecha(fecha: Date): string {
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long' }).format(fecha)
}

/** "30 de octubre (en 14 días)", "hoy" o "mañana". */
export function textoProximaFecha(dia: number, hoy = new Date()): string {
  const fecha = proximaFecha(dia, hoy)
  const dias = diasHasta(fecha, hoy)
  const cuando = dias === 0 ? 'hoy' : dias === 1 ? 'mañana' : `en ${dias} días`
  return `${formatFecha(fecha)} (${cuando})`
}

/** Fecha AAAA-MM-DD → "12 de marzo de 2026" */
export function formatFechaIso(iso: string): string {
  const [anio, mes, dia] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(anio, mes - 1, dia),
  )
}

/** Hoy en formato AAAA-MM-DD (hora local). */
export function hoyIso(): string {
  const hoy = new Date()
  const mes = String(hoy.getMonth() + 1).padStart(2, '0')
  const dia = String(hoy.getDate()).padStart(2, '0')
  return `${hoy.getFullYear()}-${mes}-${dia}`
}

/** 0.4778 → "47.8 %" */
export function formatPorcentaje(proporcion: number): string {
  return `${new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 }).format(proporcion * 100)} %`
}