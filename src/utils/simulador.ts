import type { EscenarioSimulacion, PedidoSimulacion, Prioridad, Veredicto } from '../types/simulador'
import { mesNombre } from './formatMes'
import { pesos } from './pesos'
import type { Tono } from './score'
import { PEDIDO_EJEMPLO } from '../services/simuladorEjemplo'

/**
 * El veredicto viene del backend; aquí solo se elige su estado del semáforo de T20:
 * recomendable → Sano, con precaución → Precaución, no recomendable → Riesgo.
 */
export const TONO_VEREDICTO: Record<Veredicto, Tono> = {
  recomendable: 'bien',
  con_precaucion: 'atencion',
  no_recomendable: 'riesgo',
}

export const TEXTO_PRIORIDAD: Record<Prioridad, string> = {
  alta: 'prioridad alta',
  media: 'prioridad media',
  baja: 'prioridad baja',
}

/** "De contado" / "12 meses sin intereses". */
export function nombreEscenario(e: EscenarioSimulacion): string {
  return e.tipo === 'contado' ? 'De contado' : `${e.meses} meses sin intereses`
}

/** Para la gráfica: "Contado" / "12 MSI". */
export function nombreCorto(e: EscenarioSimulacion): string {
  return e.tipo === 'contado' ? 'Contado' : `${e.meses} MSI`
}

/** El mes en que el dinero disponible llega a su punto más bajo. */
export function mesMasJusto(e: EscenarioSimulacion): { periodo: string; acumulado: number } | null {
  if (e.balance.length === 0) return null
  const peor = e.balance.reduce((a, m) => (m.acumulado < a.acumulado ? m : a))
  return { periodo: peor.periodo, acumulado: peor.acumulado }
}

/**
 * El dato que acompaña al veredicto, con las cifras de la proyección. Informa, no juzga:
 * qué le queda disponible al usuario en su mes más justo.
 */
export function datoDelEscenario(e: EscenarioSimulacion): string | null {
  const justo = mesMasJusto(e)
  if (!justo || !e.indicadores) return null
  const mes = mesNombre(justo.periodo).toLowerCase()
  const negativos = e.indicadores.meses_en_negativo
  if (negativos > 1) {
    return `En ${negativos} meses no te alcanzaría. El más justo es ${mes}: te faltarían ${pesos(Math.abs(justo.acumulado))}.`
  }
  if (negativos === 1) {
    return `En ${mes} te faltarían ${pesos(Math.abs(justo.acumulado))} para cubrir tus gastos y pagos.`
  }
  return `Tu mes más justo es ${mes}: te quedan ${pesos(justo.acumulado)} disponibles.`
}

const PRIORIDADES: Prioridad[] = ['alta', 'media', 'baja']

/**
 * La compra a simular sale de la URL (la captura de la compra es otra pantalla):
 *   /?simulador&descripcion=Laptop&precio=9000&prioridad=media&ahorro=5000
 * Con datos de ejemplo, si falta el precio se usa la compra de ejemplo. Con el backend, sin
 * precio válido devuelve null y la pantalla pide capturar la compra.
 */
export function leerPedidoDeUrl(busqueda: string, usandoEjemplo: boolean): PedidoSimulacion | null {
  const p = new URLSearchParams(busqueda)
  const precio = Number(p.get('precio'))
  const hayPrecio = p.has('precio') && Number.isFinite(precio) && precio > 0
  if (!hayPrecio) {
    if (!usandoEjemplo) return null
    return p.get('demo') === 'sin_opcion' ? PEDIDO_EJEMPLO.sin_opcion : PEDIDO_EJEMPLO.normal
  }
  const prioridad = PRIORIDADES.find((x) => x === p.get('prioridad')) ?? 'media'
  const ahorro = Number(p.get('ahorro'))
  return {
    descripcion: (p.get('descripcion') ?? '').trim().slice(0, 120) || 'Tu compra',
    precio,
    prioridad,
    ahorro_inicial: Number.isFinite(ahorro) && ahorro > 0 ? ahorro : 0,
  }
}
