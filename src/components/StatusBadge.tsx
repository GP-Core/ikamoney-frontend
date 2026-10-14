import type { CheckResult } from '../hooks/useBackendStatus'
import './StatusBadge.css'

interface StatusBadgeProps {
  label: string
  result: CheckResult
}

const STATE_TEXT = {
  cargando: 'Cargando',
  ok: 'Conectado',
  error: 'Error',
} as const

/** Muestra el estado de una comprobación (API, base de datos…). */
function StatusBadge({ label, result }: StatusBadgeProps) {
  return (
    <div className={`status-badge status-badge--${result.state}`}>
      <div className="status-badge__header">
        <span className="status-badge__dot" aria-hidden="true" />
        <strong>{label}</strong>
        <span className="status-badge__state">{STATE_TEXT[result.state]}</span>
      </div>
      <p className="status-badge__message">{result.message}</p>
    </div>
  )
}

export default StatusBadge
