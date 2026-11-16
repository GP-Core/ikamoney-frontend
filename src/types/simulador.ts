// Tipos del simulador de compras. Contrato: POST /api/v1/simulador/calcular
// (backend: docs/SIMULADOR_ENDPOINT.md y app/schemas/simulacion.py).

export type Prioridad = 'alta' | 'media' | 'baja'
export type Veredicto = 'recomendable' | 'con_precaucion' | 'no_recomendable'

/** Tarjeta tal como la devuelve GET /api/v1/tarjetas (solo lo que usa esta pantalla). */
export interface Tarjeta {
  id: number
  nombre: string
  banco: string
  ultimos_4: string | null
  limite_credito: number
  credito_disponible: number
  activa: boolean
}

/** Un escenario a comparar: contado, o MSI con tarjeta y plazo. */
export type EscenarioPedido =
  | { tipo: 'contado' }
  | { tipo: 'msi'; tarjeta_id: number; meses: number }

export interface SimulacionPedido {
  descripcion: string
  precio: number
  prioridad: Prioridad
  ahorro_inicial?: number
  escenarios?: EscenarioPedido[]
}

export interface MotivoNoAplica {
  codigo: 'PLAZO_NO_VALIDO' | 'TARJETA_NO_DISPONIBLE' | 'LIMITE_INSUFICIENTE' | 'ESCENARIO_REPETIDO'
  mensaje: string
}

export interface IndicadoresEscenario {
  flujo_minimo: number
  mes_flujo_minimo: number
  acumulado_minimo: number
  meses_en_negativo: number
  primer_mes_negativo: number | null
}

export interface ScoreSimulado {
  puntaje: number
  nivel: string
  nivel_texto: string
  cambio: number
}

/** Resultado de un escenario. Si `aplica` es false, `motivo` explica por qué. */
export interface EscenarioResultado {
  id: string
  tipo: 'contado' | 'msi'
  tarjeta_id: number | null
  tarjeta_nombre: string | null
  meses: number | null
  aplica: boolean
  motivo: MotivoNoAplica | null
  mensualidad: number | null
  indicadores: IndicadoresEscenario | null
  score: ScoreSimulado | null
  veredicto: Veredicto | null
  veredicto_texto: string | null
  regla: 'RN-15' | 'RN-16' | null
  razon: string | null
  menor_impacto: boolean
}

export interface SimulacionResultado {
  estado: 'calculado' | 'datos_faltantes' | 'sin_escenarios_validos'
  descripcion: string
  precio: number
  prioridad: Prioridad
  escenarios: EscenarioResultado[]
  menor_impacto: string | null
  veredicto: Veredicto | null
  veredicto_texto: string | null
  supuestos: string[]
}

/** Cuerpo de POST /api/v1/tarjetas (esquema TarjetaCrear del backend). Nunca el número completo. */
export interface TarjetaNueva {
  nombre: string
  banco: string
  ultimos_4?: string
  limite_credito: number
  saldo_actual?: number
  dia_corte: number
  dia_pago: number
  tasa_anual?: number
}
