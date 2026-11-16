import type { EscenarioPedido, EscenarioSimulacion, PedidoSimulacion, Prioridad, Veredicto } from '../types/simulador'
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

const VALORES_PRIORIDAD: Prioridad[] = ['alta', 'media', 'baja']

/** "contado,msi-1-12" -> escenarios del pedido. Lo que no se entiende se ignora. */
function leerEscenarios(texto: string | null): EscenarioPedido[] {
  const lista: EscenarioPedido[] = []
  for (const parte of (texto ?? '').split(',')) {
    if (parte === 'contado') lista.push({ tipo: 'contado' })
    const msi = /^msi-(\d+)-(\d+)$/.exec(parte)
    if (msi) lista.push({ tipo: 'msi', tarjeta_id: Number(msi[1]), meses: Number(msi[2]) })
  }
  return lista
}

/** Lo inverso de leerEscenarios, para armar la URL desde el formulario. */
export function escenariosAUrl(escenarios: EscenarioPedido[]): string {
  return escenarios.map((e) => (e.tipo === 'contado' ? 'contado' : `msi-${e.tarjeta_id}-${e.meses}`)).join(',')
}

/**
 * La compra a simular sale de la URL (la captura de la compra es otra pantalla):
 *   /simulador?descripcion=Laptop&precio=9000&prioridad=media&ahorro=5000&escenarios=contado,msi-1-12
 * (`escenarios` es opcional: sin él, el backend compara contado y los plazos por omisión.)
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
  const prioridad = VALORES_PRIORIDAD.find((x) => x === p.get('prioridad')) ?? 'media'
  const ahorro = Number(p.get('ahorro'))
  const escenarios = leerEscenarios(p.get('escenarios'))
  return {
    descripcion: (p.get('descripcion') ?? '').trim().slice(0, 120) || 'Tu compra',
    precio,
    prioridad,
    ahorro_inicial: Number.isFinite(ahorro) && ahorro > 0 ? ahorro : 0,
    ...(escenarios.length > 0 && { escenarios }),
  }
}

/** Plazos MSI que se ofrecen como atajos (la tarjeta puede no aceptar todos: lo decide el backend). */
export const PLAZOS_MSI = [3, 6, 9, 12, 18, 24] as const

/** Máximo de escenarios por simulación (lo valida el backend con 422). */
export const MAX_ESCENARIOS = 6

/** Qué significa cada nivel; refleja RN-16 del motor: la prioridad decide qué tan estricto es el veredicto. */
export const OPCIONES_PRIORIDAD: { valor: Prioridad; etiqueta: string; ayuda: string }[] = [
  { valor: 'alta', etiqueta: 'Alta', ayuda: 'Es una necesidad: se recomienda si tu dinero alcanza, aunque tu índice baje.' },
  { valor: 'media', etiqueta: 'Media', ayuda: 'Se recomienda si tu dinero alcanza y tu índice no cae a En riesgo o Crítico.' },
  { valor: 'baja', etiqueta: 'Baja', ayuda: 'Es un gusto: solo se recomienda si tu índice no baja de nivel.' },
]

/** Convierte lo escrito ("12,300.50") en número; NaN si no es un monto válido. */
export function leerPrecio(texto: string): number {
  const limpio = texto.replace(/[\s$,]/g, '')
  if (limpio === '') return NaN
  return /^\d*\.?\d+$|^\d+\.$/.test(limpio) ? Number(limpio) : NaN
}

export function nombreTarjeta(t: { nombre: string; ultimos_4: string | null }): string {
  return t.ultimos_4 ? `${t.nombre} ••${t.ultimos_4}` : t.nombre
}
