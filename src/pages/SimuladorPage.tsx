import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import ComparativaEscenarios from '../components/ComparativaEscenarios'
import EscenariosNoViables from '../components/EscenariosNoViables'
import ExplicacionIa from '../components/ExplicacionIa'
import Icon from '../components/Icon'
import GraficaEscenarios from '../components/GraficaEscenarios'
import RegistroDeCompra from '../components/RegistroDeCompra'
import ResumenVeredicto from '../components/ResumenVeredicto'
import { Formulario, SinTarjetas } from '../components/SimuladorFormulario'
import { useTarjetasYDeudas } from '../hooks/useFinanzas'
import { useSimulacion } from '../hooks/useSimulacion'
import { SIMULADOR_USANDO_EJEMPLO } from '../services/simulador'
import type { PedidoSimulacion, SimulacionResponse } from '../types/simulador'
import { pesos } from '../utils/pesos'
import { leerPedidoDeUrl } from '../utils/simulador'
import { eleccionInicial } from '../utils/simuladorVista'
import './BalancePage.css'
import '../components/ScoreDesglose.css'
import '../components/Simulador.css'
import '../components/Button.css'
import './SimuladorPage.css'

/** Texto de muestra para revisar el diseño del espacio de la IA con /simulador?ia (solo con datos de ejemplo). */
const EXPLICACION_MUESTRA =
  'Con 18 meses sin intereses tu pago mensual es el más bajo y en ningún mes te quedas sin dinero disponible. Si prefieres terminar antes, 12 meses también alcanza.'

/** La compra viaja en la URL: con `precio` (o los atajos de demo) se ve el resultado; sin nada, se captura la compra. */
function SimuladorPage() {
  // useLocation suscribe la página a la ruta: sin él, navegar de /simulador a /simulador?precio=… no la vuelve a pintar.
  const { search } = useLocation()
  const p = new URLSearchParams(search)
  // "Cambiar datos" vuelve al formulario con la compra en la URL.
  const hayCompra = !p.has('editar') && (p.has('precio') || p.has('demo') || p.has('ia'))
  return hayCompra ? <ResultadoSimulador /> : <CapturaCompra />
}

/** Captura de la compra (T39): qué cuesta, con qué tarjeta y a cuántos meses compararla. */
function CapturaCompra() {
  const { datos, error, cargando, recargar } = useTarjetasYDeudas()
  const tarjetas = datos?.tarjetas.filter((t) => t.activa) ?? []
  const { search } = useLocation()
  const inicial = new URLSearchParams(search).has('editar') ? leerPedidoDeUrl(search, false) : null

  return (
    <main className="balance balance--t20 balance--simulador">
      <div className="balance__ancho sim-captura">
        <header className="balance__cabecera">
          <h1>Simular una compra</h1>
          <p className="sim-subtitulo">Mira cómo quedaría tu dinero antes de comprar.</p>
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
        {datos && tarjetas.length > 0 && <Formulario tarjetas={tarjetas} inicial={inicial} />}
      </div>
    </main>
  )
}

/** Pantalla del resultado del simulador: ¿debería comprarlo? Los escenarios, cómo queda el dinero y el veredicto. */
function ResultadoSimulador() {
  const [pedido] = useState(() => leerPedidoDeUrl(window.location.search, SIMULADOR_USANDO_EJEMPLO))
  const [urlCambiar] = useState(() => `/simulador?editar=1&${window.location.search.slice(1)}`)
  const { estado, data, error, reintentar } = useSimulacion(pedido)
  const explicacion =
    SIMULADOR_USANDO_EJEMPLO && new URLSearchParams(window.location.search).has('ia') ? EXPLICACION_MUESTRA : null

  return (
    <main className="balance balance--t20 balance--simulador">
      <div className="balance__ancho">
        <header className="balance__cabecera">
          <h1>Simular una compra</h1>
          <Link to={urlCambiar} className="boton boton--secundario sim-editar">
            <Icon nombre="editar" tamano={18} />
            Cambiar datos
          </Link>
          {SIMULADOR_USANDO_EJEMPLO && <span className="balance__ejemplo">Datos de ejemplo</span>}
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

        {estado === 'ok' && data && (
          <Resultado data={data} pedido={pedido} explicacion={explicacion} urlCambiar={urlCambiar} />
        )}
      </div>
    </main>
  )
}

interface ResultadoProps {
  data: SimulacionResponse
  pedido: PedidoSimulacion | null
  explicacion: string | null
  /** Formulario con esta misma compra, para corregirla. */
  urlCambiar: string
}

function Resultado({ data, pedido, explicacion, urlCambiar }: ResultadoProps) {
  const aplican = data.escenarios.filter((e) => e.aplica)
  const noAplican = data.escenarios.filter((e) => !e.aplica)
  const [elegidoId, setElegidoId] = useState(() => eleccionInicial(data))
  const elegido = aplican.find((e) => e.id === elegidoId) ?? null

  // Con datos de ejemplo el resultado es siempre el mismo: se avisa si lo capturado fue otra compra.
  const ignoraCompra = SIMULADOR_USANDO_EJEMPLO && pedido !== null && (pedido.precio !== data.precio || pedido.prioridad !== data.prioridad)
  // Sin ahorro capturado, pagar de contado casi nunca alcanza: se explica y se ofrece volver a simular.
  const contado = aplican.find((e) => e.tipo === 'contado')
  const sinAhorro = !SIMULADOR_USANDO_EJEMPLO && pedido !== null && pedido.ahorro_inicial === 0 && contado?.veredicto === 'no_recomendable'

  return (
    <div className="sim-contenido">
      {ignoraCompra && (
        <p className="sim-aviso" role="status">
          Con datos de ejemplo siempre se muestra la misma compra ({data.descripcion} de {pesos(data.precio)}). La compra que
          capturaste no se usó en este cálculo.
        </p>
      )}
      {sinAhorro && (
        <p className="sim-aviso" role="status">
          Calculamos el contado sin ahorro. Si tienes dinero apartado para esta compra, <Link to={urlCambiar}>agrégalo en la compra</Link>.
        </p>
      )}

      <ResumenVeredicto data={data} />

      {aplican.length > 0 && (
        <>
          <ComparativaEscenarios
            escenarios={aplican}
            menorImpacto={data.menor_impacto}
            scoreActual={data.score_actual}
            hayOpcionSugerida={data.veredicto !== 'no_recomendable'}
            elegido={elegidoId}
            onElegir={setElegidoId}
          />
          <RegistroDeCompra data={data} elegido={elegido} />
          <GraficaEscenarios escenarios={aplican} menorImpacto={data.menor_impacto} elegido={elegidoId} />
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
        </section>
      )}
    </div>
  )
}

export default SimuladorPage
