import type { PlanMsiPayload, TarjetaPayload } from '../types/finanzas'
import type {
  CupoExtraccion, DestinoTarjeta, EnvioConfirmacion, PayloadConfirmar, RespuestaExtraccion, ResultadoGuardado,
} from '../types/estadoCuenta'
import { calcularMensualidad } from '../utils/finanzas'
import { mensajeError } from '../utils/errores'
import { apiFetch, ApiError } from './api'
import { MODO_PRUEBA } from './auth'
import { escribir } from './escribir'
import { finanzasService } from './finanzas'

/** POST /api/v1/estados-cuenta/extraer: no guarda nada, solo devuelve lo que leyó la IA (T31). */
export function extraerEstadoCuenta(archivoPdf: File, opciones: { signal?: AbortSignal } = {}): Promise<RespuestaExtraccion> {
  const datos = new FormData()
  datos.append('archivo', archivoPdf)
  // apiFetch no pone Content-Type con un FormData: el navegador agrega el boundary del multipart.
  return apiFetch<RespuestaExtraccion>('/v1/estados-cuenta/extraer', {
    method: 'POST',
    body: datos,
    signal: opciones.signal,
  })
}

/** GET /api/v1/estados-cuenta/cupo: cuántas lecturas con IA gratis le quedan al usuario (H-04). */
export function obtenerCupo(): Promise<CupoExtraccion> {
  return apiFetch<CupoExtraccion>('/v1/estados-cuenta/cupo')
}

/** Convierte cualquier fallo de la extracción en un ApiError con mensaje para el usuario. */
export function errorDeExtraccion(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (error instanceof TypeError) {
    return new ApiError(
      0,
      'No pudimos conectar con el servidor. Revisa tu conexión o captura los datos a mano.',
      'SIN_CONEXION',
    )
  }
  return new ApiError(0, 'Algo salió mal. Puedes capturar los datos a mano.')
}

/** Errores donde tiene sentido volver a intentar con el mismo PDF (CUPO_AGOTADO y 429 no: reintentar no sirve). */
export function esReintentable(error: ApiError): boolean {
  return error.codigo === 'IA_NO_DISPONIBLE' || error.codigo === 'SIN_CONEXION'
}

