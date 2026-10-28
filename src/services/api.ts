import type { ApiErrorBody } from '../types/api'

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

  const response = await fetch(`${API_URL}/api${path}`, { ...init, headers })

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody
    throw new ApiError(response.status, errorDetail(body) ?? `Error ${response.status} al llamar a ${path}`)
  }

  // 204 No Content (típico en DELETE): no hay JSON que leer.
  if (response.status === 204) return undefined as T

  return (await response.json()) as T
}

/** FastAPI manda `detail` como texto (HTTPException) o como lista (errores 422 de validación). */
function errorDetail(body: ApiErrorBody): string | undefined {
  if (typeof body.detail === 'string') return body.detail
  if (Array.isArray(body.detail)) return body.detail.map((item) => item.msg).join('. ')
  return undefined
}
