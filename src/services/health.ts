import type { HealthResponse, PingDbResponse } from '../types/api'
import { apiFetch } from './api'

/** Comprueba que el backend está vivo (no toca la base de datos). */
export function getHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>('/health')
}

/** Comprueba que el backend puede leer de MySQL. */
export function pingDb(): Promise<PingDbResponse> {
  return apiFetch<PingDbResponse>('/ping-db')
}
