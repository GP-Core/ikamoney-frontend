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
  /** Borra también sus compras a MSI (en cascada, T18) y dice cuántas fueron. */
  eliminarTarjeta(id: number): Promise<{ planes_msi_eliminados: number }>

  crearPlanMsi(tarjetaId: number, datos: PlanMsiPayload): Promise<PlanMsi>
  actualizarPlanMsi(id: number, datos: PlanMsiPayload): Promise<PlanMsi>
  eliminarPlanMsi(id: number): Promise<void>

  listarDeudas(): Promise<Deuda[]>
  obtenerDeuda(id: number): Promise<Deuda>
  crearDeuda(datos: DeudaPayload): Promise<Deuda>
  actualizarDeuda(id: number, datos: DeudaPayload): Promise<Deuda>
  eliminarDeuda(id: number): Promise<void>
}

// El backend manda el dinero como número JSON; se convierte igual por si algún campo llegara como texto.
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

function conPlanes(t: Tarjeta, planes: PlanMsi[]): Tarjeta {
  return { ...normalizarTarjeta(t), planes_msi: planes.filter((p) => p.tarjeta_id === t.id).map(normalizarPlan) }
}

function normalizarTarjeta(t: Tarjeta): Tarjeta {
  return {
    ...t,
    limite_credito: numero(t.limite_credito),
    saldo_actual: numero(t.saldo_actual),
    dia_corte: numero(t.dia_corte),
    dia_pago: numero(t.dia_pago),
    tasa_anual: numeroONulo(t.tasa_anual),
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
  }
}

const json = (metodo: 'POST' | 'PUT', datos: unknown): RequestInit => ({ method: metodo, body: JSON.stringify(datos) })

/**
 * Implementación real sobre /api/v1/tarjetas, /deudas y /msi. El backend no mete los planes MSI dentro de la
 * tarjeta: se piden aparte y se reparten por tarjeta_id para que las pantallas reciban la misma forma de siempre.
 */
export const finanzasApi: FinanzasService = {
  listarTarjetas: async () => {
    const [tarjetas, planes] = await Promise.all([apiFetch<Tarjeta[]>('/v1/tarjetas'), apiFetch<PlanMsi[]>('/v1/msi')])
    return tarjetas.map((t) => conPlanes(t, planes))
  },
  obtenerTarjeta: async (id) => {
    const [tarjeta, planes] = await Promise.all([
      apiFetch<Tarjeta>(`/v1/tarjetas/${id}`),
      apiFetch<PlanMsi[]>(`/v1/msi?tarjeta_id=${id}`),
    ])
    return conPlanes(tarjeta, planes)
  },
  crearTarjeta: async (datos) => conPlanes(await apiFetch<Tarjeta>('/v1/tarjetas', json('POST', datos)), []),
  actualizarTarjeta: async (id, datos) => {
    await apiFetch<Tarjeta>(`/v1/tarjetas/${id}`, json('PUT', datos))
    return finanzasApi.obtenerTarjeta(id)
  },
  eliminarTarjeta: async (id) => {
    const r = await apiFetch<{ planes_msi_eliminados: number }>(`/v1/tarjetas/${id}`, { method: 'DELETE' })
    return { planes_msi_eliminados: r.planes_msi_eliminados }
  },

  crearPlanMsi: async (tarjetaId, datos) =>
    normalizarPlan(await apiFetch<PlanMsi>('/v1/msi', json('POST', { ...datos, tarjeta_id: tarjetaId }))),
  actualizarPlanMsi: async (id, datos) => normalizarPlan(await apiFetch<PlanMsi>(`/v1/msi/${id}`, json('PUT', datos))),
  eliminarPlanMsi: async (id) => {
    await apiFetch<unknown>(`/v1/msi/${id}`, { method: 'DELETE' })
  },

  listarDeudas: async () => (await apiFetch<Deuda[]>('/v1/deudas')).map(normalizarDeuda),
  obtenerDeuda: async (id) => normalizarDeuda(await apiFetch<Deuda>(`/v1/deudas/${id}`)),
  crearDeuda: async (datos) => normalizarDeuda(await apiFetch<Deuda>('/v1/deudas', json('POST', datos))),
  actualizarDeuda: async (id, datos) =>
    normalizarDeuda(await apiFetch<Deuda>(`/v1/deudas/${id}`, json('PUT', datos))),
  eliminarDeuda: async (id) => {
    await apiFetch<unknown>(`/v1/deudas/${id}`, { method: 'DELETE' })
  },
}