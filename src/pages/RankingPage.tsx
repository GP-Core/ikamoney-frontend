import { Link } from 'react-router'
import AyudaTermino from '../components/AyudaTermino'
import DeudaRanking from '../components/DeudaRanking'
import EnlaceEscritura from '../components/EnlaceEscritura'
import FueraDelPlan from '../components/FueraDelPlan'
import RankingVacio from '../components/RankingVacio'
import SupuestosCalculo from '../components/SupuestosCalculo'
import { useRanking } from '../hooks/useRanking'
import { RANKING_USANDO_EJEMPLO } from '../services/ranking'
import type { RankingResponse } from '../types/ranking'
import { pesos } from '../utils/pesos'
import { nombrePeriodo } from '../utils/ranking'
import './BalancePage.css'
import '../components/Deudas.css'
import '../components/Ranking.css'

/** Pantalla de ranking (T44): en qué orden pagar tus deudas y por qué. El orden lo decide el motor. */
function RankingPage() {
  const { estado, data, error, reintentar } = useRanking()

  return (
    <main className="balance balance--t20 balance--deudas">
      <div className="balance__ancho">
        <header className="balance__cabecera">
          <h1>Tus deudas</h1>
          {RANKING_USANDO_EJEMPLO && <span className="balance__ejemplo">Datos de ejemplo</span>}
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

        {estado === 'ok' && data && (data.estado === 'calculado' && data.ranking.length > 0 ? <RankingLista data={data} onPagado={reintentar} /> : <RankingVacio />)}
      </div>
    </main>
  )
}

function RankingLista({ data, onPagado }: { data: RankingResponse; onPagado: () => void }) {
  // Se respeta el orden del motor tal cual llega: la primera del arreglo es la primera del ranking.
  const [primera] = data.ranking
  // Con una sola deuda no hay orden que explicar: se orienta al usuario en lugar de mostrar un "ranking" de uno.
  const unaSola = data.ranking.length === 1

  // En celular se lee en este orden; en escritorio la recomendación pasa a la derecha y queda fija.
  return (
    <div className="ranking__columnas">
      <div className="deudas-pila ranking__lado">
        <section className="deudas-accion" aria-labelledby="accion-titulo">
          <p className="deudas-accion__etiqueta">Lo que toca hacer en {nombrePeriodo(data.periodo)}</p>
          <h2 id="accion-titulo">Empieza por {primera.nombre}</h2>
          <p>{data.resumen}</p>
          <dl className="deudas-accion__cifras">
            <div>
              <dt>Intereses al mes</dt>
              <dd>{pesos(data.intereses_mes_total)}</dd>
            </div>
            <div>
              <dt>Mínimos del mes</dt>
              <dd>{pesos(data.pagos_minimos_total)}</dd>
            </div>
            {data.msi_mes_total > 0 && (
              <div>
                <dt>MSI del mes</dt>
                <dd>{pesos(data.msi_mes_total)}</dd>
              </div>
            )}
          </dl>
        </section>

        <Link className="balance__simular deudas-boton" to="/plan">
          Ver mi plan de pago
        </Link>
      </div>

      <div className="deudas-pila ranking__principal">
        <section aria-labelledby="orden-titulo">
          <h2 id="orden-titulo" className="deudas-titulo">
            {unaSola ? 'Tu deuda con intereses' : 'El orden en que conviene pagarlas'}
          </h2>
          {!unaSola && (
            <p className="deudas-ayuda">
              Ordenadas con el <AyudaTermino termino="avalancha">método avalancha</AyudaTermino>: de la tasa más alta a la
              más baja.
            </p>
          )}
          <ol className="ranking__lista">
            {data.ranking.map((deuda, i) => (
              <DeudaRanking key={deuda.clave} deuda={deuda} destacada={i === 0} onPagado={onPagado} />
            ))}
          </ol>
        </section>

        {unaSola && (
          <section className="ranking__nota" aria-labelledby="una-deuda-titulo">
            <h3 id="una-deuda-titulo">Solo tienes una deuda con intereses</h3>
            <p>
              No hay orden que elegir: cubre su pago cada mes y todo lo extra que puedas, abónalo a {primera.nombre}. Si
              registras otra tarjeta o préstamo, aquí verás cuál conviene pagar primero y por qué.
            </p>
            <EnlaceEscritura to="/deudas/nueva" className="ranking__nota-enlace">
              Registrar otra deuda
            </EnlaceEscritura>
          </section>
        )}

        {data.bola_de_nieve && !data.bola_de_nieve.coincide && (
          <section className="ranking__nota" aria-labelledby="bola-titulo">
            <h3 id="bola-titulo">
              ¿Y la <AyudaTermino termino="bolaDeNieve">bola de nieve</AyudaTermino>?
            </h3>
            <p>{data.bola_de_nieve.mensaje}</p>
          </section>
        )}

        <FueraDelPlan items={data.sin_ranking} msiMesTotal={data.msi_mes_total} />
        <SupuestosCalculo supuestos={data.supuestos} />
      </div>
    </div>
  )
}

export default RankingPage
