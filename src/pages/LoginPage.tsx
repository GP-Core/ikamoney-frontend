import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import AuthLayout from '../components/AuthLayout'
import Button from '../components/Button'
import FormAlert from '../components/FormAlert'
import TextField from '../components/TextField'
import { useAuth } from '../hooks/useAuth'
import { mensajeErrorAuth } from '../utils/authErrors'
import { validarCorreo } from '../utils/validation'

interface EstadoNavegacion {
  desde?: string
  aviso?: string
}

const AVISOS_CIERRE = {
  manual: 'Cerraste tu sesión. Tus datos se borraron de este dispositivo.',
  expirada: 'Tu sesión expiró por seguridad. Vuelve a iniciar sesión.',
  no_autorizada: 'Tu sesión ya no es válida. Vuelve a iniciar sesión.',
} as const

/** Iniciar sesión con correo y contraseña (REQ-CU-04). */
function LoginPage() {
  const { iniciarSesion, motivoCierre } = useAuth()
  const navegar = useNavigate()
  const estadoNav = (useLocation().state ?? {}) as EstadoNavegacion

  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [errores, setErrores] = useState<{ correo?: string | null; contrasena?: string | null }>({})
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const nuevosErrores = {
      correo: validarCorreo(correo),
      contrasena: contrasena ? null : 'Escribe tu contraseña',
    }
    setErrores(nuevosErrores)
    setErrorGeneral(null)
    if (nuevosErrores.correo || nuevosErrores.contrasena) return

    setEnviando(true)
    try {
      await iniciarSesion({ correo: correo.trim().toLowerCase(), contrasena })
      navegar(estadoNav.desde ?? '/', { replace: true })
    } catch (error) {
      setErrorGeneral(mensajeErrorAuth(error, 'login'))
      setContrasena('')
    } finally {
      setEnviando(false)
    }
  }

  const aviso = estadoNav.aviso ?? (motivoCierre ? AVISOS_CIERRE[motivoCierre] : null)

  return (
    <AuthLayout
      titulo="Inicia sesión"
      subtitulo="Revisa tu dinero antes de tu próxima compra."
      pie={
        <p>
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="auth-enlace">
            Crea una cuenta
          </Link>
        </p>
      }
    >
      {aviso && <FormAlert tipo={estadoNav.aviso ? 'sano' : 'info'}>{aviso}</FormAlert>}
      {errorGeneral && <FormAlert tipo="critico">{errorGeneral}</FormAlert>}

      <form className="auth-form" onSubmit={enviar} noValidate>
        <TextField
          etiqueta="Correo electrónico"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          error={errores.correo}
        />
        <TextField
          etiqueta="Contraseña"
          type="password"
          autoComplete="current-password"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          error={errores.contrasena}
        />
        <div className="auth-form__fila">
          <Link to="/recuperar-contrasena" className="auth-enlace">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <Button type="submit" anchoCompleto cargando={enviando}>
          Iniciar sesión
        </Button>
      </form>
    </AuthLayout>
  )
}

export default LoginPage