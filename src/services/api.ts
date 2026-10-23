import type { ApiErrorBody } from '../types/api'
import { getToken } from './session'

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

/**
 * Hace una petición al backend y devuelve el JSON tipado.
 * `path` va sin el prefijo /api, por ejemplo `apiFetch('/health')`.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // Content-Type solo cuando hay cuerpo: en un GET provocaría un preflight CORS innecesario.
  const headers = new Headers(init?.headers)
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  // Los endpoints de /api/v1 exigen el token JWT del usuario.
  const token = getToken()
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_URL}/api${path}`, { ...init, headers })

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody
    throw new ApiError(
      response.status,
      body.mensaje ?? body.detail ?? `Error ${response.status} al llamar a ${path}`,
    )
  }

  return (await response.json()) as T
}
