/**
 * Marca de sesión en sessionStorage.
 *
 * Con el backend real el token vive en una cookie HttpOnly (SameSite=Strict) que el JavaScript no puede leer,
 * y por eso un script inyectado (XSS) tampoco puede robarlo. Aquí solo se guarda CUÁNDO expira la sesión, para
 * programar el cierre automático y saber si hay sesión sin preguntar al servidor.
 *
 * El token en sí solo se guarda en el modo de prueba (VITE_AUTH_MOCK) o con un backend en transición
 * (TOKEN_EN_RESPUESTA=true) que todavía lo devuelve en el cuerpo del login.
 *
 * sessionStorage (y no localStorage) para que la marca muera con la pestaña. Nunca se guarda la contraseña.
 */

const TOKEN_KEY = 'ikamoney:token'
const EXPIRA_KEY = 'ikamoney:token-expira'
// Sin el prefijo `ikamoney:` a propósito: borrarDatosLocales() y limpiarDispositivo() no deben quitarla, porque
// justo se pone al cerrar sesión (ver marcarCierrePendiente).
const CIERRE_PENDIENTE_KEY = 'ikamoney-cierre-pendiente'

export interface TokenGuardado {
  /** Solo en modo de prueba o con el backend en transición; con la cookie HttpOnly no existe. */
  token?: string
  /** Momento de expiración en milisegundos (Date.now()). */
  expiraEn: number
}

export function guardarToken(token: string | undefined, segundosDeVida: number): TokenGuardado {
  const expiraEn = Date.now() + segundosDeVida * 1000
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token)
    else sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.setItem(EXPIRA_KEY, String(expiraEn))
  } catch {
    // Navegación privada o almacenamiento bloqueado: la sesión vive solo en memoria.
  }
  return { token, expiraEn }
}

/** Devuelve la marca de sesión si todavía no expira; si expiró, la borra. */
export function leerToken(): TokenGuardado | null {
  try {
    const expiraEn = Number(sessionStorage.getItem(EXPIRA_KEY))
    if (!expiraEn) return null
    if (Date.now() >= expiraEn) {
      borrarToken()
      return null
    }
    return { token: sessionStorage.getItem(TOKEN_KEY) ?? undefined, expiraEn }
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
 * Cerrar sesión sin conexión borra todo en el dispositivo, pero la cookie HttpOnly sigue viva y solo el servidor
 * puede quitarla. Esta marca recuerda reintentar el cierre en el servidor la próxima vez que abra la app.
 */
export function marcarCierrePendiente(pendiente: boolean): void {
  try {
    if (pendiente) localStorage.setItem(CIERRE_PENDIENTE_KEY, '1')
    else localStorage.removeItem(CIERRE_PENDIENTE_KEY)
  } catch {
    // Almacenamiento bloqueado: no hay dónde recordarlo.
  }
}

export function hayCierrePendiente(): boolean {
  try {
    return localStorage.getItem(CIERRE_PENDIENTE_KEY) === '1'
  } catch {
    return false
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
