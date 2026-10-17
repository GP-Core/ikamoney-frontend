import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import AuthLayout from '../components/AuthLayout'
import Button from '../components/Button'
import FormAlert from '../components/FormAlert'
import PasswordRequirements from '../components/PasswordRequirements'
import TextField from '../components/TextField'
import { authService } from '../services/auth'
import { mensajeErrorAuth } from '../utils/authErrors'
import { CONTRASENA_MAX, validarConfirmacion, validarContrasenaNueva } from '../utils/validation'

/** Crear una contraseña nueva desde el enlace del correo: /restablecer-contrasena?token=… */
function ResetPasswordPage() {
  const [parametros] = useSearchParams()
  const token = parametros.get('token') ?? ''
  const navegar = useNavigate()

  const [contrasena, setContrasena] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [errores, setErrores] = useState<{ contrasena?: string | null; confirmacion?: string | null }>({})
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const pie = (
    <Link to="/recuperar-contrasena" className="auth-enlace">
      Solicitar un enlace nuevo
    </Link>
  )

  if (!token) {
    return (
      <AuthLayout titulo="Enlace no válido" pie={pie}>
        <FormAlert tipo="critico">
          El enlace está incompleto. Ábrelo directamente desde el correo o solicita uno nuevo.
        </FormAlert>
      </AuthLayout>
    )
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const nuevosErrores = {
      contrasena: validarContrasenaNueva(contrasena),
      confirmacion: validarConfirmacion(contrasena, confirmacion),
    }
    setErrores(nuevosErrores)
    setErrorGeneral(null)
    if (nuevosErrores.contrasena || nuevosErrores.confirmacion) return

    setEnviando(true)
    try {
      await authService.restablecerContrasena({ token, contrasena })
      navegar('/iniciar-sesion', {
        replace: true,
        state: { aviso: 'Tu contraseña se actualizó. Inicia sesión con la nueva.' },
      })
    } catch (error) {
      setErrorGeneral(mensajeErrorAuth(error, 'restablecer'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthLayout titulo="Crea una contraseña nueva" pie={pie}>
      {errorGeneral && <FormAlert tipo="critico">{errorGeneral}</FormAlert>}
      <form className="auth-form" onSubmit={enviar} noValidate>
        <TextField
          etiqueta="Contraseña nueva"
          type="password"
          autoComplete="new-password"
          value={contrasena}
          maxLength={CONTRASENA_MAX}
          onChange={(e) => setContrasena(e.target.value)}
          error={errores.contrasena}
        />
        <PasswordRequirements contrasena={contrasena} />
        <TextField
          etiqueta="Confirma la contraseña nueva"
          type="password"
          autoComplete="new-password"
          value={confirmacion}
          maxLength={CONTRASENA_MAX}
          onChange={(e) => setConfirmacion(e.target.value)}
          error={errores.confirmacion}
        />
        <Button type="submit" anchoCompleto cargando={enviando}>
          Guardar contraseña
        </Button>
      </form>
    </AuthLayout>
  )
}

export default ResetPasswordPage