import type { MensajeResponse, SesionResponse, Usuario } from '../types/auth'
import { ApiError } from './api'
import type { AuthService } from './authApi'
import { leerToken } from './tokenStorage'

/**
 * SOLO PARA DESARROLLO Y DEMOSTRACIONES.
 *
 * Simula el backend de autenticación dentro del navegador para poder probar las
 * pantallas mientras el backend implementa /api/auth/*. Respeta el mismo contrato
 * y las mismas reglas (mensaje genérico en login, 5 intentos cada 15 minutos,
 * enlace de un solo uso que vence en 30 minutos).
 *
 * La contraseña se guarda con SHA-256 + sal solo para no dejarla en texto plano
 * en el navegador. En producción el hash lo hace el backend con bcrypt o Argon2.
 */

interface UsuarioMock extends Usuario {
  hash: string
  sal: string
}

interface SesionMock {
  usuarioId: number
  expiraEn: number
}

interface TokenRecuperacion {
  usuarioId: number
  expiraEn: number
  usado: boolean
}

interface IntentosFallidos {
  [correo: string]: number[]
}

const CLAVES = {
  usuarios: 'ikamoney-mock:usuarios',
  sesiones: 'ikamoney-mock:sesiones',
  recuperacion: 'ikamoney-mock:recuperacion',
  intentos: 'ikamoney-mock:intentos',
} as const

const DURACION_SESION_SEG = 60 * 60 // 1 hora
const DURACION_ENLACE_MS = 30 * 60 * 1000 // 30 minutos (IC-06)
const MAX_INTENTOS = 5 // IC-12
const VENTANA_INTENTOS_MS = 15 * 60 * 1000

function leer<T>(clave: string, porDefecto: T): T {
  try {
    const valor = localStorage.getItem(clave)
    return valor ? (JSON.parse(valor) as T) : porDefecto
  } catch {
    return porDefecto
  }
}

function escribir(clave: string, valor: unknown): void {
  localStorage.setItem(clave, JSON.stringify(valor))
}

