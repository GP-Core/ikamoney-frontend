import { pesos } from './pesos'

/** Los cuatro estados del semáforo de T20. */
export type NivelSemaforo = 'sano' | 'precaucion' | 'riesgo' | 'critico'

export const ETIQUETA_SEMAFORO: Record<NivelSemaforo, string> = {
  sano: 'Sano',
  precaucion: 'Precaución',
  riesgo: 'Riesgo',
  critico: 'Crítico',
}

/**
 * Umbrales PROVISIONALES de qué tan cara es una deuda, según su tasa anual.
 * Ni T20 ni T26 los definen: confirmar con Ramón y, si el motor devuelve el nivel, usar el suyo.
 */
export const UMBRALES_TASA = { precaucion: 1, riesgo: 30, critico: 50 }

export function nivelDeTasa(tasaAnual: number): NivelSemaforo {
  if (tasaAnual >= UMBRALES_TASA.critico) return 'critico'
  if (tasaAnual >= UMBRALES_TASA.riesgo) return 'riesgo'
  if (tasaAnual >= UMBRALES_TASA.precaucion) return 'precaucion'
  return 'sano'
}

/** "$1,160" (redondea a pesos enteros). */
export function dinero(monto: number): string {
  return pesos(Math.round(monto))
}

/** 5.8 → "5.8"; 60 → "60". */
export function numero(valor: number): string {
  return String(Math.round(valor * 10) / 10)
}

/** "2026-03" → "marzo de 2026". */
export function nombrePeriodo(periodo: string): string {
  const [anio, mes] = periodo.split('-').map(Number)
  if (!anio || !mes) return periodo
  const texto = new Date(anio, mes - 1, 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
  return texto
}
