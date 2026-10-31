/**
 * Respuesta de GET /api/v1/score (T35). Es la estructura de docs/SCORE.md del backend
 * y de app/schemas/score.py: si cambia allá, se actualiza aquí.
 */

export type NivelScore = 'saludable' | 'en_revision' | 'en_riesgo' | 'critico'

export type ClaveFactor =
  | 'relacion_deuda_ingreso'
  | 'utilizacion_credito'
  | 'flujo_libre'
  | 'carga_msi'
  | 'comportamiento_pago'

export interface FactorScore {
  clave: ClaveFactor
  nombre: string
  /** La fórmula de T25 en palabras. */
  formula: string
  /** false cuando el factor se omitió (sin tarjetas) y su peso se repartió entre los demás. */
  disponible: boolean
  /** Peso configurado, en %. */
  peso: number
  /** Peso realmente usado tras repartir los factores omitidos, en %. */
  peso_efectivo: number
  /** Valor del usuario en % (20.81 = 20.81 %). null en comportamiento de pago o si se omitió. */
  valor: number | null
  /** Solo en comportamiento de pago: pago_total, mas_del_minimo, solo_minimo o con_atraso. */
  categoria: string | null
  /** Calificación del factor, de 0 a 100. */
  subpuntaje: number | null
  /** Puntos que suma al score. */
  aporte: number
  /** Puntos que deja de sumar: peso_efectivo × (100 − subpuntaje) / 100. */
  puntos_perdidos: number
  /** Por qué obtuvo ese subpuntaje, con los números del usuario. */
  explicacion: string
  /** Acción concreta para mejorar el factor. */
  como_mejorar: string
  /** Por qué el factor pesa lo que pesa. */
  justificacion_peso: string
  /** Números con los que se calculó. */
  datos: Record<string, number | string>
}

export interface FaltanteScore {
  dato: 'ingresos' | 'gastos'
  /** true: sin este dato no hay score. */
  obligatorio: boolean
  mensaje: string
}

export interface ScoreResponse {
  /** "calculado": hay score y factores. "datos_faltantes": solo se muestra qué capturar. */
  estado: 'calculado' | 'datos_faltantes'
  /** Entero de 0 a 100. null si faltan datos. */
  puntaje: number | null
  /** Promedio ponderado antes del tope y del redondeo. */
  puntaje_bruto: number | null
  nivel: NivelScore | null
  /** Nivel listo para mostrar: "En revisión". */
  nivel_texto: string | null
  /** El score se limitó a 59 por flujo negativo o por pago con atraso. */
  tope_aplicado: boolean
  motivo_tope: 'flujo_negativo' | 'pago_con_atraso' | null
  /** Mes evaluado, AAAA-MM. */
  periodo: string
  version_modelo: string
  /** Siempre los cinco, en el orden de T25. Vacío si faltan datos. */
  factores: FactorScore[]
  /** Claves de los factores que pierden puntos, del que más pierde al que menos. */
  orden_mejora: ClaveFactor[]
  faltantes: FaltanteScore[]
  /** Supuestos usados en el cálculo, para mostrarlos al usuario. */
  supuestos: string[]
}
