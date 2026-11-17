import { useId } from 'react'
import type { ReactNode } from 'react'
import './Interruptor.css'

interface InterruptorProps {
  etiqueta: string
  /** Qué hace el ajuste, en una línea. */
  descripcion: ReactNode
  activo: boolean
  onCambiar: (activo: boolean) => void
  disabled?: boolean
  /** Por qué está deshabilitado o qué pasó con el permiso; se lee junto con el interruptor. */
  nota?: ReactNode
}

/** Interruptor con etiqueta y explicación. Su estado se dice con texto ("Sí" / "No"), no solo con color. */
function Interruptor({ etiqueta, descripcion, activo, onCambiar, disabled = false, nota }: InterruptorProps) {
  const id = useId()
  const idDescripcion = `${id}-descripcion`
  const idNota = nota ? `${id}-nota` : undefined

  return (
    <div className="interruptor">
      <div className="interruptor__fila">
        <label htmlFor={id} className="interruptor__etiqueta">
          {etiqueta}
        </label>
        <span className="interruptor__control">
          <span className="interruptor__estado">{activo ? 'Sí' : 'No'}</span>
          <input
            id={id}
            type="checkbox"
            role="switch"
            className="interruptor__input"
            checked={activo}
            disabled={disabled}
            aria-describedby={[idDescripcion, idNota].filter(Boolean).join(' ')}
            onChange={(e) => onCambiar(e.target.checked)}
          />
        </span>
      </div>
      <p id={idDescripcion} className="interruptor__descripcion">
        {descripcion}
      </p>
      {nota && (
        <p id={idNota} className="interruptor__nota">
          {nota}
        </p>
      )}
    </div>
  )
}

export default Interruptor
