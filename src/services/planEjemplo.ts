import type { PlanResponse, PriorizadorResponse } from '../types/plan'
import { mesActual } from '../utils/formatMes'
import { desplazarMeses, indiceDeEjemplo, mesesEntre } from '../utils/planVista'

/** Los ejemplos están calculados cada $500; la pantalla de ejemplo mueve el control en ese paso. */
export const PASO_EJEMPLO = 500

/**
 * Escenario de ejemplo, con ?demo= en la URL (junto a ?plan):
 *   (nada)    → dos tarjetas, un préstamo y dos MSI
 *   atrapado  → un crédito cuyo pago no cubre sus intereses
 *   vacio     → sin deudas con intereses
 *   error     → falla la carga
 */
export type EscenarioPlan = 'normal' | 'atrapado' | 'sin_deudas' | 'error'

export function leerEscenarioPlan(): EscenarioPlan {
  const demo = new URLSearchParams(window.location.search).get('demo')
  if (demo === 'atrapado' || demo === 'error') return demo
  return demo === 'vacio' ? 'sin_deudas' : 'normal'
}

type PlanRecortado = Omit<PlanResponse, 'escenario_base' | 'escenario_base_texto' | 'supuestos'>

interface Ejemplos {
  mesBase: string
  paso: number
  escenarios: Record<
    Exclude<EscenarioPlan, 'error'>,
    {
      respuesta: Omit<PriorizadorResponse, 'plan'>
      plan_comun: Pick<PlanResponse, 'escenario_base' | 'escenario_base_texto' | 'supuestos'> | null
      planes: PlanRecortado[]
    }
  >
}

/**
 * Respuesta de ejemplo. No se calcula aquí: planEjemplo.json es la respuesta real del backend
 * (scripts/generar_plan_ejemplo.py), para que ejemplo y backend muestren las mismas cifras.
 * Se corren los meses para que el primero sea el mes actual.
 */
export async function planEjemplo(extra: number): Promise<PriorizadorResponse> {
  const escenario = leerEscenarioPlan()
  if (escenario === 'error') throw new Error('No se pudo cargar tu plan (escenario de prueba).')

  const ejemplos = (await import('./planEjemplo.json')).default as unknown as Ejemplos
  const { respuesta, plan_comun, planes } = ejemplos.escenarios[escenario]
  const delta = mesesEntre(ejemplos.mesBase, mesActual())

  if (!plan_comun || planes.length === 0) return desplazarMeses({ ...respuesta, plan: null }, delta)

  const plan = { ...plan_comun, ...planes[indiceDeEjemplo(extra, ejemplos.paso, planes.length)] }
  return desplazarMeses({ ...respuesta, plan }, delta)
}
