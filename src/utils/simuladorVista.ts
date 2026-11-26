// Lógica de presentación del resultado del simulador, sin React. El veredicto lo calcula el backend.
import type { EscenarioSimulacion, SimulacionResponse } from '../types/simulador.ts'

/** La sugerida (menor impacto) primero; el resto, en el orden del backend. */
export function ordenarConSugerida<T extends { id: string }>(escenarios: T[], sugerida: string | null): T[] {
  return [...escenarios].sort((a, b) => Number(b.id === sugerida) - Number(a.id === sugerida))
}

export function formaDePago(e: Pick<EscenarioSimulacion, 'tipo' | 'meses'>): string {
  return e.tipo === 'contado' ? 'de contado' : `a ${e.meses} meses sin intereses`
}

/**
 * "Recomendable a 18 meses sin intereses": sin la forma de pago, el titular parece valer para todas.
 * Si no es recomendable se deja el texto del backend.
 */
export function titularVeredicto(
  data: Pick<SimulacionResponse, 'veredicto' | 'veredicto_texto' | 'menor_impacto' | 'escenarios'>,
): string {
  if (!data.veredicto) return 'Ninguna forma de pago aplica por ahora'
  const sugerida = data.escenarios.find((e) => e.id === data.menor_impacto && e.aplica)
  if (!sugerida || data.veredicto === 'no_recomendable') return data.veredicto_texto ?? ''
  return `${data.veredicto_texto} ${formaDePago(sugerida)}`
}

/** Tonos de violeta para los plazos de MSI: el más corto, el más oscuro. */
const VIOLETAS = ['#3a2a6e', '#55429a', '#6b55b8', '#8672c9', '#9d8dd5', '#b3a6df']
const VIOLETAS_POCOS = ['#43327e', '#6b55b8', '#9d8dd5']

/** Color de cada línea de la gráfica según la forma de pago: azul el contado, violeta los MSI. */
export function coloresPorFormaDePago(
  escenarios: Pick<EscenarioSimulacion, 'id' | 'tipo' | 'meses'>[],
): Map<string, string> {
  const msi = escenarios.filter((e) => e.tipo === 'msi').sort((a, b) => (a.meses ?? 0) - (b.meses ?? 0))
  const tonos = msi.length <= VIOLETAS_POCOS.length ? VIOLETAS_POCOS : VIOLETAS
  const colores = new Map<string, string>(msi.map((e, i) => [e.id, tonos[i % tonos.length]]))
  for (const e of escenarios) if (e.tipo === 'contado') colores.set(e.id, 'var(--azul)')
  return colores
}

// ---------- Elegir y registrar ----------

/** La que empieza elegida: la sugerida. Si no es recomendable, ninguna: decide el usuario. */
export function eleccionInicial(
  data: Pick<SimulacionResponse, 'veredicto' | 'menor_impacto' | 'escenarios'>,
): string | null {
  if (!data.veredicto || data.veredicto === 'no_recomendable') return null
  return data.escenarios.find((e) => e.id === data.menor_impacto && e.aplica)?.id ?? null
}

/** Patrón de grupo de radio: flechas con vuelta en los extremos, Inicio y Fin. null: otra tecla. */
export function opcionVecina(ids: string[], actual: string, tecla: string): string | null {
  const n = ids.length
  const i = ids.indexOf(actual)
  if (tecla === 'ArrowRight' || tecla === 'ArrowDown') return ids[(i + 1) % n]
  if (tecla === 'ArrowLeft' || tecla === 'ArrowUp') return ids[(i - 1 + n) % n]
  if (tecla === 'Home') return ids[0]
  if (tecla === 'End') return ids[n - 1]
  return null
}

/** Qué se va a registrar (`resumen`) y qué va a pasar al guardarlo (`efecto`). */
export function textoRegistro(
  e: Pick<EscenarioSimulacion, 'tipo' | 'meses' | 'mensualidad' | 'tarjeta_nombre'>,
  compra: { descripcion: string; precio: number; cuenta: string | null; formatear: (n: number) => string },
): { resumen: string; efecto: string } {
  const { descripcion, precio, cuenta, formatear } = compra
  if (e.tipo === 'msi') {
    const tarjeta = e.tarjeta_nombre ?? 'tu tarjeta'
    return {
      resumen: `${descripcion} en ${tarjeta}, a ${e.meses} meses de ${formatear(e.mensualidad ?? 0)}.`,
      efecto: `Se suma a tus compras a MSI de ${tarjeta} y ocupa ${formatear(precio)} de tu crédito disponible.`,
    }
  }
  return {
    resumen: `${descripcion}, ${formatear(precio)} hoy.`,
    efecto: cuenta
      ? `Se registra como un gasto de hoy y sale de ${cuenta}.`
      : 'Se registra como un gasto de hoy, sin cambiar ningún saldo.',
  }
}

export function cambioDeScore(
  e: Pick<EscenarioSimulacion, 'score'>, actual: { puntaje: number } | null,
): string | null {
  if (!e.score || !actual) return null
  if (e.score.puntaje === actual.puntaje) return `Tu score se quedaría en ${actual.puntaje}.`
  return `Tu score pasaría de ${actual.puntaje} a ${e.score.puntaje}.`
}

/** Un gasto pide al menos 3 letras de concepto; "TV" se guarda como "Compra TV". */
export function conceptoDeGasto(descripcion: string): string {
  const texto = descripcion.trim()
  return (texto.length >= 3 ? texto : `Compra ${texto}`).slice(0, 120)
}
