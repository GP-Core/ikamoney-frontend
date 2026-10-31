import type { FaltanteScore } from '../types/score'
import { TEXTO_FALTANTE } from '../utils/score'
import './ScoreDesglose.css'

interface DatosFaltantesProps {
  faltantes: FaltanteScore[]
}

/** Cuando no se puede calcular el score: en lugar de factores, qué falta capturar. */
function DatosFaltantes({ faltantes }: DatosFaltantesProps) {
  const obligatorios = faltantes.filter((d) => d.obligatorio).length

  return (
    <section className="faltantes" aria-labelledby="faltantes-titulo">
      <h2 id="faltantes-titulo" className="faltantes__titulo">
        Aún no podemos calcular tu score
      </h2>
      <p className="faltantes__texto">
        Nos falta{obligatorios === 1 ? ' este dato' : 'n estos datos'}. Cuando lo captures, aquí verás qué factores
        suben o bajan tu score y qué puede ayudarte.
      </p>

      <ol className="faltantes__lista">
        {faltantes.map((dato) => (
          <li key={dato.dato}>
            <strong>
              {TEXTO_FALTANTE[dato.dato] ?? dato.dato}
              {!dato.obligatorio && <em className="faltantes__opcional">Opcional</em>}
            </strong>
            <span>{dato.mensaje}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

export default DatosFaltantes
