import { Link } from 'react-router'
import { useContador } from '../hooks/useContador'
import type { MesBalance } from '../types/balance'
import { estadoDelMes, partesDelMes } from '../utils/balanceVista'
import { pesos } from '../utils/pesos'
import BarraResumen from './BarraResumen'
import Icon from './Icon'
import './ResumenInicio.css'

const ICONO_TONO = { bien: 'sano', justo: 'precaucion', mal: 'critico' } as const

/** Tarjeta principal de Inicio: cuánto queda libre este mes, en una barra y cuatro cifras. */
function ResumenInicio({ datos }: { datos: MesBalance }) {
  const { ingresos, gastos_fijos, gastos_variables, msi, libre, tarjetas = 0 } = datos
  const negativo = libre < 0
  const estado = estadoDelMes(libre, ingresos)
  const cifra = useContador(Math.abs(libre))

  return (
    <section className={`principal principal--${estado.tono}`} aria-labelledby="principal-titulo">
      <h2 id="principal-titulo" className="principal__etiqueta">
        {negativo ? 'Te faltan este mes' : 'Te queda libre este mes'}
      </h2>
      <p className="principal__cifra">{pesos(cifra)}</p>
      <p className="principal__estado">
        <Icon nombre={ICONO_TONO[estado.tono]} tamano={16} />
        {estado.texto}
      </p>

      <BarraResumen partes={partesDelMes(datos)} />

      <dl className="principal__datos">
        <div>
          <dt>Ingresos</dt>
          <dd>{pesos(ingresos)}</dd>
        </div>
        <div>
          <dt>Gastos</dt>
          <dd>{pesos(gastos_fijos + gastos_variables)}</dd>
        </div>
        <div>
          <dt>Tarjetas y cuotas</dt>
          <dd>{pesos(tarjetas)}</dd>
        </div>
        <div>
          <dt>Mensualidades MSI</dt>
          <dd>{pesos(msi)}</dd>
        </div>
      </dl>

      <Link to="/balance" className="principal__enlace">
        Ver balance y proyección
      </Link>
    </section>
  )
}

export default ResumenInicio
