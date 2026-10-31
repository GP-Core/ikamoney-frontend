import DatosFaltantes from '../components/DatosFaltantes'
import FactoresScore from '../components/FactoresScore'
import ScoreResumen from '../components/ScoreResumen'
import { useScore } from '../hooks/useScore'
import { SCORE_USANDO_EJEMPLO } from '../services/score'
import type { ScoreResponse } from '../types/score'
import { efectoDe, TEXTO_TOPE, tonoDelNivel } from '../utils/score'
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

        {estado === 'ok' && data && data.estado === 'calculado' && data.puntaje !== null && (
          <ScoreCalculado data={data} puntaje={data.puntaje} />
        )}
      </div>
    </main>
  )
}

function ScoreCalculado({ data, puntaje }: { data: ScoreResponse; puntaje: number }) {
  const factores = data.factores
  const suman = factores.filter((f) => efectoDe(f) === 'suma').length
  const restan = factores.filter((f) => efectoDe(f) === 'resta').length

  // Sugerencia principal: la del factor que más puntos deja de sumar.
  const prioritario = factores.find((f) => f.clave === data.orden_mejora[0])
  // Datos opcionales que faltan (por ejemplo los gastos): el score se calcula, pero se avisa.
  const opcionales = data.faltantes.filter((d) => !d.obligatorio)

  return (
    <div className="score-contenido">
      <ScoreResumen
        puntaje={puntaje}
        nivelTexto={data.nivel_texto}
        tono={tonoDelNivel(data.nivel)}
        periodo={data.periodo}
        suman={suman}
        restan={restan}
        puntajeBruto={data.tope_aplicado ? data.puntaje_bruto : null}
        textoTope={data.tope_aplicado && data.motivo_tope ? TEXTO_TOPE[data.motivo_tope] : null}
      />

      {prioritario && (
        <section className="sugerencia" aria-labelledby="sugerencia-titulo">
          <h2 id="sugerencia-titulo" className="sugerencia__titulo">
            Lo que más te ayudaría
          </h2>
          <p className="sugerencia__texto">
            <strong>{prioritario.nombre}.</strong> {prioritario.como_mejorar}
          </p>
        </section>
      )}

      <FactoresScore factores={factores} ordenMejora={data.orden_mejora} claveDestacada={prioritario?.clave} />

      {(data.supuestos.length > 0 || opcionales.length > 0) && (
        <section className="score-supuestos" aria-labelledby="supuestos-titulo">
          <h2 id="supuestos-titulo" className="score-supuestos__titulo">
            Qué supusimos para calcularlo
          </h2>
          <ul className="score-avisos">
            {data.supuestos.map((texto) => (
              <li key={texto}>{texto}</li>
            ))}
            {opcionales.map((dato) => (
              <li key={dato.dato}>{dato.mensaje}</li>
            ))}
          </ul>
          <p className="score-supuestos__modelo">Modelo de cálculo {data.version_modelo}</p>
        </section>
      )}
    </div>
  )
}

export default ScorePage
