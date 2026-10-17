import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router'
import AuthLayout from '../components/AuthLayout'
import Button from '../components/Button'
import FormAlert from '../components/FormAlert'
import TextField from '../components/TextField'
import { authService } from '../services/auth'
import { mensajeErrorAuth } from '../utils/authErrors'
import { validarCorreo } from '../utils/validation'

/**
 * Solicitar el enlace para recuperar la contraseña (REQ-CU-05).
 * Siempre muestra el mismo mensaje, exista o no el correo, para no revelar qué
 * correos están registrados.
 */
function ForgotPasswordPage() {
  const [correo, setCorreo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [enlacePrueba, setEnlacePrueba] = useState<string | null>(null)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const errorCorreo = validarCorreo(correo)
    setError(errorCorreo)
    setErrorGeneral(null)
    if (errorCorreo) return

    setEnviando(true)
    try {
      const respuesta = await authService.recuperarContrasena({ correo: correo.trim().toLowerCase() })
      setEnlacePrueba(respuesta.enlace_prueba ?? null)
      setEnviado(true)
    } catch (err) {
      setErrorGeneral(mensajeErrorAuth(err, 'recuperar'))
    } finally {
      setEnviando(false)
    }
  }

  const pie = (
    <Link to="/iniciar-sesion" className="auth-enlace">
      Volver a iniciar sesión
    </Link>
  )

  if (enviado) {
    return (
      <AuthLayout titulo="Revisa tu correo" pie={pie}>
        <FormAlert tipo="sano">
          Si <strong>{correo.trim().toLowerCase()}</strong> está registrado, te enviamos un enlace para crear una
          contraseña nueva. Revisa también la carpeta de spam. El enlace vence en 30 minutos y solo funciona una vez.
        </FormAlert>
        {enlacePrueba && (
          <FormAlert tipo="info">
            Modo de prueba: en producción este enlace llega por correo.{' '}
            <a href={enlacePrueba}>Abrir enlace de recuperación</a>
          </FormAlert>
        )}
        <Button variante="secundario" anchoCompleto onClick={() => setEnviado(false)}>
          Enviar de nuevo
        </Button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      titulo="Recupera tu contraseña"
      subtitulo="Escribe el correo con el que creaste tu cuenta y te mandaremos un enlace."
      pie={pie}
    >
      {errorGeneral && <FormAlert tipo="critico">{errorGeneral}</FormAlert>}
      <form className="auth-form" onSubmit={enviar} noValidate>
        <TextField
          etiqueta="Correo electrónico"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          error={error}
        />
        <Button type="submit" anchoCompleto cargando={enviando}>
          Enviar enlace
        </Button>
      </form>
    </AuthLayout>
  )
}

export default ForgotPasswordPage