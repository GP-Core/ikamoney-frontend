import DatosFaltantes from '../components/DatosFaltantes'
import FactoresScore from '../components/FactoresScore'
import ScoreResumen from '../components/ScoreResumen'
import { useScore } from '../hooks/useScore'
import { SCORE_USANDO_EJEMPLO } from '../services/score'
import { efectoDe, ordenarPorImpacto } from '../utils/score'
import './BalancePage.css'
import '../components/ScoreDesglose.css'

/** Pantalla de score (T37): por qué tienes ese score, qué lo sube, qué lo baja y qué puede ayudar. */
function ScorePage() {
  const { estado, data, error, reintentar } = useScore()

  return (
    <main className="balance">
      <div className="balance__ancho">
        <header className="balance__encabezado">
          <a className="balance__mes-boton score-volver" href="/" aria-label="Volver al balance">
            ‹
          </a>
          <div className="balance__mes">
            <h1 className="balance__titulo">Tu score</h1>
            {SCORE_USANDO_EJEMPLO && <span className="balance__ejemplo">Datos de ejemplo</span>}
          </div>
          <span className="score-volver score-volver--vacio" aria-hidden="true" />
        </header>

        {estado === 'cargando' && (
          <div className="balance__contenido" aria-busy="true" aria-live="polite">
            <span className="balance__sr">Cargando tu score…</span>
            <div className="esqueleto esqueleto--resumen" />
            <div className="esqueleto esqueleto--grafica" />
          </div>
        )}

        {estado === 'error' && (
          <section className="balance__error" role="alert">
            <h2>No pudimos cargar tu score</h2>
            <p>{error}</p>
            <button type="button" className="balance__reintentar" onClick={reintentar}>
              Reintentar
            </button>
          </section>
        )}

        {estado === 'ok' && data && data.estado === 'datos_faltantes' && (
          <div className="score-contenido">
            <DatosFaltantes faltantes={data.faltantes} />
          </div>
        )}

        {estado === 'ok' && data && data.estado === 'completo' && data.score !== null && (
          <ScoreCompleto data={data} />
        )}
      </div>
    </main>
  )
}

function ScoreCompleto({ data }: { data: NonNullable<ReturnType<typeof useScore>['data']> }) {
  const factores = data.factores
  const suman = factores.filter((f) => efectoDe(f.puntos) === 'suma').length
  const restan = factores.filter((f) => efectoDe(f.puntos) === 'resta').length
  // Sugerencia principal: la de la API; si no viene, la del factor que más resta.
  const sugerencia =
    data.sugerencia ?? ordenarPorImpacto(factores).find((f) => efectoDe(f.puntos) === 'resta' && f.sugerencia)?.sugerencia

  return (
    <div className="score-contenido">
      <ScoreResumen
        score={data.score ?? 0}
        nivel={data.nivel}
        suman={suman}
        restan={restan}
        scoreCalculado={data.tope_aplicado ? data.score_calculado : null}
        motivoTope={data.tope_aplicado ? data.motivo_tope : null}
      />

      {sugerencia && (
        <section className="sugerencia" aria-labelledby="sugerencia-titulo">
          <h2 id="sugerencia-titulo" className="sugerencia__titulo">
            Lo que más te ayudaría
          </h2>
          <p className="sugerencia__texto">{sugerencia}</p>
        </section>
      )}

      <FactoresScore factores={factores} sugerenciaPrincipal={sugerencia} />

      {data.avisos.length > 0 && (
        <ul className="score-avisos">
          {data.avisos.map((aviso) => (
            <li key={aviso}>{aviso}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ScorePage
