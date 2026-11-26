// Lógica de la vista de Balance (T34, RF-36 y RF-40), sin React: horizonte y meses en negativo.
import type { MesBalance } from '../types/balance.ts'
import { mesNombre } from './formatMes.ts'

/** Cuántos meses se pueden ver en el balance (RF-40). */
export const HORIZONTES = [3, 6, 12] as const
export type Horizonte = (typeof HORIZONTES)[number]
/** RF-36 y US 6.4: la proyección se ve a 6 meses por defecto. */
export const HORIZONTE_DEFECTO: Horizonte = 6
/** Clave de localStorage; lleva el prefijo `ikamoney:`, así que se borra al cerrar sesión. */
export const CLAVE_HORIZONTE = 'ikamoney:horizonte-balance'

/** Lo guardado puede venir vacío o alterado: cualquier valor que no sea 3, 6 o 12 vuelve al de por defecto. */
export function leerHorizonte(guardado: string | null): Horizonte {
  const n = Number(guardado)
  return HORIZONTES.find((h) => h === n) ?? HORIZONTE_DEFECTO
}

/** Los primeros `horizonte` meses (el consultado cuenta como el primero). Acepta listas más cortas. */
export function recortarMeses<T>(meses: T[], horizonte: number): T[] {
  return meses.slice(0, Math.max(horizonte, 0))
}

/** Meses en los que el dinero no alcanza (libre menor a cero), en orden. */
export function mesesEnNegativo(meses: MesBalance[]): MesBalance[] {
  return meses.filter((m) => m.libre < 0)
}

/** "abril", "abril y mayo", "abril, mayo y junio". */
function listaDeMeses(nombres: string[]): string {
  if (nombres.length <= 1) return nombres.join('')
  return `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`
}

/** Frase que dice sin depender del color si algún mes se queda sin dinero. */
export function fraseDeMeses(meses: MesBalance[]): string {
  const negativos = mesesEnNegativo(meses)
  if (negativos.length === 0) return 'Todos tus meses cierran con dinero libre.'
  const nombres = negativos.map((m) => mesNombre(m.mes).toLowerCase())
  return `En ${negativos.length} de tus próximos ${meses.length} meses te faltaría dinero: ${listaDeMeses(nombres)}.`
}

export type TonoMes = 'bien' | 'justo' | 'mal'

/** El mes que corre o uno futuro. Los pasados no existen: la proyección empieza hoy. */
export type MomentoMes = 'actual' | 'proyeccion'

export function momentoDelMes(mes: string, hoy: string): MomentoMes {
  return mes > hoy ? 'proyeccion' : 'actual'
}

const TEXTO_ESTADO: Record<MomentoMes, Record<TonoMes, string>> = {
  actual: { bien: 'Vas bien este mes', justo: 'Te queda poco margen', mal: 'Este mes te pasas' },
  proyeccion: { bien: 'Se ve con margen', justo: 'Quedaría poco margen', mal: 'Podría faltarte dinero' },
}

/** Qué tan holgado va el mes, dicho en palabras sencillas. */
export function estadoDelMes(
  libre: number,
  ingresos: number,
  momento: MomentoMes = 'actual',
): { tono: TonoMes; texto: string } {
  const tono: TonoMes = libre < 0 ? 'mal' : ingresos <= 0 || libre / ingresos < 0.1 ? 'justo' : 'bien'
  return { tono, texto: TEXTO_ESTADO[momento][tono] }
}

/** Parte del ingreso que se recomienda no pasar en mensualidades de MSI (factor "carga de MSI" del score). */
export const REFERENCIA_MSI = 10

/** Un decimal: 11.509 → 11.5. */
const unDecimal = (n: number) => Math.round(n * 10) / 10
const centavos = (n: number) => Math.round(n * 100) / 100

/** Cuánto del ingreso del mes se va en MSI, y cuándo baja la mensualidad. */
export function cargaMsi(mes: MesBalance, meses: MesBalance[]) {
  const delIngreso = mes.ingresos > 0 ? unDecimal((mes.msi / mes.ingresos) * 100) : null
  // Primer mes en que baja el MSI: ahí se libera dinero.
  const i = meses.findIndex((m, indice) => indice > 0 && m.msi < meses[indice - 1].msi)
  const liberacion = i > 0 ? { mes: meses[i].mes, monto: centavos(meses[i - 1].msi - meses[i].msi) } : null

  return {
    mensualidad: mes.msi,
    delIngreso,
    arribaDeReferencia: delIngreso !== null && delIngreso > REFERENCIA_MSI,
    liberacion,
  }
}

