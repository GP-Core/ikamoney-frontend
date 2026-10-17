import type { ApiErrorBody } from '../types/api'
import { leerToken } from './tokenStorage'

/** URL base del backend. Se configura en .env con VITE_API_URL. */
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

/** Error lanzado cuando el backend responde con un código distinto de 2xx. */
export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** Función que se ejecuta cuando el backend responde 401 (sesión vencida o inválida). */
let alNoAutorizado: (() => void) | null = null

/** La registra el AuthProvider para cerrar la sesión cuando el token deja de servir. */
export function registrarAlNoAutorizado(fn: (() => void) | null): void {
  alNoAutorizado = fn
}

function mensajeDeError(body: ApiErrorBody, status: number, path: string): string {
  if (typeof body.detail === 'string') return body.detail
  if (Array.isArray(body.detail) && body.detail.length > 0) return body.detail[0].msg
  return `Error ${status} al llamar a ${path}`
}

interface OpcionesApi extends RequestInit {
  /** false para no mandar el token (por ejemplo, en el login). Por defecto true. */
  conToken?: boolean
}

/**
 * Hace una petición al backend y devuelve el JSON tipado.
 * `path` va sin el prefijo /api, por ejemplo `apiFetch('/health')`.
 */
export async function apiFetch<T>(path: string, init: OpcionesApi = {}): Promise<T> {
  const { conToken = true, ...opciones } = init

  // Content-Type solo cuando hay cuerpo: en un GET provocaría un preflight CORS innecesario.
  const headers = new Headers(opciones.headers)
  if (opciones.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  // Manejo de sesión (IC-10): el token viaja en el encabezado Authorization.
  const sesion = conToken ? leerToken() : null
  if (sesion) headers.set('Authorization', `Bearer ${sesion.token}`)

  const response = await fetch(`${API_URL}/api${path}`, { ...opciones, headers })

  if (!response.ok) {
    if (response.status === 401 && sesion) alNoAutorizado?.()
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody
    throw new ApiError(response.status, mensajeDeError(body, response.status, path))
  }

  // 204 No Content: no hay cuerpo que leer.
  if (response.status === 204) return undefined as T

  return (await response.json()) as T
}