import type { PedidoSimulacion, SimulacionResponse } from '../types/simulador'
import { apiFetch, ApiError } from './api'
import { leerEscenarioSimulador, simulacionEjemplo } from './simuladorEjemplo'

/**
 * true = datos de ejemplo (sin backend); false = POST /api/v1/simulador/calcular (T40).
 * Se controla con VITE_SIMULADOR_USAR_EJEMPLO, aparte de las del balance y el score.
 */
export const SIMULADOR_USANDO_EJEMPLO = import.meta.env.VITE_SIMULADOR_USAR_EJEMPLO !== 'false'

export async function calcularSimulacion(pedido: PedidoSimulacion): Promise<SimulacionResponse> {
  if (SIMULADOR_USANDO_EJEMPLO) {
    const escenario = leerEscenarioSimulador()
    await new Promise((resolver) => setTimeout(resolver, 350))
    if (escenario === 'error') throw new Error('No se pudo calcular la simulación (escenario de prueba).')
    if (escenario === 'sin_ingresos') {
      throw new ApiError(400, 'Registra tus ingresos para poder simular una compra.')
    }
    return simulacionEjemplo(escenario)
  }

  // La respuesta del backend ya tiene la forma de SimulacionResponse: no hace falta adaptarla.
  // Sin `escenarios`, el backend evalúa contado y MSI a 3, 6, 12 y 18 meses.
  return apiFetch<SimulacionResponse>('/v1/simulador/calcular', {
    method: 'POST',
    body: JSON.stringify(pedido),
  })
}
