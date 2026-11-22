import { useCallback, useEffect, useState } from 'react'
import { finanzasService } from '../services/finanzas'
import { movimientosService } from '../services/movimientos'
import { cuentasService } from '../services/cuentas'
import { conCopia } from '../services/offline'
import type { ConCopia } from '../services/offline'
import { mensajeError } from '../utils/errores'
import { useConexion } from './useConexion'

interface Estado<T> {
  /** Función que produjo estos datos; si cambia, los datos son de otra consulta. */
  para: unknown
  datos: T | null
  /** Fecha y hora de la copia mostrada; null si son datos de ahora (T60). */
  copiaDe: Date | null
  error: string | null
}

/** Ejecuta `cargar` al montar y cada vez que se llama a `recargar`. */
export function useCarga<T>(cargar: () => Promise<ConCopia<T>>) {
  const [estado, setEstado] = useState<Estado<T>>({ para: null, datos: null, copiaDe: null, error: null })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let activo = true
    cargar()
      .then(({ datos, copiaDe }) => activo && setEstado({ para: cargar, datos, copiaDe, error: null }))
      .catch((error) => activo && setEstado({ para: cargar, datos: null, copiaDe: null, error: mensajeError(error) }))
    return () => {
      activo = false
    }
  }, [cargar, version])

  const recargar = useCallback(() => setVersion((v) => v + 1), [])
  const vigente = estado.para === cargar

  return {
    datos: vigente ? estado.datos : null,
    copiaDe: vigente ? estado.copiaDe : null,
    error: vigente ? estado.error : null,
    cargando: !vigente,
    recargar,
  }
}

// Cada `cargar` depende de `enLinea`: al perder o recuperar la conexión se vuelve a consultar,
// y la pantalla pasa sola de los datos de ahora a la copia guardada (o al revés).

/** Tarjetas (con sus compras a MSI) y otras deudas del usuario. */
export function useTarjetasYDeudas() {
  const enLinea = useConexion()
  const cargar = useCallback(
    () =>
      conCopia('tarjetas-deudas', enLinea, async () => {
        const [tarjetas, deudas] = await Promise.all([finanzasService.listarTarjetas(), finanzasService.listarDeudas()])
        return { tarjetas, deudas }
      }),
    [enLinea],
  )
  return useCarga(cargar)
}

/** Ingresos y gastos de un mes (AAAA-MM) con sus totales. Cambiar de mes vuelve a consultar. */
export function useMovimientos(mes: string) {
  const enLinea = useConexion()
  const cargar = useCallback(
    () => conCopia(`movimientos:${mes}`, enLinea, () => movimientosService.listarMes(mes)),
    [mes, enLinea],
  )
  return useCarga(cargar)
}

/** Categorías para clasificar los gastos (las base del sistema y las del usuario). */
export function useCategorias() {
  const enLinea = useConexion()
  const cargar = useCallback(
    () => conCopia('categorias', enLinea, () => movimientosService.listarCategorias()),
    [enLinea],
  )
  return useCarga(cargar)
}

/** Una tarjeta con sus compras a MSI. Con id null no carga nada (formulario de alta). */
export function useTarjeta(id: number | null) {
  const enLinea = useConexion()
  const cargar = useCallback(
    () =>
      id === null
        ? Promise.resolve({ datos: null, copiaDe: null })
        : conCopia(`tarjeta:${id}`, enLinea, () => finanzasService.obtenerTarjeta(id)),
    [id, enLinea],
  )
  return useCarga(cargar)
}

/** Una deuda. Con id null no carga nada (formulario de alta). */
export function useDeuda(id: number | null) {
  const cargar = useCallback(
    () =>
      Promise.resolve(id === null ? null : finanzasService.obtenerDeuda(id)).then((datos) => ({ datos, copiaDe: null })),
    [id],
  )
  return useCarga(cargar)
}

/** Todas las cuentas del usuario: débito, ahorro, efectivo… y las tarjetas de crédito. */
export function useCuentas() {
  const enLinea = useConexion()
  const cargar = useCallback(() => conCopia('cuentas', enLinea, () => cuentasService.listar()), [enLinea])
  return useCarga(cargar)
}

/** Movimientos de una cuenta en un mes (AAAA-MM). Con cuentaId null no carga nada. */
export function useMovimientosCuenta(cuentaId: number | null, mes: string) {
  const enLinea = useConexion()
  const cargar = useCallback(
    () =>
      cuentaId === null
        ? Promise.resolve({ datos: null, copiaDe: null })
        : conCopia(`cuenta:${cuentaId}:${mes}`, enLinea, () => cuentasService.listarMovimientos(cuentaId, mes)),
    [cuentaId, mes, enLinea],
  )
  return useCarga(cargar)
}