export type ClaveArco = 'fijo' | 'variable' | 'msi' | 'tarjetas' | 'libre'

export const EXPLICACION_ARCO: Record<ClaveArco, string> = {
  fijo: 'Renta, servicios y lo que pagas igual cada mes.',
  variable: 'Súper, transporte o salidas: cambia de un mes a otro.',
  msi: 'Mensualidades de compras a meses sin intereses que vencen este mes.',
  tarjetas: 'Pagos mínimos de tus tarjetas y cuotas de otros préstamos.',
  libre: 'Lo que te queda después de todo lo anterior.',
}

/** Las partes del anillo del mes, cada una con su % del ingreso (null sin ingresos). */
export function partesDelAnillo(mes: MesBalance) {
  const valores: [ClaveArco, string, number][] = [
    ['fijo', 'Gastos fijos', mes.gastos_fijos],
    ['variable', 'Gastos variables', mes.gastos_variables],
    ['msi', 'MSI', mes.msi],
    ['tarjetas', 'Tarjetas y cuotas', mes.tarjetas ?? 0],
    ['libre', 'Libre', Math.max(mes.libre, 0)],
  ]
  return valores.map(([clave, nombre, valor]) => ({
    clave,
    nombre,
    valor,
    delIngreso: mes.ingresos > 0 ? Math.round((valor / mes.ingresos) * 100) : null,
  }))
}

/**
 * La cuenta del mes en tres pasos: lo que entra, lo que sale y lo que sobra; y el dinero al cierre,
 * que es lo que había en las cuentas más lo que ha sobrado desde el mes actual.
 */
export function desgloseDelMes(mes: MesBalance, enCuentas?: number) {
  const sale = centavos(mes.gastos_fijos + mes.gastos_variables + (mes.tarjetas ?? 0) + mes.msi)
  const cierre = mes.acumulado ?? null
  return {
    entra: mes.ingresos,
    sale,
    sobra: mes.libre,
    cierre,
    enCuentas: enCuentas ?? null,
    sobranteAcumulado: cierre !== null && enCuentas !== undefined ? centavos(cierre - enCuentas) : null,
  }
}

export type ClaveParte = 'comprometido' | 'variable' | 'libre'

export interface ParteMes {
  clave: ClaveParte
  nombre: string
  valor: number
  /** Dónde empieza el tramo en la barra, en % (0 a 100). */
  inicio: number
  ancho: number
  /** % del ingreso; null si no hay ingresos. */
  delIngreso: number | null
}

/** Los tres tramos de la barra del resumen del mes. */
export function partesDelMes(mes: MesBalance): ParteMes[] {
  const valores: [ClaveParte, string, number][] = [
    ['comprometido', 'Comprometido', mes.gastos_fijos + (mes.tarjetas ?? 0) + mes.msi],
    ['variable', 'Variable', mes.gastos_variables],
    ['libre', 'Libre', Math.max(mes.libre, 0)],
  ]
  // Base de la barra: lo mayor entre lo que entra y lo que sale, para que nunca se desborde.
  const base = Math.max(mes.ingresos, valores.reduce((suma, [, , v]) => suma + v, 0), 1)
  let acumulado = 0
  return valores.map(([clave, nombre, valor]) => {
    const inicio = (acumulado / base) * 100
    acumulado += valor
    const delIngreso = mes.ingresos > 0 ? Math.round((valor / mes.ingresos) * 100) : null
    return { clave, nombre, valor, inicio, ancho: (valor / base) * 100, delIngreso }
  })
}

export interface CambioMes {
  /** Cuánto más (o menos) queda libre que el mes anterior. */
  libre: number
  msi: number
  /** Solo cuando la diferencia de MSI explica al menos la mitad del cambio. */
  motivo: 'msi_termina' | 'msi_inicia' | null
}

export function cambioEntreMeses(anterior: MesBalance, actual: MesBalance): CambioMes {
  const libre = actual.libre - anterior.libre
  const msi = actual.msi - anterior.msi
  const motivo =
    msi < 0 && libre > 0 && -msi >= libre / 2
      ? 'msi_termina'
      : msi > 0 && libre < 0 && msi >= -libre / 2
        ? 'msi_inicia'
        : null
  return { libre, msi, motivo }
}
