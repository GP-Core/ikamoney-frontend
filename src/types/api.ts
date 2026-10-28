// Tipos de las respuestas del backend (ikamoney-backend).

/** GET /api/health */
export interface HealthResponse {
  status: string
}

/** GET /api/ping-db */
export interface PingDbResponse {
  message: string
}

/** Un error de validación de FastAPI (respuesta 422). */
export interface ValidationErrorItem {
  loc: (string | number)[]
  msg: string
  type: string
}

/** Cuerpo de error que devuelve FastAPI: texto (HTTPException) o lista (422). */
export interface ApiErrorBody {
  detail?: string | ValidationErrorItem[]
}