/** Fecha estimada de una compra a MSI que no trae fecha: hoy menos las mensualidades que ya se pagaron. */
function fechaEstimadaDeCompra(mensualidadesPagadas: number): string {
  const hoy = new Date()
  const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - mensualidadesPagadas, 1)
  const ultimoDia = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate()
  fecha.setDate(Math.min(hoy.getDate(), ultimoDia))
  const dos = (n: number) => String(n).padStart(2, '0')
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`
}

/** Campos que la tarjeta nueva necesita y que el estado de cuenta no trajo (el backend los exige). */
export function faltantesDeTarjetaNueva(tarjeta: PayloadConfirmar['tarjeta']): string[] {
  const faltan: string[] = []
  if (!tarjeta?.banco) faltan.push('el banco')
  if (!tarjeta?.limiteCredito || tarjeta.limiteCredito <= 0) faltan.push('el límite de crédito')
  if (!tarjeta?.diaCorte) faltan.push('el día de corte')
  if (!tarjeta?.diaLimitePago) faltan.push('el día límite de pago')
  return faltan
}

/**
 * Guarda lo que el usuario revisó con UNA sola llamada: POST /api/v1/estados-cuenta/confirmar crea o actualiza
 * la tarjeta, el estado de cuenta, las compras a MSI y los movimientos en una transacción (todo o nada). La
 * clave de confirmación hace que reintentar el mismo envío no duplique nada (N1).
 */
export async function guardarEstadoCuenta(
  payload: PayloadConfirmar, destino: DestinoTarjeta, envio: EnvioConfirmacion,
): Promise<ResultadoGuardado> {
  // En modo de prueba (VITE_AUTH_MOCK) no hay backend: se guarda en el almacén local, sin transacción.
  if (MODO_PRUEBA) return guardarEnModoPrueba(payload, destino)
  if (destino.tipo === 'nueva') {
    const faltan = faltantesDeTarjetaNueva(payload.tarjeta)
    if (faltan.length > 0) throw new ApiError(0, `Para crear la tarjeta falta ${faltan.join(', ')}.`)
  }
  const r = await escribir(() =>
    apiFetch<ResultadoGuardado>(
      '/v1/estados-cuenta/confirmar',
      {
        method: 'POST',
        body: JSON.stringify({
          claveConfirmacion: envio.claveConfirmacion,
          destino: destino.tipo === 'existente'
            ? { tipo: 'existente', tarjetaId: destino.id }
            : { tipo: 'nueva', nombre: destino.nombre },
          fechaCorte: envio.fechaCorte,
          tarjeta: payload.tarjeta ?? {},
          movimientos: payload.movimientos,
          msi: payload.msi,
        }),
      },
    ),
  )
  return r
}

/**
 * Solo para VITE_AUTH_MOCK: guarda la tarjeta y las compras a MSI con el servicio de prueba. No es atómico y
 * no guarda movimientos; con el backend real se usa /confirmar.
 */
async function guardarEnModoPrueba(payload: PayloadConfirmar, destino: DestinoTarjeta): Promise<ResultadoGuardado> {
  const extraida = payload.tarjeta
  let tarjetaId: number

  if (destino.tipo === 'existente') {
    const actual = await finanzasService.obtenerTarjeta(destino.id)
    const datos: TarjetaPayload = {
      nombre: actual.nombre,
      banco: extraida?.banco ?? actual.banco,
      ultimos_4: actual.ultimos_4,
      limite_credito: extraida?.limiteCredito ?? actual.limite_credito,
      saldo_actual: extraida?.saldoActual ?? actual.saldo_actual,
      dia_corte: extraida?.diaCorte ?? actual.dia_corte,
      dia_pago: extraida?.diaLimitePago ?? actual.dia_pago,
      tasa_anual: extraida?.tasaAnual ?? actual.tasa_anual,
    }
    tarjetaId = (await finanzasService.actualizarTarjeta(destino.id, datos)).id
  } else {
    const faltan = faltantesDeTarjetaNueva(extraida)
    if (faltan.length > 0) throw new ApiError(0, `Para crear la tarjeta falta ${faltan.join(', ')}.`)
    tarjetaId = (
      await finanzasService.crearTarjeta({
        nombre: destino.nombre.trim(),
        banco: extraida?.banco ?? '',
        ultimos_4: null,
        limite_credito: extraida?.limiteCredito ?? 0,
        saldo_actual: extraida?.saldoActual ?? 0,
        dia_corte: extraida?.diaCorte ?? 1,
        dia_pago: extraida?.diaLimitePago ?? 1,
        tasa_anual: extraida?.tasaAnual ?? null,
      })
    ).id
  }

  let planesCreados = 0
  for (const msi of payload.msi) {
    const meses = msi.meses ?? 0
    const monto = msi.montoTotal ?? 0
    const plan: PlanMsiPayload = {
      descripcion: msi.descripcion.slice(0, 120),
      monto_original: monto,
      num_mensualidades: meses,
      mensualidades_pagadas: msi.mensualidadesPagadas,
      monto_mensualidad: calcularMensualidad(monto, meses),
      fecha_compra: msi.fechaCompra ?? fechaEstimadaDeCompra(msi.mensualidadesPagadas),
    }
    try {
      await finanzasService.crearPlanMsi(tarjetaId, plan)
      planesCreados++
    } catch (error) {
      throw new ApiError(
        0,
        `Se guardó la tarjeta y ${planesCreados} de ${payload.msi.length} compras a MSI, pero falló "${msi.descripcion}": ` +
          `${mensajeError(error)} Revisa Tarjetas antes de volver a intentarlo, para no duplicar lo que ya se guardó.`,
      )
    }
  }

  return {
    tarjetaId,
    tarjetaNueva: destino.tipo === 'nueva',
    planesCreados,
    movimientosGuardados: 0,
  }
}
