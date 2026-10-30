import type { DatoFaltante } from '../types/score'
import './ScoreDesglose.css'

interface DatosFaltantesProps {
  faltantes: DatoFaltante[]
}

/** Cuando no se puede calcular el score: en lugar de factores, qué falta capturar. */
function DatosFaltantes({ faltantes }: DatosFaltantesProps) {
  return (
    <section className="faltantes" aria-labelledby="faltantes-titulo">
      <h2 id="faltantes-titulo" className="faltantes__titulo">
        Aún no podemos calcular tu score
      </h2>
      <p className="faltantes__texto">
        Nos falta{faltantes.length === 1 ? ' este dato' : 'n estos datos'}. Cuando lo captures, aquí verás qué factores
        suben o bajan tu score y qué puede ayudarte.
      </p>

      <ol className="faltantes__lista">
        {faltantes.map((dato) => (
          <li key={dato.clave}>
            <strong>{dato.texto}</strong>
            {dato.detalle && <span>{dato.detalle}</span>}
          </li>
        ))}
      </ol>
    </section>
  )
}

export default DatosFaltantes
