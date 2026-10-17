/**
 * Guarda el token de sesión en sessionStorage.
 *
 * Se usa sessionStorage (y no localStorage) para que la sesión se cierre sola al
 * cerrar la pestaña o el navegador: es una app con datos financieros.
 * Nunca se guarda la contraseña, solo el token que entrega el backend.
 */

const TOKEN_KEY = 'ikamoney:token'
const EXPIRA_KEY = 'ikamoney:token-expira'

export interface TokenGuardado {
  token: string
  /** Momento de expiración en milisegundos (Date.now()). */
  expiraEn: number
}

export function guardarToken(token: string, segundosDeVida: number): TokenGuardado {
  const expiraEn = Date.now() + segundosDeVida * 1000
  try {
    sessionStorage.setItem(TOKEN_KEY, token)
    sessionStorage.setItem(EXPIRA_KEY, String(expiraEn))
  } catch {
    // Navegación privada o almacenamiento bloqueado: la sesión vive solo en memoria.
  }
  return { token, expiraEn }
}

/** Devuelve el token guardado si todavía no expira; si expiró, lo borra. */
export function leerToken(): TokenGuardado | null {
  try {
    const token = sessionStorage.getItem(TOKEN_KEY)
    const expiraEn = Number(sessionStorage.getItem(EXPIRA_KEY))
    if (!token || !expiraEn) return null
    if (Date.now() >= expiraEn) {
      borrarToken()
      return null
    }
    return { token, expiraEn }
  } catch {
    return null
  }
}

export function borrarToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(EXPIRA_KEY)
  } catch {
    // Nada que borrar.
  }
}

/**
 * Borra los datos de la app guardados en el dispositivo al cerrar sesión (RN-06).
 * Conserva las claves del modo de prueba para no perder las cuentas de prueba.
 */
export function borrarDatosLocales(): void {
  borrarToken()
  try {
    Object.keys(localStorage)
      .filter((clave) => clave.startsWith('ikamoney:'))
      .forEach((clave) => localStorage.removeItem(clave))
  } catch {
    // Nada que borrar.
  }
}