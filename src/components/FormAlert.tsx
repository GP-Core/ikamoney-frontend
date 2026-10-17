import type { ReactNode } from 'react'
import Icon from './Icon'
import type { NombreIcono } from './Icon'
import './FormAlert.css'

type Tipo = 'sano' | 'precaucion' | 'critico' | 'info'

const CONFIG: Record<Tipo, { icono: NombreIcono; palabra: string }> = {
  sano: { icono: 'sano', palabra: 'Listo' },
  precaucion: { icono: 'precaucion', palabra: 'Atención' },
  critico: { icono: 'critico', palabra: 'Error' },
  info: { icono: 'info', palabra: 'Aviso' },
}

interface FormAlertProps {
  tipo: Tipo
  children: ReactNode
}

/**
 * Alerta de la guía de estilo (T20): ícono + palabra del estado + mensaje,
 * con borde izquierdo de 6 px del color del estado. Nunca depende solo del color.
 */
function FormAlert({ tipo, children }: FormAlertProps) {
  const { icono, palabra } = CONFIG[tipo]
  return (
    <div className={`alerta alerta--${tipo}`} role={tipo === 'critico' ? 'alert' : 'status'}>
      <span className="alerta__icono">
        <Icon nombre={icono} tamano={20} />
      </span>
      <div>
        <strong className="alerta__palabra">{palabra}</strong>
        <div className="alerta__texto">{children}</div>
      </div>
    </div>
  )
}

export default FormAlert