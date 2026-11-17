/**
 * Contrato de POST /api/v1/simulador/calcular (T40, motor de T41). Es app/schemas/simulacion.py
 * del backend, con los mismos nombres en snake_case: si cambia allá, se actualiza aquí.
 */
import type { NivelScore } from './score'

export type Prioridad = 'alta' | 'media' | 'baja'
export type Veredicto = 'recomendable' | 'con_precaucion' | 'no_recomendable'

/** Una forma de pago a comparar. Si se omite `escenarios`, el backend arma los de por omisión. */
export interface EscenarioPedido {
  tipo: 'contado' | 'msi'
  tarjeta_id?: number
  meses?: number
}

/** Cuerpo de la petición. */
export interface PedidoSimulacion {
  descripcion: string
  precio: number
  prioridad: Prioridad
  ahorro_inicial: number
  escenarios?: EscenarioPedido[]
}

export type CodigoMotivo = 'PLAZO_NO_VALIDO' | 'TARJETA_NO_DISPONIBLE' | 'LIMITE_INSUFICIENTE' | 'ESCENARIO_REPETIDO'

export interface MotivoSimulacion {
  codigo: CodigoMotivo
  mensaje: string
}

/** Un mes de la proyección con la compra incluida. */
export interface MesSimulado {
  /** 1 = mes en curso. */
  mes: number
  /** AAAA-MM. */
  periodo: string
  ingresos: number
  gastos: number
  compromisos: number
  /** Lo que cuesta la compra ese mes. */
  compra: number
  flujo: number
  /** Dinero disponible: ahorro inicial + flujos. Es lo que dibuja la gráfica. */
  acumulado: number
}

export interface IndicadoresSimulacion {
  flujo_minimo: number
  mes_flujo_minimo: number
  acumulado_minimo: number
  meses_en_negativo: number
  primer_mes_negativo: number | null
}

export interface ScoreSimulado {
  puntaje: number
  puntaje_bruto: number
  nivel: NivelScore
  nivel_texto: string
  tope_aplicado: boolean
  motivo_tope: string | null
  /** Puntaje simulado âˆ’ puntaje actual. */
  cambio: number
}

export interface EscenarioSimulacion {
  /** "contado" o "msi-<tarjeta_id>-<meses>". */
  id: string
  tipo: 'contado' | 'msi'
  tarjeta_id: number | null
  tarjeta_nombre: string | null
  meses: number | null
  aplica: boolean
  /** Solo si aplica = false. */
  motivo: MotivoSimulacion | null
  /** Contado: el precio completo este mes. MSI: precio ÷ meses. null si no aplica. */
  mensualidad: number | null
  /** Vacío si no aplica. */
  balance: MesSimulado[]
  indicadores: IndicadoresSimulacion | null
  score: ScoreSimulado | null
  /** Lo decide el motor con reglas fijas (RN-15 y RN-16). La pantalla no lo recalcula. */
  veredicto: Veredicto | null
  veredicto_texto: string | null
  regla: 'RN-15' | 'RN-16' | null
  /** Por qué, con reglas fijas. No es la explicación de la IA. */
  razon: string | null
  menor_impacto: boolean
}

export interface ScoreActual {
  puntaje: number
  nivel: NivelScore
  nivel_texto: string
}

export interface FaltanteSimulacion {
  dato: string
  obligatorio: boolean
  mensaje: string
}

export interface SimulacionResponse {
  /** "datos_faltantes" no llega al cliente: el backend lo convierte en el 400 SIN_INGRESOS. */
  estado: 'calculado' | 'datos_faltantes' | 'sin_escenarios_validos'
  /** AAAA-MM del mes 1. */
  periodo: string
  descripcion: string
  precio: number
  prioridad: Prioridad
  /** Horizonte de la proyección, en meses. */
  meses: number
  score_actual: ScoreActual | null
  escenarios: EscenarioSimulacion[]
  /** Id del escenario de menor impacto. null si ninguno aplica. */
  menor_impacto: string | null
  /** Veredicto general: el del escenario de menor impacto. */
  veredicto: Veredicto | null
  veredicto_texto: string | null
  faltantes: FaltanteSimulacion[]
  supuestos: string[]
  version_modelo: string
}
