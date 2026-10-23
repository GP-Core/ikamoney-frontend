import type { CSSProperties } from 'react'
import { useContador } from '../hooks/useContador'
import type { MesBalance } from '../types/balance'
import { mesNombre } from '../utils/formatMes'
import { pesos } from '../utils/pesos'
import './ResumenMes.css'

interface ResumenMesProps {
  datos: MesBalance
}

// Geometría del anillo (viewBox 200 × 200).
const RADIO = 82
const CIRCUNFERENCIA = 2 * Math.PI * RADIO
const SEPARACION = 2.5

type Tono = 'bien' | 'justo' | 'mal'

/** Qué tan holgado va el mes, dicho en palabras sencillas y con una idea de qué hacer. */
function estadoDelMes(libre: number, ingresos: number): { tono: Tono; texto: string; ayuda: string } {
  if (libre < 0) {
    return {
      tono: 'mal',
      texto: 'Este mes te pasas',
      ayuda: 'Revisa tus gastos variables o tus pagos a MSI para equilibrar el mes.',
    }
  }
  if (ingresos <= 0 || libre / ingresos < 0.1) {
    return {
      tono: 'justo',
      texto: 'Te queda poco margen',
      ayuda: 'Cuida tus gastos variables para llegar tranquilo a fin de mes.',
    }
  }
  const porcentaje = Math.round((libre / ingresos) * 100)
  return {
    tono: 'bien',
    texto: 'Vas bien este mes',
    ayuda: `Te queda el ${porcentaje}% de lo que ganas para ahorrar o gastar como quieras.`,
  }
}

/** Resumen del mes: el anillo reparte el ingreso entre gastos fijos, variables, MSI y lo que queda libre. */
function ResumenMes({ datos }: ResumenMesProps) {
  const { ingresos, gastos_fijos, gastos_variables, msi, libre } = datos
  const negativo = libre < 0
  const estado = estadoDelMes(libre, ingresos)
  const cifra = useContador(Math.abs(libre))

  const partes = [
    { clave: 'fijo', nombre: 'Gastos fijos', valor: gastos_fijos },
    { clave: 'variable', nombre: 'Gastos variables', valor: gastos_variables },
    { clave: 'msi', nombre: 'MSI', valor: msi },
    { clave: 'libre', nombre: 'Libre', valor: Math.max(libre, 0) },
  ]
  // Base del anillo: lo mayor entre lo que entra y lo que sale, para que nunca pase de una vuelta.
  const base = Math.max(ingresos, gastos_fijos + gastos_variables + msi, 1)

  let acumulado = 0
  const arcos = partes
    .filter((p) => p.valor > 0)
    .map((p, i) => {
      const largo = Math.max((p.valor / base) * CIRCUNFERENCIA - SEPARACION, 0.5)
      const arco = { ...p, largo, desfase: -(acumulado + SEPARACION / 2), retraso: i * 90 }
      acumulado += (p.valor / base) * CIRCUNFERENCIA
      return arco
    })

  const descripcion =
    `Del ingreso de ${pesos(ingresos)}: ${pesos(gastos_fijos)} en gastos fijos, ` +
    `${pesos(gastos_variables)} en gastos variables, ${pesos(msi)} en MSI` +
    (negativo ? `; faltan ${pesos(-libre)}.` : ` y ${pesos(libre)} libres.`)

  return (
    <section className={`resumen resumen--${estado.tono}`} aria-labelledby="resumen-titulo">
      <p className="resumen__estado">
        <span className="resumen__icono" aria-hidden="true">
          {estado.tono === 'bien' ? '✓' : '!'}
        </span>
        {estado.texto}
      </p>
      <p className="resumen__ayuda">{estado.ayuda}</p>

      <div className="resumen__anillo">
        <svg viewBox="0 0 200 200" role="img" aria-label={descripcion}>
          <circle className="resumen__disco" cx="100" cy="100" r={RADIO - 14} />
          <circle className="resumen__pista" cx="100" cy="100" r={RADIO} />
          <g transform="rotate(-90 100 100)">
            {arcos.map((a) => (
              <circle
                key={a.clave}
                className={`resumen__arco resumen__arco--${a.clave}`}
                cx="100"
                cy="100"
                r={RADIO}
                strokeDasharray={`${a.largo} ${CIRCUNFERENCIA - a.largo}`}
                strokeDashoffset={a.desfase}
                style={{ '--circunferencia': CIRCUNFERENCIA, animationDelay: `${a.retraso}ms` } as CSSProperties}
              />
            ))}
          </g>
        </svg>

        <div className="resumen__centro">
          <h2 id="resumen-titulo" className="resumen__etiqueta">
            {negativo ? `Te faltan en ${mesNombre(datos.mes).toLowerCase()}` : 'Te queda libre'}
          </h2>
          <p className="resumen__cifra">{pesos(Math.round(cifra))}</p>
          <p className="resumen__de">de {pesos(ingresos)} que ganas</p>
        </div>
      </div>

      <ul className="resumen__desglose">
        {partes.map((p) => (
          <li key={p.clave} className="resumen__parte">
            <span className={`resumen__punto resumen__punto--${p.clave}`} aria-hidden="true" />
            <span className="resumen__nombre">{p.nombre}</span>
            <span className="resumen__monto">{pesos(p.valor)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default ResumenMes
