import { requisitosContrasena } from '../utils/validation'
import Icon from './Icon'
import './PasswordRequirements.css'

/** Muestra mientras se escribe qué requisitos de la contraseña ya se cumplen. */
function PasswordRequirements({ contrasena }: { contrasena: string }) {
  return (
    <ul className="requisitos" aria-label="Requisitos de la contraseña">
      {requisitosContrasena(contrasena).map((r) => (
        <li key={r.id} className={r.cumple ? 'requisitos__item requisitos__item--ok' : 'requisitos__item'}>
          <Icon nombre={r.cumple ? 'sano' : 'circulo'} tamano={16} />
          <span>{r.texto}</span>
          <span className="sr-only">{r.cumple ? '(cumple)' : '(pendiente)'}</span>
        </li>
      ))}
    </ul>
  )
}

export default PasswordRequirements