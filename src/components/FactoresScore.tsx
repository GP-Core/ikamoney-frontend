import type { ClaveFactor, FactorScore } from '../types/score'
import { efectoDe, numero, ordenarFactores, type Efecto } from '../utils/score'
import './ScoreDesglose.css'

interface FactoresScoreProps {
  factores: FactorScore[]
  ordenMejora: ClaveFactor[]
  /** Factor cuya sugerencia ya se muestra arriba, para no repetirla. */
  claveDestacada?: ClaveFactor | null
}

const ETIQUETA: Record<Efecto, string> = { suma: 'Suma', resta: 'Resta', omitido: 'No aplica' }
const ICONO: Record<Efecto, string> = { suma: '↑', resta: '↓', omitido: '–' }

/**
 * Lista de factores. Cada uno muestra cuántos puntos aporta de los que podría aportar.
 * Lo que suma y lo que resta se distingue por color, icono, etiqueta y texto, no solo por color.
 */
function FactoresScore({ factores, ordenMejora, claveDestacada }: FactoresScoreProps) {
  const ordenados = ordenarFactores(factores, ordenMejora)
  const pesoMaximo = Math.max(...factores.map((f) => f.peso_efectivo), 1)

  return (
    <section className="factores" aria-labelledby="factores-titulo">
      <h2 id="factores-titulo" className="factores__titulo">
        Qué pesa en tu score
      </h2>
      <p className="factores__ayuda">
        Primero lo que más puntos deja de sumar, para que veas por dónde conviene empezar. La barra completa es lo
        máximo que puede aportar cada factor.
      </p>

      <ol className="factores__lista">
        {ordenados.map((f) => {
          const efecto = efectoDe(f)
          const omitido = efecto === 'omitido'
          const ancho = (f.peso_efectivo / pesoMaximo) * 100
          const llenado = f.peso_efectivo > 0 ? (f.aporte / f.peso_efectivo) * 100 : 0
          const pierde = f.puntos_perdidos >= 1
          return (
            <li key={f.clave} className={`factor factor--${efecto}`}>
              <div className="factor__cabeza">
                <span className="factor__icono" aria-hidden="true">
                  {ICONO[efecto]}
                </span>
                <h3 className="factor__nombre">{f.nombre}</h3>
                <span className="factor__puntos">
                  <span className="factor__etiqueta">{ETIQUETA[efecto]}</span>
                  {!omitido && ` · ${numero(f.aporte)} de ${numero(f.peso_efectivo)} pts`}
                </span>
              </div>

              <p className="factor__texto">{f.explicacion}</p>

              {!omitido && (
                <div
                  className="factor__barra"
                  role="img"
                  aria-label={`${f.nombre}: aporta ${numero(f.aporte)} de ${numero(f.peso_efectivo)} puntos posibles`}
                >
                  <span className="factor__peso" style={{ width: `${ancho}%` }}>
                    <span className="factor__relleno" style={{ width: `${llenado}%` }} />
                  </span>
                </div>
              )}

              {pierde && f.clave !== claveDestacada && (
                <p className="factor__sugerencia">
                  <strong>Qué puede ayudar:</strong> {f.como_mejorar}
                </p>
              )}

              <details className="factor__detalle">
                <summary>Cómo se calcula</summary>
                <p>
                  <strong>Fórmula:</strong> {f.formula}
                </p>
                <p>
                  <strong>Peso en tu score:</strong> {numero(f.peso)}%
                  {!omitido && f.peso_efectivo !== f.peso && ` (hoy cuenta como ${numero(f.peso_efectivo)}%)`}
                </p>
                <p>
                  <strong>Por qué pesa eso:</strong> {f.justificacion_peso}
                </p>
              </details>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export default FactoresScore
