/** Token JWT del usuario. Cuando exista la pantalla de login, aquí se guarda al iniciar sesión. */
const CLAVE = 'ikamoney_token'

export function getToken(): string | null {
  try {
    return localStorage.getItem(CLAVE)
  } catch {
    return null // almacenamiento bloqueado (modo privado, etc.)
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(CLAVE, token)
  } catch {
    /* sin almacenamiento: la sesión dura lo que dure la pestaña */
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(CLAVE)
  } catch {
    /* nada que borrar */
  }
}
