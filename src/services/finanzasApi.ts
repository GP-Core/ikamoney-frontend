import type { Deuda, DeudaPayload, PlanMsi, PlanMsiPayload, Tarjeta, TarjetaPayload } from '../types/finanzas'
import { apiFetch } from './api'

/**
 * Operaciones de tarjetas, compras a MSI y otras deudas. La implementación real habla
 * con el backend; la de prueba (finanzasMock.ts) simula el mismo contrato en el navegador.
 */
export interface FinanzasService {
  listarTarjetas(): Promise<Tarjeta[]>
  obtenerTarjeta(id: number): Promise<Tarjeta>
  crearTarjeta(datos: TarjetaPayload): Promise<Tarjeta>
  actualizarTarjeta(id: number, datos: TarjetaPayload): Promise<Tarjeta>
  /** Borra también sus compras a MSI (en cascada, T18). */
  eliminarTarjeta(id: number): Promise<void>

  crearPlanMsi(tarjetaId: number, datos: PlanMsiPayload): Promise<PlanMsi>
  actualizarPlanMsi(id: number, datos: PlanMsiPayload): Promise<PlanMsi>
  eliminarPlanMsi(id: number): Promise<void>

  listarDeudas(): Promise<Deuda[]>
  obtenerDeuda(id: number): Promise<Deuda>
  crearDeuda(datos: DeudaPayload): Promise<Deuda>
  actualizarDeuda(id: number, datos: DeudaPayload): Promise<Deuda>
  eliminarDeuda(id: number): Promise<void>
}

// FastAPI manda los DECIMAL como texto ("12500.00"): aquí se convierten a número.
const numero = (v: unknown) => Number(v)
const numeroONulo = (v: unknown) => (v === null || v === undefined ? null : Number(v))

function normalizarPlan(p: PlanMsi): PlanMsi {
  return {
    ...p,
    monto_original: numero(p.monto_original),
    num_mensualidades: numero(p.num_mensualidades),
    mensualidades_pagadas: numero(p.mensualidades_pagadas),
    monto_mensualidad: numero(p.monto_mensualidad),
  }
}

function normalizarTarjeta(t: Tarjeta): Tarjeta {
  return {
    ...t,
    limite_credito: numero(t.limite_credito),
    saldo_actual: numero(t.saldo_actual),
    dia_corte: numero(t.dia_corte),
    dia_pago: numero(t.dia_pago),
    tasa_anual: numeroONulo(t.tasa_anual),
    pago_minimo: numeroONulo(t.pago_minimo),
    planes_msi: (t.planes_msi ?? []).map(normalizarPlan),
  }
}

function normalizarDeuda(d: Deuda): Deuda {
  return {
    ...d,
    monto_original: numero(d.monto_original),
    saldo_actual: numero(d.saldo_actual),
    tasa_anual: numeroONulo(d.tasa_anual),
    pago_mensual: numeroONulo(d.pago_mensual),
    dia_pago: numeroONulo(d.dia_pago),
    pagos_restantes: numeroONulo(d.pagos_restantes),
  }
}

const json = (metodo: 'POST' | 'PUT', datos: unknown): RequestInit => ({ method: metodo, body: JSON.stringify(datos) })

/** Implementación real con los endpoints de docs/contrato-api-finanzas.md. */
export const finanzasApi: FinanzasService = {
  listarTarjetas: async () => (await apiFetch<Tarjeta[]>('/tarjetas')).map(normalizarTarjeta),
  obtenerTarjeta: async (id) => normalizarTarjeta(await apiFetch<Tarjeta>(`/tarjetas/${id}`)),
  crearTarjeta: async (datos) => normalizarTarjeta(await apiFetch<Tarjeta>('/tarjetas', json('POST', datos))),
  actualizarTarjeta: async (id, datos) =>
    normalizarTarjeta(await apiFetch<Tarjeta>(`/tarjetas/${id}`, json('PUT', datos))),
  eliminarTarjeta: (id) => apiFetch<void>(`/tarjetas/${id}`, { method: 'DELETE' }),

  crearPlanMsi: async (tarjetaId, datos) =>
    normalizarPlan(await apiFetch<PlanMsi>(`/tarjetas/${tarjetaId}/msi`, json('POST', datos))),
  actualizarPlanMsi: async (id, datos) => normalizarPlan(await apiFetch<PlanMsi>(`/msi/${id}`, json('PUT', datos))),
  eliminarPlanMsi: (id) => apiFetch<void>(`/msi/${id}`, { method: 'DELETE' }),

  listarDeudas: async () => (await apiFetch<Deuda[]>('/deudas')).map(normalizarDeuda),
  obtenerDeuda: async (id) => normalizarDeuda(await apiFetch<Deuda>(`/deudas/${id}`)),
  crearDeuda: async (datos) => normalizarDeuda(await apiFetch<Deuda>('/deudas', json('POST', datos))),
  actualizarDeuda: async (id, datos) => normalizarDeuda(await apiFetch<Deuda>(`/deudas/${id}`, json('PUT', datos))),
  eliminarDeuda: (id) => apiFetch<void>(`/deudas/${id}`, { method: 'DELETE' }),
}