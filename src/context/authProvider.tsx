import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ApiError, registrarAlNoAutorizado } from '../services/api'
import { authService } from '../services/auth'
import { limpiarDispositivo } from '../services/dispositivo'
import { guardarCopia, leerCopia } from '../services/offline'
import { borrarDatosLocales, guardarToken, leerToken } from '../services/tokenStorage'
import type { LoginPayload, MotivoCierre, RegistroPayload, SesionResponse, Usuario } from '../types/auth'
import { AuthContext } from './authContext'
import type { AuthContextValue, EstadoSesion } from './authContext'

/**
 * Maneja la sesión del usuario en toda la app:
 * - al abrir la app, recupera la sesión si el token sigue vigente;
 * - programa el cierre automático cuando el token expira;
 * - cierra la sesión si el backend responde 401;
 * - al cerrar sesión, borra los datos guardados en el dispositivo (RN-06): token, almacenamiento
 *   local, copias de IndexedDB para consultar sin conexión (T60), cachés de datos y suscripción push.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoSesion>(() => (leerToken() ? 'verificando' : 'anonimo'))
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [motivoCierre, setMotivoCierre] = useState<MotivoCierre | null>(null)
  const temporizador = useRef<number | undefined>(undefined)

  const limpiarSesion = useCallback((motivo: MotivoCierre) => {
    window.clearTimeout(temporizador.current)
    borrarDatosLocales() // el token se borra ya, antes que nada
    void limpiarDispositivo() // y el resto (IndexedDB, cachés, push) enseguida; nunca falla
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
      void guardarCopia('usuario', respuesta.usuario) // para reabrir la sesión sin conexión (T60)
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
    if (!guardado) {
      // Sin sesión no debe quedar nada del usuario anterior: si la app se cerró sin cerrar sesión,
      // el token se perdió (sessionStorage) pero las copias de IndexedDB seguirían ahí (T60).
      void limpiarDispositivo()
      return
    }
    let activo = true
    authService
      .obtenerUsuarioActual()
      .then((datos) => {
        if (!activo) return
        setUsuario(datos)
        setEstado('autenticado')
        programarExpiracion(guardado.expiraEn)
        void guardarCopia('usuario', datos)
      })
      .catch(async (error) => {
        // Sin red no se puede validar, pero el token sigue vigente: se conserva la sesión (T60).
        if (error instanceof TypeError || !navigator.onLine) {
          const copia = await leerCopia<Usuario>('usuario')
          if (copia) {
            if (!activo) return
            setUsuario(copia.datos)
            setEstado('autenticado')
            programarExpiracion(guardado.expiraEn)
            return
          }
        }
        if (activo) limpiarSesion('expirada')
      })
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

  const eliminarCuenta = useCallback(
    async (contrasena: string) => {
      // Sin conexión no se puede eliminar: el servidor no se enteraría y quedaría la cuenta con sus datos (T60).
      if (!navigator.onLine) throw new ApiError(0, 'Sin conexión: no se eliminó nada. Inténtalo cuando tengas internet.')
      // Primero el servidor: si falla, lanza el error y en el dispositivo no se borra nada.
      await authService.eliminarCuenta({ contrasena })
      await limpiarDispositivo()
      // Sin authService.cerrarSesion(): la cuenta ya no existe y su token dejó de servir.
      limpiarSesion('cuenta_eliminada')
    },
    [limpiarSesion],
  )

  const valor = useMemo<AuthContextValue>(
    () => ({ estado, usuario, motivoCierre, iniciarSesion, registrar, cerrarSesion, eliminarCuenta }),
    [estado, usuario, motivoCierre, iniciarSesion, registrar, cerrarSesion, eliminarCuenta],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}