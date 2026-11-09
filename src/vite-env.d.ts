/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

// Variables de entorno disponibles en import.meta.env (deben empezar con VITE_).
interface ImportMetaEnv {
  readonly VITE_API_URL?: string
<<<<<<< HEAD
  readonly VITE_USAR_DATOS_EJEMPLO?: string
  readonly VITE_SCORE_USAR_EJEMPLO?: string
=======
  /** 'true' para usar la autenticación de prueba sin backend. */
  readonly VITE_AUTH_MOCK?: string
>>>>>>> Ramon-Branch
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}