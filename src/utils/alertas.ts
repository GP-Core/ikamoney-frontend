import type { Alerta, Severidad } from '../types/alerta.ts'

/**
 * Rangos que acepta el backend (app/core/reglas_alertas.json, "rangos"). El backend los vuelve a
 * validar; aquí solo sirven para limitar los controles.
 */
export const UMBRAL_MIN = 10
export const UMBRAL_MAX = 100
export const DIAS_MIN = 1
export const DIAS_MAX = 15

export interface DestinoAlerta {
  a: string
  texto: string
}

/** El id de tarjeta de una referencia 'tarjeta:7' o 'tarjeta:7:2026-04-30'; null si no tiene. */
export function idDeTarjeta(referencia: string): number | null {
  const partes = referencia.split(':')
  if (partes[0] !== 'tarjeta') return null
  const id = Number(partes[1])
  return Number.isInteger(id) && id > 0 ? id : null
}

/**
 * A dónde lleva cada alerta: una alerta sin salida es solo mala noticia (T48).
 * Utilización alta o límite rebasado → ranking de qué pagar primero; pago próximo → la tarjeta;
 * compromisos mayores que ingresos → balance. Lo desconocido cae en tarjetas.
 */
export function destinoDeAlerta(alerta: Pick<Alerta, 'regla' | 'referencia'>): DestinoAlerta {
  const tarjeta = idDeTarjeta(alerta.referencia)
  switch (alerta.regla) {
    case 'AL-01':
      return { a: '/balance', texto: 'Ver mi proyección' }
    case 'AL-02':
    case 'AL-04':
      return { a: '/ranking', texto: 'Ver qué pagar primero' }
    case 'AL-03':
      return tarjeta === null
        ? { a: '/tarjetas', texto: 'Ver mis tarjetas' }
        : { a: `/tarjetas/${tarjeta}`, texto: 'Ver la tarjeta' }
    default:
      return { a: '/tarjetas', texto: 'Ver mis tarjetas' }
  }
}

/** No leídas primero; dentro de cada grupo, la más reciente arriba. No modifica la lista recibida. */
export function ordenarAlertas<T extends Pick<Alerta, 'id' | 'leida' | 'creada_en'>>(lista: T[]): T[] {
  return [...lista].sort((a, b) => {
    if (a.leida !== b.leida) return a.leida ? 1 : -1
    if (a.creada_en !== b.creada_en) return a.creada_en < b.creada_en ? 1 : -1
    return b.id - a.id
  })
}

/** Tipo de FormAlert/semáforo: atención es amarillo, crítica es rojo (T20). */
export function tipoDeSeveridad(severidad: Severidad): 'precaucion' | 'critico' {
  return severidad === 'critica' ? 'critico' : 'precaucion'
}

/** Texto del globo de la campana: nada si no hay pendientes, y "9+" como tope. */
export function textoContador(sinLeer: number): string {
  if (sinLeer <= 0) return ''
  return sinLeer > 9 ? '9+' : String(sinLeer)
}

/** Mensaje de error de validación para el umbral, o null si es válido. */
export function errorUmbral(valor: number): string | null {
  if (!Number.isInteger(valor) || valor < UMBRAL_MIN || valor > UMBRAL_MAX) {
    return `Escribe un porcentaje entero de ${UMBRAL_MIN} a ${UMBRAL_MAX}`
  }
  return null
}

/** Mensaje de error de validación para los días de anticipación, o null si es válido. */
export function errorDias(valor: number): string | null {
  if (!Number.isInteger(valor) || valor < DIAS_MIN || valor > DIAS_MAX) {
    return `Escribe un número entero de días de ${DIAS_MIN} a ${DIAS_MAX}`
  }
  return null
}
