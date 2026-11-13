import DeudaRanking from '../components/DeudaRanking'
import RankingVacio from '../components/RankingVacio'
import { useRanking } from '../hooks/useRanking'
import { RANKING_USANDO_EJEMPLO } from '../services/ranking'
import type { RankingResponse } from '../types/ranking'
import { accionPrincipal, dinero } from '../utils/ranking'
import './BalancePage.css'
import '../components/ScoreDesglose.css'
import '../components/Ranking.css'

/** Pantalla de ranking (T44): en qué orden pagar tus deudas y por qué. El orden lo decide el motor. */
function RankingPage() {
  const { estado, data, error, reintentar } = useRanking()

  return (
    <main className="balance ranking">
      <div className="balance__ancho">
        <header className="balance__encabezado">
          <a className="balance__mes-boton score-volver" href="/" aria-label="Volver al balance">
            ‹
          </a>
          <div className="balance__mes">
            <h1 className="balance__titulo">Tus deudas</h1>
            {RANKING_USANDO_EJEMPLO && <span className="balance__ejemplo">Datos de ejemplo</span>}
          </div>
          <span className="score-volver score-volver--vacio" aria-hidden="true" />
        </header>

        {estado === 'cargando' && (
          <div className="balance__contenido" aria-busy="true" aria-live="polite">
            <span className="balance__sr">Cargando tus deudas…</span>
            <div className="esqueleto esqueleto--resumen" />
            <div className="esqueleto esqueleto--grafica" />
          </div>
        )}

        {estado === 'error' && (
          <section className="balance__error" role="alert">
            <h2>No pudimos cargar tus deudas</h2>
            <p>{error}</p>
            <button type="button" className="balance__reintentar" onClick={reintentar}>
              Reintentar
            </button>
          </section>
        )}

        {estado === 'ok' && data && (data.tiene_deudas && data.deudas.length > 0 ? <RankingLista data={data} /> : <RankingVacio />)}
      </div>
    </main>
  )
}

function RankingLista({ data }: { data: RankingResponse }) {
  // Se respeta el orden del motor tal cual llega: la primera del arreglo es la primera del ranking.
  const [primera] = data.deudas

  return (
    <div className="ranking__contenido">
      <section className="accion" aria-labelledby="accion-titulo">
        <p className="accion__etiqueta">Lo que toca hacer ahora</p>
        <h2 id="accion-titulo" className="accion__titulo">
          Empieza por {primera.nombre}
        </h2>
        <p className="accion__texto">{accionPrincipal(primera)}</p>
        <p className="accion__total">
          Entre todas tus deudas pagas {dinero(data.interes_total_mensual)} al mes en intereses.
        </p>
      </section>

      <h2 className="ranking__lista-titulo">El orden en que conviene pagarlas</h2>
      <p className="ranking__ayuda">De la que más dinero te quita cada mes a la que menos.</p>

      <ol className="ranking__lista">
        {data.deudas.map((deuda, i) => (
          <DeudaRanking key={deuda.id} deuda={deuda} total={data.deudas.length} destacada={i === 0} />
        ))}
      </ol>
    </div>
  )
}

export default RankingPage
