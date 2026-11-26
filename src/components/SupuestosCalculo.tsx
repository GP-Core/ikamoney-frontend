import { sinCodigosInternos } from '../utils/texto'
import './ScoreDesglose.css'

interface Props {
  /** Textos del backend. */
  supuestos: string[]
  /** Líneas que agrega la pantalla. */
  extra?: string[]
}

/**
 * Los supuestos del cálculo, a la vista y al final: son estimaciones, no promesas. Misma tarjeta que
 * en el simulador. Lo que hace falta para entender la pantalla va en el término (AyudaTermino).
 */
function SupuestosCalculo({ supuestos, extra = [] }: Props) {
  const lineas = [...supuestos.map(sinCodigosInternos), ...extra]
  if (lineas.length === 0) return null

  return (
    <section className="score-supuestos" aria-labelledby="supuestos-calculo-titulo">
      <h2 id="supuestos-calculo-titulo" className="score-supuestos__titulo">
        Qué supusimos para calcularlo
      </h2>
      <ul className="score-avisos">
        {lineas.map((texto) => (
          <li key={texto}>{texto}</li>
        ))}
      </ul>
    </section>
  )
}

export default SupuestosCalculo
