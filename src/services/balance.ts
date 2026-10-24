import type { BalanceResponse, MesBalance } from '../types/balance'
import { apiFetch } from './api'
import { balanceEjemplo, leerEscenario } from './balanceEjemplo'

export const USANDO_EJEMPLO = import.meta.env.VITE_USAR_DATOS_EJEMPLO !== 'false'

/** Meses que se muestran, contando el consultado. */
const MESES = 6
/** Meses que se piden al backend (máximo de T33), para calcular el resumen de MSI completo. */
const MESES_API = 24

// Forma de GET /api/v1/proyeccion (T33).
interface MesApi {
  mes: number
  periodo: string // "AAAA-MM"
  ingresos: number
  gastos_fijos: number
  gastos_variables: number
  pagos_tarjetas: number
  mensualidades_msi: number
  otras_cuotas: number
  flujo: number
  msi_activos: number
}

interface ProyeccionApi {
  estado: string // "completo" | "sin_datos" | "sin_ingresos"
  avisos: string[]
  proyeccion: MesApi[]
}

function aMesBalance(m: MesApi): MesBalance {
  return {
    mes: m.periodo,
    ingresos: m.ingresos,
    gastos_fijos: m.gastos_fijos,
    gastos_variables: m.gastos_variables,
    msi: m.mensualidades_msi,
    tarjetas: m.pagos_tarjetas + m.otras_cuotas,
    libre: m.flujo,
  }
}

export async function obtenerBalance(mes: string): Promise<BalanceResponse> {
  if (USANDO_EJEMPLO) {
    const escenario = leerEscenario()
    await new Promise((resolver) => setTimeout(resolver, 350))
    if (escenario === 'error') throw new Error('No se pudo cargar el balance (escenario de prueba).')
    return balanceEjemplo(mes, escenario)
  }

  const r = await apiFetch<ProyeccionApi>(`/v1/proyeccion?meses=${MESES_API}&ahorro_inicial=0`)

  if (r.estado === 'sin_datos' || r.proyeccion.length === 0) {
    const cero: MesBalance = { mes, ingresos: 0, gastos_fijos: 0, gastos_variables: 0, msi: 0, libre: 0 }
    return { mes, tiene_datos: false, resumen: cero, proyeccion: [], msi: { saldo_pendiente: 0, planes_activos: 0, ultimo_mes: null } }
  }

  const desde = r.proyeccion.findIndex((m) => m.periodo === mes)
  if (desde === -1) {
    throw new Error('Solo hay proyección desde el mes actual hasta 24 meses adelante.')
  }

  const visibles = r.proyeccion.slice(desde, desde + MESES).map(aMesBalance)
  const conMsi = r.proyeccion.filter((m) => m.msi_activos > 0)

  return {
    mes,
    tiene_datos: true,
    resumen: visibles[0],
    proyeccion: visibles.slice(1),
    msi: {
      saldo_pendiente: r.proyeccion.reduce((s, m) => s + m.mensualidades_msi, 0),
      planes_activos: r.proyeccion[0].msi_activos,
      ultimo_mes: conMsi.length ? conMsi[conMsi.length - 1].periodo : null,
    },
  }
}