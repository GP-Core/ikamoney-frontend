import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { registrarAlNoAutorizado } from '../services/api'
import { authService } from '../services/auth'
import { borrarDatosLocales, guardarToken, leerToken } from '../services/tokenStorage'
import type { LoginPayload, MotivoCierre, RegistroPayload, SesionResponse, Usuario } from '../types/auth'
import { AuthContext } from './authContext'
import type { AuthContextValue, EstadoSesion } from './authContext'

/**
 * Maneja la sesión del usuario en toda la app:
 * - al abrir la app, recupera la sesión si el token sigue vigente;
 * - programa el cierre automático cuando el token expira;
 * - cierra la sesión si el backend responde 401;
 * - al cerrar sesión, borra los datos guardados en el dispositivo (RN-06).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoSesion>(() => (leerToken() ? 'verificando' : 'anonimo'))
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [motivoCierre, setMotivoCierre] = useState<MotivoCierre | null>(null)
  const temporizador = useRef<number | undefined>(undefined)

  const limpiarSesion = useCallback((motivo: MotivoCierre) => {
    window.clearTimeout(temporizador.current)
    borrarDatosLocales()
    setUsuario(null)
    setEstado('anonimo')
    setMotivoCierre(motivo)
  }, [])

  const programarExpiracion = useCallback(
    (expiraEn: number) => {
      window.clearTimeout(temporizador.current)
      temporizador.current = window.setTimeout(() => limpiarSesion('expirada'), expiraEn - Date.now())
    },
    [limpiarSesion],
  )

  const abrirSesion = useCallback(
    (respuesta: SesionResponse) => {
      const { expiraEn } = guardarToken(respuesta.access_token, respuesta.expira_en)
      programarExpiracion(expiraEn)
      setUsuario(respuesta.usuario)
      setMotivoCierre(null)
      setEstado('autenticado')
    },
    [programarExpiracion],
  )

  // Si el backend responde 401 en cualquier petición, la sesión ya no sirve.
  useEffect(() => {
    registrarAlNoAutorizado(() => limpiarSesion('no_autorizada'))
    return () => registrarAlNoAutorizado(null)
  }, [limpiarSesion])

  // Al abrir la app: si hay un token vigente, se valida con /auth/me.
  useEffect(() => {
    const guardado = leerToken()
    if (!guardado) return
    let activo = true
    authService
      .obtenerUsuarioActual()
      .then((datos) => {
        if (!activo) return
        setUsuario(datos)
        setEstado('autenticado')
        programarExpiracion(guardado.expiraEn)
      })
      .catch(() => activo && limpiarSesion('expirada'))
    return () => {
      activo = false
    }
  }, [limpiarSesion, programarExpiracion])

  useEffect(() => () => window.clearTimeout(temporizador.current), [])

  const iniciarSesion = useCallback(
    async (datos: LoginPayload) => abrirSesion(await authService.iniciarSesion(datos)),
    [abrirSesion],
  )

  const registrar = useCallback(
    async (datos: RegistroPayload) => abrirSesion(await authService.registrar(datos)),
    [abrirSesion],
  )

  const cerrarSesion = useCallback(
    async (motivo: MotivoCierre = 'manual') => {
      try {
        await authService.cerrarSesion()
      } catch {
        // Aunque el backend no responda, la sesión se cierra en el dispositivo.
      }
      limpiarSesion(motivo)
    },
    [limpiarSesion],
  )

  const valor = useMemo<AuthContextValue>(
    () => ({ estado, usuario, motivoCierre, iniciarSesion, registrar, cerrarSesion }),
    [estado, usuario, motivoCierre, iniciarSesion, registrar, cerrarSesion],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}