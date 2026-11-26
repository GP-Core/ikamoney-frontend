import { Link } from 'react-router'
import AvisosInicio from '../components/AvisosInicio'
import BalanceVacio from '../components/BalanceVacio'
import EnlaceEscritura from '../components/EnlaceEscritura'
import FechaCopia from '../components/FechaCopia'
import Icon from '../components/Icon'
import MosaicoMsi from '../components/MosaicoMsi'
import MosaicoScore from '../components/MosaicoScore'
import PorMarcar from '../components/PorMarcar'
import ProximoPago from '../components/ProximoPago'
import ResumenInicio from '../components/ResumenInicio'
import { useAlertas } from '../hooks/useAlertas'
import { useAuth } from '../hooks/useAuth'
import { useBalance } from '../hooks/useBalance'
import { useEsEscritorio } from '../hooks/useEsEscritorio'
import { useTarjetasYDeudas } from '../hooks/useFinanzas'
import { useScore } from '../hooks/useScore'
import { useCupoLecturas } from '../hooks/useCupoLecturas'
import { proximosPagos } from '../utils/finanzas'
import { mesActual, mesLargo } from '../utils/formatMes'
import '../components/Button.css'
import { EtiquetaCupo } from '../components/CupoLecturas'
import './HomePage.css'

/** Inicio (RF-35): cómo va el mes, qué atender y qué toca pagar. El resto se abre desde el menú. */
function HomePage() {
  const { usuario } = useAuth()
  const [cupo] = useCupoLecturas()
  const mes = mesActual()
  // Cada bloque carga y falla por su cuenta: si uno no responde, los demás se siguen viendo.
  const balance = useBalance(mes)
  const score = useScore()
  const finanzas = useTarjetasYDeudas()
  const { alertas } = useAlertas()
  const escritorio = useEsEscritorio()

  const datos = balance.estado === 'ok' && balance.data?.tiene_datos ? balance.data : null
  const pagos = finanzas.datos ? proximosPagos(finanzas.datos.tarjetas, finanzas.datos.deudas) : []
  const maximoPagos = escritorio ? 3 : 1
  const tarjetasConPago = pagos.slice(0, maximoPagos).flatMap((p) => (p.tarjetaId === null ? [] : [p.tarjetaId]))

  const principal = (
    <div className="inicio__bloque">
      {balance.estado === 'ok' && <FechaCopia fecha={balance.copiaDe} />}
      {balance.estado === 'cargando' && <Esqueleto texto="Cargando tu balance…" clase="inicio__esqueleto--principal" />}
      {balance.estado === 'error' && (
        <ErrorDelBloque titulo="No pudimos cargar tu balance" error={balance.error} onReintentar={balance.reintentar} />
      )}
      {balance.estado === 'ok' && balance.data && !balance.data.tiene_datos && <BalanceVacio />}
      {datos && <ResumenInicio datos={datos.resumen} />}
    </div>
  )

  // Si las tarjetas fallan, este bloque no se muestra: el resumen ya ofrece reintentar.
  const pendientes = (
    <div className="inicio__bloque">
      {alertas && <AvisosInicio alertas={alertas} tarjetasConPago={tarjetasConPago} />}
      {finanzas.cargando && <Esqueleto texto="Cargando tus próximos pagos…" clase="inicio__esqueleto--pago" />}
      <ProximoPago
        pagos={pagos}
        maximo={maximoPagos}
        onPagado={() => {
          finanzas.recargar()
          balance.reintentar()
        }}
      />
      <PorMarcar />
    </div>
  )

  const mosaicos = (
    <div className="inicio__bloque">
      {score.estado === 'ok' && <FechaCopia fecha={score.copiaDe} />}
      <div className="inicio__mosaicos">
        {score.estado === 'cargando' && <Esqueleto texto="Cargando tu score…" clase="inicio__esqueleto--mosaico" />}
        {score.estado === 'error' && (
          <ErrorDelBloque titulo="No pudimos cargar tu score" error={score.error} onReintentar={score.reintentar} />
        )}
        {score.estado === 'ok' && score.data && <MosaicoScore score={score.data} />}
        {datos && (
          <MosaicoMsi meses={[datos.resumen, ...datos.proyeccion]} msi={datos.msi} />
        )}
      </div>
    </div>
  )

  const acciones = (
    <div className="inicio__acciones">
      <Link to="/simulador" className="boton boton--primario boton--ancho">
        <Icon nombre="calculadora" tamano={20} />
        Simular una compra
      </Link>
      <EnlaceEscritura to="/estado-cuenta" className="inicio__secundario">
        <Icon nombre="subir" tamano={18} />
        Subir estado de cuenta
      <EtiquetaCupo cupo={cupo} />
      </EnlaceEscritura>
    </div>
  )

  return (
    <div className="inicio">
      <header className="inicio__saludo">
        <h1>Hola, {usuario?.nombre.split(' ')[0]}</h1>
        <p>{mesLargo(mes)}</p>
      </header>

      {/* El orden del DOM es el que se ve en cada tamaño, para que el teclado lo siga igual. */}
      {escritorio ? (
        <div className="inicio__columnas">
          <div className="inicio__columna">
            {principal}
            {mosaicos}
          </div>
          <div className="inicio__columna">
            {pendientes}
            {acciones}
          </div>
        </div>
      ) : (
        <div className="inicio__columna">
          {principal}
          {pendientes}
          {mosaicos}
          {acciones}
        </div>
      )}
    </div>
  )
}

function Esqueleto({ texto, clase }: { texto: string; clase: string }) {
  return (
    <div className={`inicio__esqueleto ${clase}`} aria-busy="true" aria-live="polite">
      <span className="sr-only">{texto}</span>
    </div>
  )
}

function ErrorDelBloque({ titulo, error, onReintentar }: { titulo: string; error: string | null; onReintentar: () => void }) {
  return (
    <section className="inicio__error" role="alert">
      <h2>{titulo}</h2>
      <p>{error}</p>
      <button type="button" className="boton boton--secundario" onClick={onReintentar}>
        Reintentar
      </button>
    </section>
  )
}

export default HomePage
