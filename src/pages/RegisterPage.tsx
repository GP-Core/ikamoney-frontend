import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import AuthLayout from '../components/AuthLayout'
import Button from '../components/Button'
import FormAlert from '../components/FormAlert'
import PasswordRequirements from '../components/PasswordRequirements'
import TextField from '../components/TextField'
import { useAuth } from '../hooks/useAuth'
import { mensajeErrorAuth } from '../utils/authErrors'
import {
  CONTRASENA_MAX,
  validarConfirmacion,
  validarContrasenaNueva,
  validarCorreo,
  validarNombre,
} from '../utils/validation'

interface Errores {
  nombre?: string | null
  correo?: string | null
  contrasena?: string | null
  confirmacion?: string | null
  terminos?: string | null
}

/** Crear cuenta aceptando el aviso de privacidad y los términos (REQ-CU-01 a REQ-CU-03). */
function RegisterPage() {
  const { registrar } = useAuth()
  const navegar = useNavigate()

  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [aceptaTerminos, setAceptaTerminos] = useState(false)
  const [errores, setErrores] = useState<Errores>({})
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const nuevosErrores: Errores = {
      nombre: validarNombre(nombre),
      correo: validarCorreo(correo),
      contrasena: validarContrasenaNueva(contrasena),
      confirmacion: validarConfirmacion(contrasena, confirmacion),
      terminos: aceptaTerminos ? null : 'Debes aceptar el aviso de privacidad y los términos de uso',
    }
    setErrores(nuevosErrores)
    setErrorGeneral(null)
    if (Object.values(nuevosErrores).some(Boolean)) return

    setEnviando(true)
    try {
      await registrar({
        nombre: nombre.trim(),
        correo: correo.trim().toLowerCase(),
        contrasena,
        acepta_terminos: aceptaTerminos,
      })
      navegar('/', { replace: true })
    } catch (error) {
      setErrorGeneral(mensajeErrorAuth(error, 'registro'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthLayout
      titulo="Crea tu cuenta"
      subtitulo="No te pediremos claves ni contraseñas de tu banco."
      pie={
        <p>
          ¿Ya tienes cuenta?{' '}
          <Link to="/iniciar-sesion" className="auth-enlace">
            Inicia sesión
          </Link>
        </p>
      }
    >
      {errorGeneral && <FormAlert tipo="critico">{errorGeneral}</FormAlert>}

      <form className="auth-form" onSubmit={enviar} noValidate>
        <TextField
          etiqueta="Nombre"
          autoComplete="name"
          value={nombre}
          maxLength={100}
          onChange={(e) => setNombre(e.target.value)}
          error={errores.nombre}
        />
        <TextField
          etiqueta="Correo electrónico"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={correo}
          maxLength={255}
          onChange={(e) => setCorreo(e.target.value)}
          error={errores.correo}
        />
        <TextField
          etiqueta="Contraseña"
          type="password"
          autoComplete="new-password"
          value={contrasena}
          maxLength={CONTRASENA_MAX}
          onChange={(e) => setContrasena(e.target.value)}
          error={errores.contrasena}
        />
        <PasswordRequirements contrasena={contrasena} />
        <TextField
          etiqueta="Confirma tu contraseña"
          type="password"
          autoComplete="new-password"
          value={confirmacion}
          maxLength={CONTRASENA_MAX}
          onChange={(e) => setConfirmacion(e.target.value)}
          error={errores.confirmacion}
        />

        <div>
          <label className="auth-form__casilla">
            <input
              type="checkbox"
              checked={aceptaTerminos}
              onChange={(e) => setAceptaTerminos(e.target.checked)}
              aria-invalid={Boolean(errores.terminos)}
            />
            <span>
              Acepto el{' '}
              <Link to="/aviso-de-privacidad" target="_blank" rel="noopener">
                aviso de privacidad
              </Link>{' '}
              y los{' '}
              <Link to="/terminos-de-uso" target="_blank" rel="noopener">
                términos de uso
              </Link>
              .
            </span>
          </label>
          {errores.terminos && (
            <p className="campo__mensaje-error" role="alert">
              {errores.terminos}
            </p>
          )}
        </div>

        <Button type="submit" anchoCompleto cargando={enviando}>
          Crear cuenta
        </Button>
      </form>
    </AuthLayout>
  )
}

export default RegisterPage