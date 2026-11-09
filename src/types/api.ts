// Tipos de las respuestas del backend (ikamoney-backend).

/** GET /api/health */
export interface HealthResponse {
  status: string
}

/** GET /api/ping-db */
export interface PingDbResponse {
  message: string
}

<<<<<<< HEAD
/** Cuerpo de error que devuelve FastAPI (HTTPException). */
export interface ApiErrorBody {
  mensaje?: string
  detail?: string
=======
/** Un error de validación de FastAPI (código 422). */
export interface ValidationErrorItem {
  loc: (string | number)[]
  msg: string
  type: string
>>>>>>> Ramon-Branch
}

/**
 * Cuerpo de error que devuelve FastAPI.
 * HTTPException manda un texto; los errores de validación (422) mandan una lista.
 */
export interface ApiErrorBody {
  detail?: string | ValidationErrorItem[]
}