import DatosFaltantes from '../components/DatosFaltantes'
import FactoresScore from '../components/FactoresScore'
import FechaCopia from '../components/FechaCopia'
import HistorialScore from '../components/HistorialScore'
import NotaIntereses from '../components/NotaIntereses'
import ScoreResumen from '../components/ScoreResumen'
import SupuestosCalculo from '../components/SupuestosCalculo'
import { useEsEscritorio } from '../hooks/useEsEscritorio'
import { useScore } from '../hooks/useScore'
import { SCORE_USANDO_EJEMPLO } from '../services/score'
import type { ScoreResponse } from '../types/score'
import { consejoDe, factorPrioritario, maximoPosible, numero, resumenFactores, TEXTO_TOPE } from '../utils/score'
import './BalancePage.css'
import '../components/ScoreDesglose.css'

/** Pantalla de score (T37): por qué tienes ese score y qué puede subirlo. */
function ScorePage() {
  const { estado, data, copiaDe, error, reintentar } = useScore()

  return (
    <main className="balance balance--t20 balance--score">
      <div className="balance__ancho">
        <header className="balance__cabecera">
          <h1>Tu score</h1>
          {SCORE_USANDO_EJEMPLO && <span className="balance__ejemplo">Datos de ejemplo</span>}
        </header>

        {estado === 'ok' && <FechaCopia fecha={copiaDe} />}

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
  const escritorio = useEsEscritorio()
  const factores = data.factores
  const pagoSupuesto = data.comportamiento_supuesto ?? true
  const prioritario = factorPrioritario(factores, data.orden_mejora, pagoSupuesto)
  // Datos opcionales que faltan (por ejemplo los gastos): el score se calcula, pero se avisa.
  const opcionales = data.faltantes.filter((d) => !d.obligatorio).map((d) => d.mensaje)
  // Mientras la forma de pago sea un supuesto, ese factor limita el score.
  const maximo = pagoSupuesto ? maximoPosible(factores) : null

  const resumen = (
    <>
      <ScoreResumen
        puntaje={puntaje}
        nivel={data.nivel}
        nivelTexto={data.nivel_texto}
        periodo={data.periodo}
        conteo={resumenFactores(factores, pagoSupuesto)}
        puntajeBruto={data.tope_aplicado ? data.puntaje_bruto : null}
        textoTope={data.tope_aplicado && data.motivo_tope ? TEXTO_TOPE[data.motivo_tope] : null}
      />

      {prioritario && prioritario.puntos_perdidos >= 1 && (
        <section className="sugerencia" aria-labelledby="sugerencia-titulo">
          <h2 id="sugerencia-titulo" className="sugerencia__titulo">
            Lo que más te ayudaría
          </h2>
          <p className="sugerencia__factor">
            {prioritario.nombre}: puedes ganar hasta {numero(prioritario.puntos_perdidos)} puntos
          </p>
          <p>{consejoDe(prioritario)}</p>
        </section>
      )}

      <NotaIntereses />
    </>
  )

  const desglose = (
    <FactoresScore
      factores={factores}
      ordenMejora={data.orden_mejora}
      claveDestacada={prioritario?.clave}
      pagoSupuesto={pagoSupuesto}
    />
  )

  const supuestos = (
    <SupuestosCalculo
      supuestos={data.supuestos}
      extra={[
        ...(maximo !== null
          ? [`Hoy tu score puede llegar como máximo a ${maximo}, porque faltan pagos por registrar.`]
          : []),
        ...opcionales,
      ]}
    />
  )

  // En escritorio el resumen y el historial van a un lado de los factores; el árbol cambia para leerse como se ve.
  if (escritorio) {
    return (
      <div className="score-columnas">
        <div className="score-contenido">
          {resumen}
          <HistorialScore />
        </div>
        <div className="score-contenido">
          {desglose}
          {supuestos}
        </div>
      </div>
    )
  }

  return (
    <div className="score-contenido">
      {resumen}
      {desglose}
      <HistorialScore />
      {supuestos}
    </div>
  )
}

export default ScorePage
