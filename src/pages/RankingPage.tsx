import DeudaRanking from '../components/DeudaRanking'
import RankingVacio from '../components/RankingVacio'
import { useRanking } from '../hooks/useRanking'
import { RANKING_USANDO_EJEMPLO } from '../services/ranking'
import type { RankingResponse } from '../types/ranking'
import { dinero, nombrePeriodo } from '../utils/ranking'
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

        {estado === 'ok' && data && (data.estado === 'calculado' && data.ranking.length > 0 ? <RankingLista data={data} /> : <RankingVacio />)}
      </div>
    </main>
  )
}

function RankingLista({ data }: { data: RankingResponse }) {
  // Se respeta el orden del motor tal cual llega: la primera del arreglo es la primera del ranking.
  const [primera] = data.ranking

  return (
    <div className="ranking__contenido">
      <section className="accion" aria-labelledby="accion-titulo">
        <p className="accion__etiqueta">Lo que toca hacer en {nombrePeriodo(data.periodo)}</p>
        <h2 id="accion-titulo" className="accion__titulo">
          Empieza por {primera.nombre}
        </h2>
        <p className="accion__texto">{data.resumen}</p>
        <p className="accion__total">
          Tus deudas te cuestan {dinero(data.intereses_mes_total)} al mes en intereses.
        </p>
      </section>

      <h2 className="ranking__lista-titulo">El orden en que conviene pagarlas</h2>
      <p className="ranking__ayuda">De la que más dinero te quita cada mes a la que menos.</p>

      <ol className="ranking__lista">
        {data.ranking.map((deuda, i) => (
          <DeudaRanking key={deuda.clave} deuda={deuda} destacada={i === 0} />
        ))}
      </ol>

      {data.bola_de_nieve && !data.bola_de_nieve.coincide && (
        <section className="ranking__nota" aria-label="Por qué no empezar por la deuda más chica">
          <p>{data.bola_de_nieve.mensaje}</p>
        </section>
      )}

      {data.sin_ranking.length > 0 && (
        <section aria-labelledby="sin-orden-titulo">
          <h2 id="sin-orden-titulo" className="ranking__lista-titulo">
            Pagos que no entran al orden
          </h2>
          <ul className="ranking__sin-orden">
            {data.sin_ranking.map((item) => (
              <li key={item.clave}>
                <strong>{item.nombre}</strong>
                {item.pago_mensual !== null && <span> · {dinero(item.pago_mensual)} al mes</span>}
                <p>{item.mensaje}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.supuestos.length > 0 && (
        <details className="ranking__supuestos">
          <summary>Cómo se calcula esto</summary>
          <ul>
            {data.supuestos.map((texto) => (
              <li key={texto}>{texto}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

export default RankingPage
