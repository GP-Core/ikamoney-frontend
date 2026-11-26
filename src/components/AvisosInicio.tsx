import { Link } from 'react-router'
import type { Alerta } from '../types/alerta'
import { destinoDeAlerta, idDeTarjeta, ordenarAlertas, tipoDeSeveridad } from '../utils/alertas'
import Icon from './Icon'
import './TarjetasInicio.css'

const MAXIMO = 2
const PALABRA = { precaucion: 'Atención', critico: 'Importante' } as const

interface AvisosInicioProps {
  alertas: Alerta[]
  /** Tarjetas que ya aparecen en "Próximo pago": su aviso de pago cercano (AL-03) no se repite. */
  tarjetasConPago: number[]
}

/** "Para atender": los avisos activos más urgentes, con el formato de alerta de T20. */
function AvisosInicio({ alertas, tarjetasConPago }: AvisosInicioProps) {
  const activas = ordenarAlertas(alertas.filter((a) => a.estado === 'activa'))
  const visibles = activas
    .filter((a) => !(a.regla === 'AL-03' && tarjetasConPago.includes(idDeTarjeta(a.referencia) ?? -1)))
    .slice(0, MAXIMO)
  if (visibles.length === 0) return null

  return (
    <section className="atender" aria-labelledby="atender-titulo">
      <div className="atender__cabecera">
        <h2 id="atender-titulo">Para atender</h2>
        <Link to="/alertas">Ver todos ({activas.length})</Link>
      </div>
      <ul>
        {visibles.map((alerta) => {
          const tipo = tipoDeSeveridad(alerta.severidad)
          const destino = destinoDeAlerta(alerta)
          return (
            <li key={alerta.id}>
              <Link to={destino.a} className={`atender__fila atender__fila--${tipo}`}>
                <Icon nombre={tipo} tamano={22} />
                <span>
                  {!alerta.leida && <span className="atender__nuevo">Nuevo</span>}
                  <strong>{PALABRA[tipo]}.</strong> {alerta.titulo}
                  <span className="atender__accion">{destino.texto}</span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default AvisosInicio
