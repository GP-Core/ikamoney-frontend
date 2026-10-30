/// <reference types="vite/client" />

// Variables de entorno disponibles en import.meta.env (deben empezar con VITE_).
interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_USAR_DATOS_EJEMPLO?: string
  readonly VITE_SCORE_USAR_EJEMPLO?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}