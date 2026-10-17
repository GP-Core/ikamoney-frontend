import { useId, useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import Icon from './Icon'
import './TextField.css'

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  etiqueta: string
  error?: string | null
  ayuda?: string
}

/**
 * Campo de formulario con etiqueta visible y mensaje de error bajo el campo (IU-10).
 * Si es de tipo contraseña, incluye un botón para mostrarla u ocultarla.
 */
function TextField({ etiqueta, error, ayuda, type = 'text', ...resto }: TextFieldProps) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  const esContrasena = type === 'password'
  const idAyuda = ayuda ? `${id}-ayuda` : undefined
  const idError = error ? `${id}-error` : undefined

  return (
    <div className={`campo ${error ? 'campo--error' : ''}`}>
      <label htmlFor={id} className="campo__etiqueta">
        {etiqueta}
      </label>
      <div className="campo__control">
        <input
          id={id}
          type={esContrasena && visible ? 'text' : type}
          className="campo__input"
          aria-invalid={Boolean(error)}
          aria-describedby={[idAyuda, idError].filter(Boolean).join(' ') || undefined}
          {...resto}
        />
        {esContrasena && (
          <button
            type="button"
            className="campo__ver"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={visible}
          >
            <Icon nombre={visible ? 'ojoTachado' : 'ojo'} tamano={20} />
          </button>
        )}
      </div>
      {ayuda && (
        <p id={idAyuda} className="campo__ayuda">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={idError} className="campo__mensaje-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export default TextField