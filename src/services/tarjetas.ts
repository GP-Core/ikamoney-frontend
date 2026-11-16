import type { Tarjeta, TarjetaNueva } from '../types/simulador'
import { apiFetch } from './api'

/** true = tarjetas de ejemplo (sin backend); false = API real de /api/v1/tarjetas. */
export const TARJETAS_USANDO_EJEMPLO = import.meta.env.VITE_TARJETAS_USAR_EJEMPLO !== 'false'

const EJEMPLO: Tarjeta[] = [
  { id: 1, nombre: 'Oro', banco: 'BBVA', ultimos_4: '4417', limite_credito: 30000, credito_disponible: 21500, activa: true },
  { id: 2, nombre: 'Platinum', banco: 'Banamex', ultimos_4: '0932', limite_credito: 15000, credito_disponible: 2800, activa: true },
]

// En modo ejemplo, las tarjetas que se "registran" viven en sessionStorage para poder probar el flujo completo.
const CLAVE_EJEMPLO = 'ikamoney_tarjetas_ejemplo'

function leerRegistradasEjemplo(): Tarjeta[] {
  try {
    return JSON.parse(sessionStorage.getItem(CLAVE_EJEMPLO) ?? '[]') as Tarjeta[]
  } catch {
    return []
  }
}

export async function obtenerTarjetas(): Promise<Tarjeta[]> {
  if (TARJETAS_USANDO_EJEMPLO) {
    await new Promise((resolver) => setTimeout(resolver, 250))
    // /?simulador&ejemplo=sin-tarjetas -> prueba el estado vacío (sin las de ejemplo)
    const vacio = new URLSearchParams(window.location.search).get('ejemplo') === 'sin-tarjetas'
    // Las de ejemplo más las que se hayan registrado en esta sesión, para poder elegir entre varias.
    return [...(vacio ? [] : EJEMPLO), ...leerRegistradasEjemplo()]
  }
  return apiFetch<Tarjeta[]>('/v1/tarjetas?activa=true')
}

/** Registra una tarjeta (POST /api/v1/tarjetas). */
export async function registrarTarjeta(datos: TarjetaNueva): Promise<Tarjeta> {
  if (TARJETAS_USANDO_EJEMPLO) {
    await new Promise((resolver) => setTimeout(resolver, 400))
    const saldo = datos.saldo_actual ?? 0
    const nueva: Tarjeta = {
      id: Date.now(),
      nombre: datos.nombre,
      banco: datos.banco,
      ultimos_4: datos.ultimos_4 ?? null,
      limite_credito: datos.limite_credito,
      credito_disponible: Math.max(datos.limite_credito - saldo, 0),
      activa: true,
    }
    sessionStorage.setItem(CLAVE_EJEMPLO, JSON.stringify([...leerRegistradasEjemplo(), nueva]))
    return nueva
  }
  return apiFetch<Tarjeta>('/v1/tarjetas', { method: 'POST', body: JSON.stringify(datos) })
}