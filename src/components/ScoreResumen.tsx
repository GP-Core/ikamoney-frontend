import { mesLargo } from '../utils/formatMes'
import { FRASE_DEL_TONO, numero, type Tono } from '../utils/score'
import './ScoreDesglose.css'

interface ScoreResumenProps {
  puntaje: number
  nivelTexto: string | null
  tono: Tono
  /** Mes evaluado, AAAA-MM. */
  periodo: string
  /** Cuántos factores suman y cuántos restan, para la línea de resumen. */
  suman: number
  restan: number
  /** Si se aplicó un tope: el score que salía antes de aplicarlo y por qué. */
  puntajeBruto?: number | null
  textoTope?: string | null
}

const RADIO = 52
const CIRCUNFERENCIA = 2 * Math.PI * RADIO

function plural(n: number, uno: string, varios: string): string {
  return `${n} ${n === 1 ? uno : varios}`
}

/** Encabezado de la pantalla: el score, su nivel y una frase que informa sin juzgar. */
function ScoreResumen({ puntaje, nivelTexto, tono, periodo, suman, restan, puntajeBruto, textoTope }: ScoreResumenProps) {
  const porcentaje = Math.min(Math.max(puntaje, 0), 100)

  return (
    <section className={`score-resumen score-resumen--${tono}`} aria-labelledby="score-titulo">
      <div className="score-resumen__medidor">
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <circle className="score-resumen__pista" cx="60" cy="60" r={RADIO} />
          <circle
            className="score-resumen__arco"
            cx="60"
            cy="60"
            r={RADIO}
            strokeDasharray={`${(CIRCUNFERENCIA * porcentaje) / 100} ${CIRCUNFERENCIA}`}
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div className="score-resumen__centro">
          <span className="score-resumen__numero">{puntaje}</span>
          <span className="score-resumen__de">de 100</span>
        </div>
      </div>

      <h2 id="score-titulo" className="score-resumen__nivel">
        Tu score: {nivelTexto ?? 'sin nivel'}
      </h2>
      <p className="score-resumen__frase">{FRASE_DEL_TONO[tono]}</p>
      <p className="score-resumen__periodo">Con tus datos de {mesLargo(periodo)}</p>

      <p className="score-resumen__conteo">
        <span className="score-resumen__suma">↑ {plural(suman, 'factor suma', 'factores suman')}</span>
        <span className="score-resumen__resta">↓ {plural(restan, 'factor resta', 'factores restan')}</span>
      </p>

      {textoTope && (
        <p className="score-resumen__tope">
          {puntajeBruto != null && (
            <>
              Con tus datos, el score salía en <strong>{numero(puntajeBruto)}</strong>.{' '}
            </>
          )}
          {textoTope}
        </p>
      )}
    </section>
  )
}

export default ScoreResumen
