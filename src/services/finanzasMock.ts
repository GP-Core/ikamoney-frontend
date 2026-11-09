import type { Deuda, DeudaPayload, PlanMsi, PlanMsiPayload, Tarjeta } from '../types/finanzas'
import { ApiError } from './api'
import { idUsuarioMock } from './authMock'
import type { FinanzasService } from './finanzasApi'

/**
 * SOLO PARA DESARROLLO Y DEMOSTRACIONES.
 *
 * Simula los endpoints de tarjetas, MSI y deudas dentro del navegador mientras el
 * backend los implementa. Los datos se guardan por usuario en localStorage.
 */

type TarjetaGuardada = Omit<Tarjeta, 'planes_msi'>

interface DatosMock {
  ultimoId: number
  tarjetas: TarjetaGuardada[]
  planes: PlanMsi[]
  deudas: Deuda[]
}

const VACIO: DatosMock = { ultimoId: 0, tarjetas: [], planes: [], deudas: [] }

const clave = () => `ikamoney-mock:finanzas:${idUsuarioMock()}`

function leer(): DatosMock {
  try {
    const valor = localStorage.getItem(clave())
    return valor ? (JSON.parse(valor) as DatosMock) : structuredClone(VACIO)
  } catch (error) {
    if (error instanceof ApiError) throw error
    return structuredClone(VACIO)
  }
}

function guardar(datos: DatosMock): void {
  localStorage.setItem(clave(), JSON.stringify(datos))
}

const esperar = () => new Promise((resolve) => setTimeout(resolve, 250))

const noEncontrado = () => new ApiError(404, 'No encontrado')

function conPlanes(tarjeta: TarjetaGuardada, planes: PlanMsi[]): Tarjeta {
  return { ...tarjeta, planes_msi: planes.filter((p) => p.tarjeta_id === tarjeta.id) }
}

function estatusPlan(datos: PlanMsiPayload): PlanMsi['estatus'] {
  return datos.mensualidades_pagadas >= datos.num_mensualidades ? 'liquidado' : 'activo'
}

function estatusDeuda(datos: DeudaPayload): Deuda['estatus'] {
  return datos.saldo_actual <= 0.005 ? 'liquidada' : 'activa'
}

export const finanzasMock: FinanzasService = {
  async listarTarjetas() {
    await esperar()
    const datos = leer()
    return datos.tarjetas.map((t) => conPlanes(t, datos.planes))
  },

  async obtenerTarjeta(id) {
    await esperar()
    const datos = leer()
    const tarjeta = datos.tarjetas.find((t) => t.id === id)
    if (!tarjeta) throw noEncontrado()
    return conPlanes(tarjeta, datos.planes)
  },

  async crearTarjeta(payload) {
    await esperar()
    const datos = leer()
    const tarjeta: TarjetaGuardada = { ...payload, id: ++datos.ultimoId, activa: true }
    datos.tarjetas.push(tarjeta)
    guardar(datos)
    return conPlanes(tarjeta, datos.planes)
  },

  async actualizarTarjeta(id, payload) {
    await esperar()
    const datos = leer()
    const indice = datos.tarjetas.findIndex((t) => t.id === id)
    if (indice < 0) throw noEncontrado()
    datos.tarjetas[indice] = { ...datos.tarjetas[indice], ...payload }
    guardar(datos)
    return conPlanes(datos.tarjetas[indice], datos.planes)
  },

  async eliminarTarjeta(id) {
    await esperar()
    const datos = leer()
    if (!datos.tarjetas.some((t) => t.id === id)) throw noEncontrado()
    datos.tarjetas = datos.tarjetas.filter((t) => t.id !== id)
    datos.planes = datos.planes.filter((p) => p.tarjeta_id !== id) // en cascada
    guardar(datos)
  },

  async crearPlanMsi(tarjetaId, payload) {
    await esperar()
    const datos = leer()
    if (!datos.tarjetas.some((t) => t.id === tarjetaId)) throw noEncontrado()
    const plan: PlanMsi = {
      ...payload,
      id: ++datos.ultimoId,
      tarjeta_id: tarjetaId,
      estatus: estatusPlan(payload),
      origen: 'manual',
    }
    datos.planes.push(plan)
    guardar(datos)
    return plan
  },

  async actualizarPlanMsi(id, payload) {
    await esperar()
    const datos = leer()
    const indice = datos.planes.findIndex((p) => p.id === id)
    if (indice < 0) throw noEncontrado()
    datos.planes[indice] = { ...datos.planes[indice], ...payload, estatus: estatusPlan(payload) }
    guardar(datos)
    return datos.planes[indice]
  },

  async eliminarPlanMsi(id) {
    await esperar()
    const datos = leer()
    if (!datos.planes.some((p) => p.id === id)) throw noEncontrado()
    datos.planes = datos.planes.filter((p) => p.id !== id)
    guardar(datos)
  },

  async listarDeudas() {
    await esperar()
    return leer().deudas
  },

  async obtenerDeuda(id) {
    await esperar()
    const deuda = leer().deudas.find((d) => d.id === id)
    if (!deuda) throw noEncontrado()
    return deuda
  },

  async crearDeuda(payload) {
    await esperar()
    const datos = leer()
    const deuda: Deuda = { ...payload, id: ++datos.ultimoId, estatus: estatusDeuda(payload) }
    datos.deudas.push(deuda)
    guardar(datos)
    return deuda
  },

  async actualizarDeuda(id, payload) {
    await esperar()
    const datos = leer()
    const indice = datos.deudas.findIndex((d) => d.id === id)
    if (indice < 0) throw noEncontrado()
    datos.deudas[indice] = { ...datos.deudas[indice], ...payload, estatus: estatusDeuda(payload) }
    guardar(datos)
    return datos.deudas[indice]
  },

  async eliminarDeuda(id) {
    await esperar()
    const datos = leer()
    if (!datos.deudas.some((d) => d.id === id)) throw noEncontrado()
    datos.deudas = datos.deudas.filter((d) => d.id !== id)
    guardar(datos)
  },
}

/**
 * Carga el perfil de prueba de T25 y T26: Tarjeta A y Tarjeta B con dos compras a MSI.
 * Con estos datos el uso total del crédito da 47.8 % y los compromisos del mes $4,162.00.
 */
export async function cargarDatosDeEjemplo(): Promise<void> {
  const tarjetaA = await finanzasMock.crearTarjeta({
    nombre: 'Tarjeta A',
    banco: 'Banco de ejemplo',
    ultimos_4: '1234',
    limite_credito: 60000,
    saldo_actual: 20000,
    dia_corte: 10,
    dia_pago: 30,
    tasa_anual: 60,
    pago_minimo: null,
  })
  const tarjetaB = await finanzasMock.crearTarjeta({
    nombre: 'Tarjeta B',
    banco: 'Banco de ejemplo',
    ultimos_4: '5678',
    limite_credito: 30000,
    saldo_actual: 12000,
    dia_corte: 20,
    dia_pago: 9,
    tasa_anual: 45,
    pago_minimo: null,
  })
  await finanzasMock.crearPlanMsi(tarjetaA.id, {
    descripcion: 'Laptop',
    monto_original: 12000,
    num_mensualidades: 12,
    mensualidades_pagadas: 4,
    monto_mensualidad: 1000,
    fecha_compra: '2026-06-15',
  })
  await finanzasMock.crearPlanMsi(tarjetaB.id, {
    descripcion: 'Celular',
    monto_original: 6000,
    num_mensualidades: 6,
    mensualidades_pagadas: 3,
    monto_mensualidad: 1000,
    fecha_compra: '2026-07-22',
  })
}