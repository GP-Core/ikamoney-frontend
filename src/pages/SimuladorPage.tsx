import { useState } from 'react'
import { Link } from 'react-router'
import ComparativaEscenarios from '../components/ComparativaEscenarios'
import EscenariosNoViables from '../components/EscenariosNoViables'
import ExplicacionIa from '../components/ExplicacionIa'
import GraficaEscenarios from '../components/GraficaEscenarios'
import ResumenVeredicto from '../components/ResumenVeredicto'
import { Formulario, SinTarjetas } from '../components/SimuladorFormulario'
import { useTarjetasYDeudas } from '../hooks/useFinanzas'
import { useSimulacion } from '../hooks/useSimulacion'
import { SIMULADOR_USANDO_EJEMPLO } from '../services/simulador'
import type { SimulacionResponse } from '../types/simulador'
import { leerPedidoDeUrl } from '../utils/simulador'
import './BalancePage.css'
import '../components/ScoreDesglose.css'
import '../components/Simulador.css'

/** Texto de muestra para revisar el diseño del espacio de la IA con /simulador?ia (solo con datos de ejemplo). */
const EXPLICACION_MUESTRA =
  'Con 18 meses sin intereses tu pago mensual es el más bajo y en ningún mes te quedas sin dinero disponible. Si prefieres terminar antes, 12 meses también alcanza.'

/** La compra viaja en la URL: con `precio` (o los atajos de demo) se ve el resultado; sin nada, se captura la compra. */
function SimuladorPage() {
  const p = new URLSearchParams(window.location.search)
  const hayCompra = p.has('precio') || p.has('demo') || p.has('ia')
  return hayCompra ? <ResultadoSimulador /> : <CapturaCompra />
}

/** Captura de la compra (T39): qué cuesta, con qué tarjeta y a cuántos meses compararla. */
function CapturaCompra() {
  const { datos, error, cargando, recargar } = useTarjetasYDeudas()
  const tarjetas = datos?.tarjetas.filter((t) => t.activa) ?? []

  return (
    <main className="balance">
      <div className="balance__ancho">
        <header className="balance__encabezado">
          <Link className="balance__mes-boton score-volver" to="/" aria-label="Volver al balance">
            ‹
          </Link>
          <div className="balance__mes">
            <h1 className="balance__titulo">¿Me conviene?</h1>
          </div>
          <span className="score-volver score-volver--vacio" aria-hidden="true" />
        </header>

        {cargando && (
          <div className="balance__contenido" aria-busy="true" aria-live="polite">
            <span className="balance__sr">Cargando tus tarjetas…</span>
            <div className="esqueleto esqueleto--resumen" />
            <div className="esqueleto esqueleto--grafica" />
          </div>
        )}

        {error && (
          <section className="balance__error" role="alert">
            <h2>No pudimos cargar tus tarjetas</h2>
            <p>{error}</p>
            <button type="button" className="balance__reintentar" onClick={recargar}>
              Reintentar
            </button>
          </section>
        )}

        {datos && tarjetas.length === 0 && <SinTarjetas />}
        {datos && tarjetas.length > 0 && <Formulario tarjetas={tarjetas} />}
      </div>
    </main>
  )
}

/** Pantalla del resultado del simulador: ¿debería comprarlo? Los escenarios, cómo queda el dinero y el veredicto. */
function ResultadoSimulador() {
  const [pedido] = useState(() => leerPedidoDeUrl(window.location.search, SIMULADOR_USANDO_EJEMPLO))
  const { estado, data, error, reintentar } = useSimulacion(pedido)
  const explicacion =
    SIMULADOR_USANDO_EJEMPLO && new URLSearchParams(window.location.search).has('ia') ? EXPLICACION_MUESTRA : null

  return (
    <main className="balance">
      <div className="balance__ancho">
        <header className="balance__encabezado">
          <a className="balance__mes-boton score-volver" href="/" aria-label="Volver al balance">
            ‹
          </a>
          <div className="balance__mes">
            <h1 className="balance__titulo">¿Debería comprarlo?</h1>
            {SIMULADOR_USANDO_EJEMPLO && <span className="balance__ejemplo">Datos de ejemplo</span>}
          </div>
          <span className="score-volver score-volver--vacio" aria-hidden="true" />
        </header>

        {estado === 'sin_pedido' && (
          <section className="balance__error sim-vacio">
            <h2>Aún no hay una compra para simular</h2>
            <p>Captura qué quieres comprar, cuánto cuesta y qué tan necesario es para ver cómo quedaría tu dinero.</p>
          </section>
        )}

        {estado === 'cargando' && (
          <div className="sim-contenido" aria-busy="true" aria-live="polite">
            <span className="balance__sr">Calculando tu simulación…</span>
            <div className="esqueleto sim-esqueleto--resumen" />
            <div className="esqueleto sim-esqueleto--cards" />
            <div className="esqueleto esqueleto--grafica" />
          </div>
        )}

        {estado === 'error' && (
          <section className="balance__error" role="alert">
            <h2>No pudimos calcular la simulación</h2>
            <p>{error}</p>
            <button type="button" className="balance__reintentar" onClick={reintentar}>
              Reintentar
            </button>
          </section>
        )}

        {estado === 'ok' && data && <Resultado data={data} explicacion={explicacion} />}
      </div>
    </main>
  )
}

function Resultado({ data, explicacion }: { data: SimulacionResponse; explicacion: string | null }) {
  const aplican = data.escenarios.filter((e) => e.aplica)
  const noAplican = data.escenarios.filter((e) => !e.aplica)

  return (
    <div className="sim-contenido">
      <ResumenVeredicto data={data} />

      {aplican.length > 0 && (
        <>
          <ComparativaEscenarios
            escenarios={aplican}
            menorImpacto={data.menor_impacto}
            scoreActual={data.score_actual}
            hayOpcionSugerida={data.veredicto !== 'no_recomendable'}
          />
          <GraficaEscenarios escenarios={aplican} menorImpacto={data.menor_impacto} />
        </>
      )}

      <EscenariosNoViables escenarios={noAplican} />
      <ExplicacionIa texto={explicacion} />

      {data.supuestos.length > 0 && (
        <section className="score-supuestos" aria-labelledby="sim-supuestos-titulo">
          <h2 id="sim-supuestos-titulo" className="score-supuestos__titulo">
            Qué supusimos para calcularlo
          </h2>
          <ul className="score-avisos">
            {data.supuestos.map((texto) => (
              <li key={texto}>{texto}</li>
            ))}
          </ul>
          <p className="score-supuestos__modelo">Modelo de cálculo {data.version_modelo}</p>
        </section>
      )}
    </div>
  )
}

export default SimuladorPage
