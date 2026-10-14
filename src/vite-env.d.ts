/// <reference types="vite/client" />

// Variables de entorno disponibles en import.meta.env (deben empezar con VITE_).
interface ImportMetaEnv {
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
