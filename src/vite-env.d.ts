/// <reference types="vite/client" />

// Variables de entorno disponibles en import.meta.env (deben empezar con VITE_).
interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  /** 'true' para usar la autenticación de prueba sin backend. */
  readonly VITE_AUTH_MOCK?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}