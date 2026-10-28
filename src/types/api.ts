// Tipos de las respuestas del backend (ikamoney-backend).

/** GET /api/health */
export interface HealthResponse {
  status: string
}

/** GET /api/ping-db */
export interface PingDbResponse {
  message: string
}

/** Cuerpo de error que devuelve FastAPI (HTTPException). */
export interface ApiErrorBody {
  mensaje?: string
  detail?: string
}
