import type { ButtonHTMLAttributes } from 'react'
import './Button.css'

type Variante = 'primario' | 'secundario' | 'recomendacion' | 'destructivo'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  /** Muestra "Cargando…" y bloquea el botón mientras se envía el formulario. */
  cargando?: boolean
  anchoCompleto?: boolean
}

/** Botón de la guía de estilo (T20): alto mínimo de 44 px y radio de 8 px. */
function Button({
  variante = 'primario',
  cargando = false,
  anchoCompleto = false,
  disabled,
  children,
  className = '',
  type = 'button',
  ...resto
}: ButtonProps) {
  const clases = ['boton', `boton--${variante}`, anchoCompleto ? 'boton--ancho' : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={clases} disabled={disabled || cargando} aria-busy={cargando} {...resto}>
      {cargando ? 'Cargando…' : children}
    </button>
  )
}

export default Button