const esperar = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function tokenAleatorio(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

async function hashContrasena(contrasena: string, sal: string): Promise<string> {
  const datos = new TextEncoder().encode(`${sal}:${contrasena}`)
  const digest = await crypto.subtle.digest('SHA-256', datos)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

function aUsuarioPublico({ id, nombre, correo, moneda }: UsuarioMock): Usuario {
  return { id, nombre, correo, moneda }
}

function crearSesion(usuario: UsuarioMock): SesionResponse {
  const token = tokenAleatorio()
  const sesiones = leer<Record<string, SesionMock>>(CLAVES.sesiones, {})
  sesiones[token] = { usuarioId: usuario.id, expiraEn: Date.now() + DURACION_SESION_SEG * 1000 }
  escribir(CLAVES.sesiones, sesiones)
  return {
    access_token: token,
    token_type: 'bearer',
    expira_en: DURACION_SESION_SEG,
    usuario: aUsuarioPublico(usuario),
  }
}

function usuarioDeLaSesion(): UsuarioMock {
  const actual = leerToken()
  const sesion = actual ? leer<Record<string, SesionMock>>(CLAVES.sesiones, {})[actual.token] : null
  if (!sesion || Date.now() >= sesion.expiraEn) throw new ApiError(401, 'Tu sesión expiró')
  const usuario = leer<UsuarioMock[]>(CLAVES.usuarios, []).find((u) => u.id === sesion.usuarioId)
  if (!usuario) throw new ApiError(401, 'Tu sesión expiró')
  return usuario
}

function registrarIntentoFallido(correo: string): void {
  const intentos = leer<IntentosFallidos>(CLAVES.intentos, {})
  const recientes = (intentos[correo] ?? []).filter((t) => Date.now() - t < VENTANA_INTENTOS_MS)
  intentos[correo] = [...recientes, Date.now()]
  escribir(CLAVES.intentos, intentos)
}

function demasiadosIntentos(correo: string): boolean {
  const intentos = leer<IntentosFallidos>(CLAVES.intentos, {})
  return (intentos[correo] ?? []).filter((t) => Date.now() - t < VENTANA_INTENTOS_MS).length >= MAX_INTENTOS
}

export const authMock: AuthService = {
  async registrar({ nombre, correo, contrasena, acepta_terminos }) {
    await esperar(400)
    if (!acepta_terminos) {
      throw new ApiError(422, 'Debes aceptar el aviso de privacidad y los términos de uso')
    }
    const usuarios = leer<UsuarioMock[]>(CLAVES.usuarios, [])
    const correoNormalizado = correo.trim().toLowerCase()
    if (usuarios.some((u) => u.correo === correoNormalizado)) {
      throw new ApiError(409, 'Ya existe una cuenta con ese correo')
    }
    const sal = tokenAleatorio()
    const nuevo: UsuarioMock = {
      id: usuarios.length ? Math.max(...usuarios.map((u) => u.id)) + 1 : 1,
      nombre: nombre.trim(),
      correo: correoNormalizado,
      moneda: 'MXN',
      sal,
      hash: await hashContrasena(contrasena, sal),
    }
    escribir(CLAVES.usuarios, [...usuarios, nuevo])
    return crearSesion(nuevo)
  },

  async iniciarSesion({ correo, contrasena }) {
    await esperar(400)
    const correoNormalizado = correo.trim().toLowerCase()
    if (demasiadosIntentos(correoNormalizado)) {
      throw new ApiError(429, 'Demasiados intentos')
    }
    const usuario = leer<UsuarioMock[]>(CLAVES.usuarios, []).find((u) => u.correo === correoNormalizado)
    const valida = usuario ? (await hashContrasena(contrasena, usuario.sal)) === usuario.hash : false
    if (!usuario || !valida) {
      registrarIntentoFallido(correoNormalizado)
      // Mensaje genérico: no revela si falló el correo o la contraseña (REQ-CU-04).
      throw new ApiError(401, 'Correo o contraseña incorrectos')
    }
    return crearSesion(usuario)
  },

  async obtenerUsuarioActual() {
    await esperar(150)
    return aUsuarioPublico(usuarioDeLaSesion())
  },

  async cerrarSesion() {
    const actual = leerToken()
    if (!actual) return
    const sesiones = leer<Record<string, SesionMock>>(CLAVES.sesiones, {})
    delete sesiones[actual.token]
    escribir(CLAVES.sesiones, sesiones)
  },

  async recuperarContrasena({ correo }): Promise<MensajeResponse> {
    await esperar(400)
    const correoNormalizado = correo.trim().toLowerCase()
    const usuario = leer<UsuarioMock[]>(CLAVES.usuarios, []).find((u) => u.correo === correoNormalizado)
    const respuesta: MensajeResponse = {
      mensaje: 'Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña.',
    }
    if (usuario) {
      const token = tokenAleatorio()
      const tokens = leer<Record<string, TokenRecuperacion>>(CLAVES.recuperacion, {})
      tokens[token] = { usuarioId: usuario.id, expiraEn: Date.now() + DURACION_ENLACE_MS, usado: false }
      escribir(CLAVES.recuperacion, tokens)
      // En producción este enlace llega por correo; aquí se muestra en pantalla.
      respuesta.enlace_prueba = `${window.location.origin}/restablecer-contrasena?token=${token}`
    }
    return respuesta
  },

  async restablecerContrasena({ token, contrasena }) {
    await esperar(400)
    const tokens = leer<Record<string, TokenRecuperacion>>(CLAVES.recuperacion, {})
    const registro = tokens[token]
    if (!registro || registro.usado || Date.now() >= registro.expiraEn) {
      throw new ApiError(400, 'El enlace no es válido o ya expiró')
    }
    const usuarios = leer<UsuarioMock[]>(CLAVES.usuarios, [])
    const usuario = usuarios.find((u) => u.id === registro.usuarioId)
    if (!usuario) throw new ApiError(400, 'El enlace no es válido o ya expiró')
    usuario.sal = tokenAleatorio()
    usuario.hash = await hashContrasena(contrasena, usuario.sal)
    escribir(CLAVES.usuarios, usuarios)
    tokens[token] = { ...registro, usado: true } // un solo uso
    escribir(CLAVES.recuperacion, tokens)
  },
}