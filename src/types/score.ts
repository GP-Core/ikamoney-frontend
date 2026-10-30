/** Un factor del score y cuánto aporta. */
export interface FactorScore {
  /** Identificador del factor: dti, flujo, msi, utilizacion, pago... */
  clave: string
  /** Nombre en lenguaje de usuario. Si la API no lo manda, se usa el de utils/score.ts. */
  nombre?: string
  /** Dato del usuario que explica el factor (un porcentaje: 35 significa 35 %). */
  valor?: number
  /** Calificación del factor, de 0 a 100. */
  subpuntaje: number
  /** Aporte al score en puntos: positivo suma, negativo resta, cero es neutro. */
  puntos: number
  /** Una frase en lenguaje de usuario. Si la API no la manda, se arma en utils/score.ts. */
  explicacion?: string
  /** Sugerencia de mejora de este factor, si la hay. */
  sugerencia?: string | null
}

/** Dato que el usuario debe capturar para que se pueda calcular el score. */
export interface DatoFaltante {
  clave: string
  texto: string
  detalle?: string
}

export interface ScoreResponse {
  /** "completo": hay score y factores. "datos_faltantes": solo se muestra qué capturar. */
  estado: 'completo' | 'datos_faltantes'
  score: number | null
  /** Nivel con el nombre que use la API, por ejemplo "Atención" o "Riesgo". */
  nivel: string | null
  /** Hay un tope: el score calculado era mayor que el que se aplica (T26, CE-05). */
  tope_aplicado?: boolean
  score_calculado?: number | null
  motivo_tope?: string | null
  factores: FactorScore[]
  /** Sugerencia principal. Si falta, se usa la del factor que más resta. */
  sugerencia?: string | null
  faltantes: DatoFaltante[]
  avisos: string[]
}
