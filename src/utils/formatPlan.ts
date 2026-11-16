import { mesLargo } from './formatMes'

/** "2028-03" → "marzo de 2028" (en minúsculas, para usarlo dentro de una frase). */
export function mesEnFrase(mes: string): string {
  return mesLargo(mes).toLowerCase()
}

/** 1 → "1 mes"; 14 → "1 año y 2 meses"; 24 → "2 años". */
export function duracion(meses: number): string {
  const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`
  const anios = Math.floor(meses / 12)
  const resto = meses % 12
  if (anios === 0) return plural(meses, 'mes', 'meses')
  if (resto === 0) return plural(anios, 'año', 'años')
  return `${plural(anios, 'año', 'años')} y ${plural(resto, 'mes', 'meses')}`
}
