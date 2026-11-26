import { Link } from 'react-router'
import { useMovimientos } from '../hooks/useFinanzas'
import { mesActual } from '../utils/formatMes'
import { faltaMarcar } from '../utils/cuentas'
import { todayISO } from '../utils/formatDate'
import Icon from './Icon'
import './PorMarcar.css'

/** Lo que ya llegó a su fecha y no se ha marcado: mientras tanto el saldo no está al día. */
function PorMarcar() {
  const { datos } = useMovimientos(mesActual())
  const hoy = todayISO()
  const pendientes = datos?.movimientos.filter((m) => faltaMarcar(m, hoy)).length ?? 0
  if (pendientes === 0) return null

  return (
    <Link to="/movimientos" className="por-marcar">
      <Icon nombre="calendario" tamano={20} />
      <span>
        <strong>{pendientes === 1 ? '1 pago o cobro' : `${pendientes} pagos o cobros`} por marcar</strong>
        <span>Márcalos para que tus saldos estén al día.</span>
      </span>
    </Link>
  )
}

export default PorMarcar
