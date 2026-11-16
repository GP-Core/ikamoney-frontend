import type { EscenarioResultado, SimulacionPedido, SimulacionResultado, Veredicto } from '../types/simulador'
import { apiFetch } from './api'
import { obtenerTarjetas } from './tarjetas'

/**
 * true = resultado simulado aquí (sin backend); false = POST /api/v1/simulador/calcular.
 * Se controla con VITE_SIMULADOR_USAR_EJEMPLO.
 */
export const SIMULADOR_USANDO_EJEMPLO = import.meta.env.VITE_SIMULADOR_USAR_EJEMPLO !== 'false'

export async function simularCompra(pedido: SimulacionPedido): Promise<SimulacionResultado> {
  if (!SIMULADOR_USANDO_EJEMPLO) {
    return apiFetch<SimulacionResultado>('/v1/simulador/calcular', { method: 'POST', body: JSON.stringify(pedido) })
  }

  // Simulación local solo para probar la pantalla: NO replica el motor (score, balance mensual).
  await new Promise((resolver) => setTimeout(resolver, 500))
  const tarjetas = await obtenerTarjetas()
  const base = { indicadores: null, score: null, veredicto: null, veredicto_texto: null, regla: null, razon: null, menor_impacto: false }

  const escenarios = (pedido.escenarios ?? []).map((e): EscenarioResultado => {
    if (e.tipo === 'contado') {
      return { ...base, id: 'contado', tipo: 'contado', tarjeta_id: null, tarjeta_nombre: null, meses: null, aplica: true, motivo: null, mensualidad: pedido.precio }
    }
    const t = tarjetas.find((x) => x.id === e.tarjeta_id)
    const id = `msi-${e.tarjeta_id}-${e.meses}`
    const comun = { ...base, id, tipo: 'msi' as const, tarjeta_id: e.tarjeta_id, tarjeta_nombre: t?.nombre ?? null, meses: e.meses }
    if (!t || t.credito_disponible < pedido.precio) {
      return { ...comun, aplica: false, mensualidad: null, motivo: { codigo: 'LIMITE_INSUFICIENTE', mensaje: 'El crédito disponible de la tarjeta no alcanza para esta compra.' } }
    }
    return { ...comun, aplica: true, motivo: null, mensualidad: Math.round((pedido.precio / e.meses) * 100) / 100 }
  })

  for (const e of escenarios) {
    if (!e.aplica || e.mensualidad === null) continue
    const negativos = e.mensualidad > 4000 ? 1 : 0
    const v: Veredicto = negativos ? 'no_recomendable' : pedido.prioridad === 'baja' ? 'con_precaucion' : 'recomendable'
    e.indicadores = { flujo_minimo: 0, mes_flujo_minimo: 1, acumulado_minimo: 0, meses_en_negativo: negativos, primer_mes_negativo: negativos ? 1 : null }
    e.veredicto = v
    e.regla = negativos ? 'RN-15' : 'RN-16'
    e.razon = negativos ? 'En al menos un mes tu dinero no alcanzaría para cubrir tus gastos y pagos.' : 'Ejemplo: tu dinero alcanza todos los meses.'
    e.veredicto_texto = { recomendable: 'Recomendable', con_precaucion: 'Con precaución', no_recomendable: 'No recomendable' }[v]
  }
  const mejor = escenarios.filter((e) => e.aplica).sort((a, b) => (a.indicadores?.meses_en_negativo ?? 0) - (b.indicadores?.meses_en_negativo ?? 0))[0]
  if (mejor) mejor.menor_impacto = true

  return {
    estado: mejor ? 'calculado' : 'sin_escenarios_validos',
    descripcion: pedido.descripcion,
    precio: pedido.precio,
    prioridad: pedido.prioridad,
    escenarios,
    menor_impacto: mejor?.id ?? null,
    veredicto: mejor?.veredicto ?? null,
    veredicto_texto: mejor?.veredicto_texto ?? null,
    supuestos: ['Resultado de ejemplo: no usa tus datos reales.'],
  }
}
