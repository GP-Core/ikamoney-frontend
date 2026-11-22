import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ApiError, registrarAlNoAutorizado } from '../services/api'
import { MODO_PRUEBA, authService } from '../services/auth'
import { limpiarDispositivo } from '../services/dispositivo'
import { guardarCopia, leerCopia } from '../services/offline'
import {
  borrarDatosLocales,
  guardarToken,
  hayCierrePendiente,
  leerToken,
  marcarCierrePendiente,
} from '../services/tokenStorage'
import type { LoginPayload, MotivoCierre, RegistroPayload, SesionResponse, Usuario } from '../types/auth'
import { AuthContext } from './authContext'
import type { AuthContextValue, EstadoSesion } from './authContext'

/**
 * Maneja la sesión del usuario en toda la app:
 * - al abrir la app, recupera la sesión preguntando a /auth/me (la cookie HttpOnly no se puede leer desde
 *   JavaScript, así que solo el servidor sabe si sigue vigente; una pestaña nueva la recupera por la cookie);
 * - programa el cierre automático cuando la sesión expira;
 * - cierra la sesión si el backend responde 401;
 * - al cerrar sesión, borra los datos guardados en el dispositivo (RN-06): marca de sesión, almacenamiento
 *   local, copias de IndexedDB para consultar sin conexión (T60), cachés de datos y suscripción push.
 *
 * En el modo de prueba (VITE_AUTH_MOCK) no hay cookie: la marca de sesión en sessionStorage decide.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoSesion>(() => (MODO_PRUEBA && !leerToken() ? 'anonimo' : 'verificando'))
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [motivoCierre, setMotivoCierre] = useState<MotivoCierre | null>(null)
  const temporizador = useRef<number | undefined>(undefined)

  const limpiarSesion = useCallback((motivo: MotivoCierre) => {
    window.clearTimeout(temporizador.current)
    borrarDatosLocales() // la marca de sesión se borra ya, antes que nada
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
      // Con el backend real no viene token (va en la cookie): solo se guarda cuándo expira.
      const { expiraEn } = guardarToken(respuesta.access_token, respuesta.expira_en)
      marcarCierrePendiente(false) // la sesión nueva reemplaza la cookie anterior
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

  // Al abrir la app: se valida la sesión con /auth/me.
  useEffect(() => {
    let activo = true
    const guardado = leerToken() // marca de esta pestaña; en una pestaña nueva no existe aunque la cookie sí

    // Sin sesión no debe quedar nada del usuario anterior: si la app se cerró sin cerrar sesión, la marca se
    // perdió (sessionStorage) pero las copias de IndexedDB seguirían ahí (T60).
    async function sinSesion() {
      await limpiarDispositivo()
      if (activo) setEstado('anonimo')
    }

    async function iniciar() {
      // Un cierre de sesión que no llegó al servidor (sin conexión) dejó viva la cookie, y solo el servidor
      // puede quitarla: se reintenta antes que nada y esta pestaña no retoma la sesión.
      if (!MODO_PRUEBA && hayCierrePendiente()) {
        try {
          await authService.cerrarSesion()
          marcarCierrePendiente(false)
        } catch {
          // Sigue sin conexión: se reintenta la próxima vez que abra la app.
        }
        return sinSesion()
      }
      if (MODO_PRUEBA && !guardado) return sinSesion()

      try {
        const { expira_en: segundosRestantes, ...datos } = await authService.obtenerUsuarioActual()
        if (!activo) return
        // El servidor es quien sabe cuánto le queda a la sesión. Se guarda la marca antes de tocar las copias
        // locales, porque offline.ts no lee ni escribe sin ella.
        let expiraEn = guardado?.expiraEn
        if (segundosRestantes !== undefined) expiraEn = guardarToken(guardado?.token, segundosRestantes).expiraEn
        // Si la cookie es de otro usuario que el de las copias guardadas aquí, esas copias no son suyas.
        const copia = await leerCopia<Usuario>('usuario')
        if (!activo) return
        if (copia && copia.datos.id !== datos.id) {
          await limpiarDispositivo()
          if (expiraEn) guardarToken(guardado?.token, Math.max(1, Math.round((expiraEn - Date.now()) / 1000)))
        }
        setUsuario(datos)
        setEstado('autenticado')
        if (expiraEn) programarExpiracion(expiraEn)
        void guardarCopia('usuario', datos)
      } catch (error) {
        if (!activo) return
        // Sin red no se puede validar, pero la sesión de esta pestaña sigue vigente: se conserva (T60).
        if (guardado && (error instanceof TypeError || !navigator.onLine)) {
          const copia = await leerCopia<Usuario>('usuario')
          if (copia) {
            if (!activo) return
            setUsuario(copia.datos)
            setEstado('autenticado')
            programarExpiracion(guardado.expiraEn)
            return
          }
        }
        // Había sesión y ya no sirve: se avisa. Quien solo abrió la app sin sesión no ve ningún aviso.
        if (guardado) limpiarSesion('expirada')
        else await sinSesion()
      }
    }

    void iniciar()
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
      let llegoAlServidor = true
      try {
        await authService.cerrarSesion()
      } catch {
        // Aunque el backend no responda, la sesión se cierra en el dispositivo.
        llegoAlServidor = false
      }
      limpiarSesion(motivo)
      // La cookie HttpOnly sigue viva si el servidor no se enteró: se recuerda para reintentarlo. Va después
      // de limpiarSesion, que borra las claves `ikamoney:*` (esta no lo es).
      if (!llegoAlServidor && !MODO_PRUEBA) marcarCierrePendiente(true)
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
      // Sin authService.cerrarSesion(): la cuenta ya no existe y el servidor ya borró la cookie.
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
