import type { NivelScore } from '../types/score'
import { mesEnFrase } from '../utils/formatPlan'
import { FRASE_DEL_TONO, numero, semaforoDelNivel, tonoDelNivel } from '../utils/score'
import AyudaTermino from './AyudaTermino'
import IconoSemaforo from './IconoSemaforo'
import './ScoreDesglose.css'

interface ScoreResumenProps {
  puntaje: number
  nivel: NivelScore | null
  nivelTexto: string | null
  /** Mes evaluado, AAAA-MM. */
  periodo: string
  /** "3 bien · 1 supuesto". */
  conteo: string
  /** Si se aplicó un tope: el score que salía antes de aplicarlo y por qué. */
  puntajeBruto?: number | null
  textoTope?: string | null
}

const RADIO = 52
const CIRCUNFERENCIA = 2 * Math.PI * RADIO

/** Encabezado de la pantalla: el score, su nivel y una frase que informa sin juzgar. */
function ScoreResumen({ puntaje, nivel, nivelTexto, periodo, conteo, puntajeBruto, textoTope }: ScoreResumenProps) {
  const porcentaje = Math.min(Math.max(puntaje, 0), 100)
  const semaforo = semaforoDelNivel(nivel)

  return (
    <section className={`score-resumen score-resumen--${semaforo}`} aria-labelledby="score-titulo">
      <h2 id="score-titulo" className="score-resumen__titulo">
        <AyudaTermino termino="score">Tu score</AyudaTermino>
      </h2>

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

      <p className="score-resumen__nivel">
        <IconoSemaforo nivel={semaforo} />
        {nivelTexto ?? 'Sin nivel'}
      </p>
      <p className="score-resumen__frase">{FRASE_DEL_TONO[tonoDelNivel(nivel)]}</p>
      <p className="score-resumen__periodo">Con tus datos de {mesEnFrase(periodo)}</p>
      <p className="score-resumen__conteo">Tus factores: {conteo}</p>

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
