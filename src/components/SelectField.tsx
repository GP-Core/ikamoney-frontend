import { useId } from 'react'
import type { SelectHTMLAttributes } from 'react'
import './TextField.css'

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  etiqueta: string
  opciones: { valor: string; texto: string }[]
  error?: string | null
}

/** Lista desplegable con el mismo estilo que TextField. */
function SelectField({ etiqueta, opciones, error, ...resto }: SelectFieldProps) {
  const id = useId()
  const idError = error ? `${id}-error` : undefined

  return (
    <div className={`campo ${error ? 'campo--error' : ''}`}>
      <label htmlFor={id} className="campo__etiqueta">
        {etiqueta}
      </label>
      <select id={id} className="campo__input" aria-invalid={Boolean(error)} aria-describedby={idError} {...resto}>
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        ))}
      </select>
      {error && (
        <p id={idError} className="campo__mensaje-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export default SelectField