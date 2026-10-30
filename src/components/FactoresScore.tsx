import type { FactorScore } from '../types/score'
import {
  efectoDe,
  explicacionDelFactor,
  nombreDelFactor,
  ordenarPorImpacto,
  puntosTexto,
  type Efecto,
} from '../utils/score'
import './ScoreDesglose.css'

interface FactoresScoreProps {
  factores: FactorScore[]
  /** Sugerencia que ya se muestra arriba, para no repetirla dentro del factor. */
  sugerenciaPrincipal?: string | null
}

const ETIQUETA: Record<Efecto, string> = { suma: 'Suma', resta: 'Resta', neutro: 'Neutro' }
const ICONO: Record<Efecto, string> = { suma: '↑', resta: '↓', neutro: '•' }

/** Lista de factores ordenados por impacto. Lo que suma y lo que resta se distingue por
 *  color, icono, etiqueta y signo, para que no dependa solo del color. */
function FactoresScore({ factores, sugerenciaPrincipal }: FactoresScoreProps) {
  const ordenados = ordenarPorImpacto(factores)
  const maximo = Math.max(...ordenados.map((f) => Math.abs(f.puntos)), 1)

  return (
    <section className="factores" aria-labelledby="factores-titulo">
      <h2 id="factores-titulo" className="factores__titulo">
        Qué pesa en tu score
      </h2>
      <p className="factores__ayuda">De lo que más pesa a lo que menos. Los puntos indican cuánto aporta cada factor.</p>

      <ol className="factores__lista">
        {ordenados.map((f) => {
          const efecto = efectoDe(f.puntos)
          // La barra sale del centro: a la derecha suma, a la izquierda resta.
          const ancho = (Math.abs(f.puntos) / maximo) * 50
          const nombre = nombreDelFactor(f)
          return (
            <li key={f.clave} className={`factor factor--${efecto}`}>
              <div className="factor__cabeza">
                <span className="factor__icono" aria-hidden="true">
                  {ICONO[efecto]}
                </span>
                <h3 className="factor__nombre">{nombre}</h3>
                <span className="factor__puntos">
                  <span className="factor__etiqueta">{ETIQUETA[efecto]}</span> {puntosTexto(f.puntos)} pts
                </span>
              </div>

              <p className="factor__texto">{explicacionDelFactor(f)}</p>

              <div
                className="factor__barra"
                role="img"
                aria-label={`${nombre}: ${ETIQUETA[efecto].toLowerCase()} ${puntosTexto(f.puntos)} puntos`}
              >
                <span className="factor__relleno" style={{ width: `${ancho}%` }} />
              </div>

              {f.sugerencia && f.sugerencia !== sugerenciaPrincipal && (
                <p className="factor__sugerencia">
                  <strong>Qué puede ayudar:</strong> {f.sugerencia}
                </p>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export default FactoresScore
