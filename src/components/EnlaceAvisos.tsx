import { Link, useLocation } from 'react-router'
import { useAlertas } from '../hooks/useAlertas'
import { textoContador } from '../utils/alertas'
import Icon from './Icon'
import './EnlaceAvisos.css'

/**
 * La campana: número con los avisos sin leer; si ya se leyeron pero siguen activos, un punto, para
 * que no parezca que no hay nada pendiente.
 */
function EnlaceAvisos({ conEtiqueta = false }: { conEtiqueta?: boolean }) {
  const { alertas, sinLeer } = useAlertas()
  const { pathname } = useLocation()
  const activas = alertas?.filter((a) => a.estado === 'activa').length ?? 0

  const descripcion =
    sinLeer > 0 ? `Avisos, ${sinLeer} sin leer` : activas > 0 ? `Avisos, ${activas} activos` : 'Avisos'

  return (
    <Link
      to="/alertas"
      aria-label={descripcion}
      aria-current={pathname === '/alertas' ? 'page' : undefined}
      title={conEtiqueta ? undefined : descripcion}
      className={pathname === '/alertas' ? 'campana campana--activa' : 'campana'}
    >
      <span className="campana__circulo">
        <Icon nombre="campana" />
        {sinLeer > 0 ? (
          <span className="campana__contador" aria-hidden="true">
            {textoContador(sinLeer)}
          </span>
        ) : (
          activas > 0 && <span className="campana__punto" aria-hidden="true" />
        )}
      </span>
      {conEtiqueta && <span>Avisos</span>}
    </Link>
  )
}

export default EnlaceAvisos
