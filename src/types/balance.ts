// Contrato propuesto para GET /api/v1/balance (T33). Ver docs/PANTALLA_BALANCE.md.
// Todos los montos son números en pesos (MXN). Los meses van como "AAAA-MM".

/** Cifras de un mes. libre = ingresos − gastos_fijos − gastos_variables − msi. */
export interface MesBalance {
  mes: string
  ingresos: number
  gastos_fijos: number
  gastos_variables: number
  /** Suma de las mensualidades de MSI que vencen ese mes. */
  msi: number
  libre: number
}

/** Foto de todos los planes a meses sin intereses que siguen activos. */
export interface ResumenMsi {
  saldo_pendiente: number
  planes_activos: number
  /** Mes en que vence la última mensualidad; null si no hay planes activos. */
  ultimo_mes: string | null
}

export interface BalanceResponse {
  /** Mes consultado. */
  mes: string
  /** false si el usuario aún no capturó ingresos, gastos ni MSI. */
  tiene_datos: boolean
  /** El mes consultado, con gastos variables incluidos. */
  resumen: MesBalance
  /** Los meses siguientes, en orden. Solo traen gastos fijos y MSI (los variables no se pueden prever). */
  proyeccion: MesBalance[]
  msi: ResumenMsi
}
