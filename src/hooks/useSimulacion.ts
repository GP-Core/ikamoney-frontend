import { useEffect, useState } from 'react'
import { calcularSimulacion } from '../services/simulador'
import type { PedidoSimulacion, SimulacionResponse } from '../types/simulador'

export type EstadoSimulacion = 'sin_pedido' | 'cargando' | 'ok' | 'error'

interface Resultado {
  clave: string
  data?: SimulacionResponse
  error?: string
}

function mensajeDeError(error: unknown): string {
  // fetch lanza TypeError cuando no hay conexión (backend apagado o CORS).
  if (error instanceof TypeError) return 'No se pudo conectar con el servidor.'
  if (error instanceof Error) return error.message
  return 'Ocurrió un error inesperado.'
}

/** Calcula la simulación de una compra. Al cambiar la compra o pulsar reintentar vuelve a pedirla. */
export function useSimulacion(pedido: PedidoSimulacion | null) {
  const [intento, setIntento] = useState(0)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const clave = `${JSON.stringify(pedido)}#${intento}`

  useEffect(() => {
    if (!pedido) return
    // Evita aplicar una respuesta vieja si la compra cambió o el componente se desmontó.
    let activo = true
    calcularSimulacion(pedido)
      .then((data) => activo && setResultado({ clave, data }))
      .catch((error) => activo && setResultado({ clave, error: mensajeDeError(error) }))
    return () => {
      activo = false
    }
  }, [pedido, clave])

  const actual = resultado?.clave === clave ? resultado : null
  const estado: EstadoSimulacion = !pedido ? 'sin_pedido' : actual === null ? 'cargando' : actual.error ? 'error' : 'ok'

  return {
    estado,
    data: actual?.data ?? null,
    error: actual?.error ?? null,
    reintentar: () => setIntento((n) => n + 1),
  }
}
