// Tipos de las respuestas del backend (ikamoney-backend).

/** GET /api/health */
export interface HealthResponse {
  status: string
}

/** GET /api/ping-db */
export interface PingDbResponse {
  message: string
}

/**
 * Cuerpo de error del backend: los endpoints de /api/v1 responden { codigo, mensaje, campos };
 * los de /api (health, ping-db) usan el `detail` de FastAPI.
 */
export interface ApiErrorBody {
  detail?: string
  codigo?: string
  mensaje?: string
}
