import type { BalanceResponse, MesBalance } from '../types/balance'
import { sumarMeses } from '../utils/formatMes'

/**
 * Datos de ejemplo para la demo y para trabajar antes de que exista el endpoint de T33.
 * Se elige el escenario con ?demo= en la URL:
 *   (nada)    → usuario con datos
 *   apretado  → meses en los que el libre es negativo
 *   vacio     → usuario nuevo, sin datos
 *   error     → falla la carga
 */
export type Escenario = 'normal' | 'apretado' | 'vacio' | 'error'

// Planes MSI de ejemplo: mensualidad y mensualidades que faltan.
const PLANES = [
  { mensualidad: 1000, restantes: 10 },
  { mensualidad: 1650, restantes: 4 },
  { mensualidad: 550, restantes: 8 },
]

const MESES_PROYECCION = 5

function msiDelMes(indice: number): number {
  return PLANES.filter((p) => p.restantes > indice).reduce((s, p) => s + p.mensualidad, 0)
}

function armarMes(mes: string, indice: number, ingresos: number): MesBalance {
  const gastos_fijos = 12200
  const gastos_variables = indice === 0 ? 4800 : 0
  const msi = msiDelMes(indice)
  return { mes, ingresos, gastos_fijos, gastos_variables, msi, libre: ingresos - gastos_fijos - gastos_variables - msi }
}

export function leerEscenario(): Escenario {
  const valor = new URLSearchParams(window.location.search).get('demo')
  return valor === 'apretado' || valor === 'vacio' || valor === 'error' ? valor : 'normal'
}

export function balanceEjemplo(mes: string, escenario: Escenario): BalanceResponse {
  if (escenario === 'vacio') {
    const cero: MesBalance = { mes, ingresos: 0, gastos_fijos: 0, gastos_variables: 0, msi: 0, libre: 0 }
    return {
      mes,
      tiene_datos: false,
      resumen: cero,
      proyeccion: Array.from({ length: MESES_PROYECCION }, (_, i) => ({ ...cero, mes: sumarMeses(mes, i + 1) })),
      msi: { saldo_pendiente: 0, planes_activos: 0, ultimo_mes: null },
    }
  }

  const ingresos = escenario === 'apretado' ? 19500 : 30000
  const saldo = PLANES.reduce((s, p) => s + p.mensualidad * p.restantes, 0)
  const mayor = Math.max(...PLANES.map((p) => p.restantes))

  return {
    mes,
    tiene_datos: true,
    resumen: armarMes(mes, 0, ingresos),
    proyeccion: Array.from({ length: MESES_PROYECCION }, (_, i) => armarMes(sumarMeses(mes, i + 1), i + 1, ingresos)),
    msi: { saldo_pendiente: saldo, planes_activos: PLANES.length, ultimo_mes: sumarMeses(mes, mayor - 1) },
  }
}
