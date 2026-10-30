import type { FactorScore } from '../types/score'

export type Efecto = 'suma' | 'resta' | 'neutro'
export type Tono = 'bien' | 'atencion' | 'riesgo'

/** Menos que esto se considera que el factor ni suma ni resta. */
const UMBRAL_NEUTRO = 0.05

export function efectoDe(puntos: number): Efecto {
  if (puntos > UMBRAL_NEUTRO) return 'suma'
  if (puntos < -UMBRAL_NEUTRO) return 'resta'
  return 'neutro'
}

/** Puntos con signo y un decimal como máximo: 7.5 → "+7.5", -1.39 → "−1.4", 0 → "0". */
export function puntosTexto(puntos: number): string {
  const redondeado = Math.round(Math.abs(puntos) * 10) / 10
  if (redondeado === 0) return '0'
  return `${puntos > 0 ? '+' : '−'}${redondeado}`
}

/** Porcentaje legible: 35 → "35%", 47.78 → "47.8%". */
export function porcentaje(valor: number): string {
  return `${Math.round(valor * 10) / 10}%`
}

/** Ordena por impacto (valor absoluto). A igual impacto, primero lo que resta. */
export function ordenarPorImpacto(factores: FactorScore[]): FactorScore[] {
  return [...factores].sort((a, b) => Math.abs(b.puntos) - Math.abs(a.puntos) || a.puntos - b.puntos)
}

/** El nombre del nivel puede variar según la API; aquí se agrupa por tono visual. */
export function tonoDelNivel(nivel: string | null): Tono {
  const n = (nivel ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  if (n.includes('riesgo')) return 'riesgo'
  if (n.includes('atencion')) return 'atencion'
  return 'bien'
}

/** Frase corta bajo el score. Informa, no juzga. */
export const FRASE_DEL_TONO: Record<Tono, string> = {
  bien: 'Tu panorama se ve sólido. Aquí está lo que más pesa en tu score.',
  atencion: 'Vas por buen camino. Hay un par de cosas que pueden subirlo.',
  riesgo: 'Este mes hay cosas que pesan en tu score. Aquí ves cuáles y qué puede ayudar.',
}

const NOMBRES: Record<string, string> = {
  dti: 'Pagos de deuda frente a tu ingreso',
  flujo: 'Lo que te queda cada mes',
  msi: 'Mensualidades a meses sin intereses',
  utilizacion: 'Uso del límite de tus tarjetas',
  pago: 'Cómo pagas tus tarjetas',
}

export function nombreDelFactor(f: FactorScore): string {
  return f.nombre ?? NOMBRES[f.clave] ?? 'Otro factor'
}

/** Una frase en lenguaje de dinero. Se usa la de la API si la manda. */
export function explicacionDelFactor(f: FactorScore): string {
  if (f.explicacion) return f.explicacion
  const v = f.valor
  if (v === undefined) return 'Este factor se calcula con los datos que capturaste.'

  switch (f.clave) {
    case 'dti':
      return `Destinas cerca del ${porcentaje(v)} de tu ingreso a pagar deudas cada mes.`
    case 'flujo':
      if (v < 0) return `Este mes gastas cerca de un ${porcentaje(-v)} más de lo que ganas.`
      if (v === 0) return 'Este mes gastas casi lo mismo que ganas.'
      return `Después de tus gastos te queda cerca del ${porcentaje(v)} de tu ingreso.`
    case 'msi':
      return v === 0
        ? 'No tienes mensualidades a MSI comprometidas.'
        : `Tus mensualidades a MSI equivalen al ${porcentaje(v)} de tu ingreso.`
    case 'utilizacion':
      return v > 100
        ? 'Tu saldo en tarjetas supera el límite que tienes.'
        : `Usas cerca del ${porcentaje(v)} del límite de tus tarjetas.`
    default:
      return 'Este factor se calcula con los datos que capturaste.'
  }
}
