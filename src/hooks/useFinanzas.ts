import { useCallback, useEffect, useState } from 'react'
import { finanzasService } from '../services/finanzas'
import { mensajeError } from '../utils/errores'

interface Estado<T> {
  /** Función que produjo estos datos; si cambia, los datos son de otra consulta. */
  para: unknown
  datos: T | null
  error: string | null
}

/** Ejecuta `cargar` al montar y cada vez que se llama a `recargar`. */
function useCarga<T>(cargar: () => Promise<T>) {
  const [estado, setEstado] = useState<Estado<T>>({ para: null, datos: null, error: null })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let activo = true
    cargar()
      .then((datos) => activo && setEstado({ para: cargar, datos, error: null }))
      .catch((error) => activo && setEstado({ para: cargar, datos: null, error: mensajeError(error) }))
    return () => {
      activo = false
    }
  }, [cargar, version])

  const recargar = useCallback(() => setVersion((v) => v + 1), [])
  const vigente = estado.para === cargar

  return {
    datos: vigente ? estado.datos : null,
    error: vigente ? estado.error : null,
    cargando: !vigente,
    recargar,
  }
}

/** Tarjetas (con sus compras a MSI) y otras deudas del usuario. */
export function useTarjetasYDeudas() {
  const cargar = useCallback(async () => {
    const [tarjetas, deudas] = await Promise.all([finanzasService.listarTarjetas(), finanzasService.listarDeudas()])
    return { tarjetas, deudas }
  }, [])
  return useCarga(cargar)
}

/** Una tarjeta con sus compras a MSI. Con id null no carga nada (formulario de alta). */
export function useTarjeta(id: number | null) {
  const cargar = useCallback(() => (id === null ? Promise.resolve(null) : finanzasService.obtenerTarjeta(id)), [id])
  return useCarga(cargar)
}

/** Una deuda. Con id null no carga nada (formulario de alta). */
export function useDeuda(id: number | null) {
  const cargar = useCallback(() => (id === null ? Promise.resolve(null) : finanzasService.obtenerDeuda(id)), [id])
  return useCarga(cargar)
}