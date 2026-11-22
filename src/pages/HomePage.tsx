import { Link } from 'react-router'
import BalanceVacio from '../components/BalanceVacio'
import CompromisosMsi from '../components/CompromisosMsi'
import FechaCopia from '../components/FechaCopia'
import Icon from '../components/Icon'
import type { NombreIcono } from '../components/Icon'
import ResumenMes from '../components/ResumenMes'
import ScoreResumen from '../components/ScoreResumen'
import { useAuth } from '../hooks/useAuth'
import { useBalance } from '../hooks/useBalance'
import { useScore } from '../hooks/useScore'
import { mesActual, mesLargo } from '../utils/formatMes'
import { HORIZONTE_DEFECTO, recortarMeses } from '../utils/balanceVista'
import { efectoDe, TEXTO_TOPE, tonoDelNivel } from '../utils/score'
import './BalancePage.css'
import './HomePage.css'
import '../components/ScoreDesglose.css'

const ACCESOS: { ruta: string; titulo: string; texto: string; icono: NombreIcono }[] = [
  { ruta: '/simulador', titulo: 'Simular una compra', texto: 'Mira cómo quedaría tu dinero antes de comprar.', icono: 'calculadora' },
  { ruta: '/ranking', titulo: 'Tus deudas', texto: 'En qué orden conviene pagarlas.', icono: 'recibo' },
  { ruta: '/tarjetas', titulo: 'Tarjetas y deudas', texto: 'Tus tarjetas, compras a MSI y préstamos.', icono: 'tarjeta' },
  { ruta: '/movimientos', titulo: 'Ingresos y gastos', texto: 'Lo que entra y lo que sale cada mes.', icono: 'mas' },
  { ruta: '/cuentas', titulo: 'Cuentas', texto: 'Débito, ahorro, efectivo y lo que pasó en cada una.', icono: 'tarjeta' },
  { ruta: '/balance', titulo: 'Balance y proyección', texto: 'Cómo se ven tus próximos meses.', icono: 'calendario' },
  { ruta: '/estado-cuenta', titulo: 'Subir estado de cuenta', texto: 'Lee el PDF y revisa lo que encuentre.', icono: 'subir' },
]

/** Inicio (RF-35): lo que te queda del mes, tu score, lo comprometido a MSI y accesos a todo lo demás. */
function HomePage() {
  const { usuario } = useAuth()
  const mes = mesActual()

  return (
    <div className="home">
      <header className="home__encabezado">
        <h1>Hola, {usuario?.nombre.split(' ')[0]}</h1>
        <p className="home__subtitle">Así va tu dinero en {mesLargo(mes)}.</p>
      </header>

      {/* Cada bloque carga y falla por su cuenta: si uno no responde, los demás se siguen viendo. */}
      <BloqueBalance mes={mes} />
      <BloqueScore />

      <nav className="home__accesos" aria-label="Accesos">
        {ACCESOS.map((a) => (
          <Link key={a.ruta} to={a.ruta} className="home__acceso home__acceso--compacto">
            <Icon nombre={a.icono} />
            <span>
              <strong>{a.titulo}</strong>
              <span className="home__acceso-texto">{a.texto}</span>
            </span>
          </Link>
        ))}
      </nav>
    </div>
  )
}

function Esqueleto({ texto }: { texto: string }) {
  return (
    <div className="balance__contenido" aria-busy="true" aria-live="polite">
      <span className="balance__sr">{texto}</span>
      <div className="esqueleto esqueleto--resumen" />
    </div>
  )
}

function ErrorDelBloque({ titulo, error, onReintentar }: { titulo: string; error: string | null; onReintentar: () => void }) {
  return (
    <section className="balance__error" role="alert">
      <h2>{titulo}</h2>
      <p>{error}</p>
      <button type="button" className="balance__reintentar" onClick={onReintentar}>
        Reintentar
      </button>
    </section>
  )
}

function BloqueBalance({ mes }: { mes: string }) {
  const { estado, data, copiaDe, error, reintentar } = useBalance(mes)

  return (
    <section className="home__bloque" aria-labelledby="home-mes">
      <h2 id="home-mes" className="home__bloque-titulo">
        Lo que te queda este mes
      </h2>
      {estado === 'ok' && <FechaCopia fecha={copiaDe} />}
      {estado === 'cargando' && <Esqueleto texto="Cargando tu balance…" />}
      {estado === 'error' && <ErrorDelBloque titulo="No pudimos cargar tu balance" error={error} onReintentar={reintentar} />}
      {estado === 'ok' && data && !data.tiene_datos && <BalanceVacio />}
      {estado === 'ok' && data && data.tiene_datos && (
        <div className="balance__contenido">
          <ResumenMes datos={data.resumen} />
          <CompromisosMsi meses={recortarMeses([data.resumen, ...data.proyeccion], HORIZONTE_DEFECTO)} msi={data.msi} />
          <Link className="home__ver-mas" to="/balance">
            Ver balance y proyección
          </Link>
        </div>
      )}
    </section>
  )
}

function BloqueScore() {
  const { estado, data, copiaDe, error, reintentar } = useScore()
  const calculado = estado === 'ok' && data && data.estado === 'calculado' && data.puntaje !== null ? data : null

  return (
    <section className="home__bloque" aria-labelledby="home-score">
      <h2 id="home-score" className="home__bloque-titulo">
        Tu score
      </h2>
      {estado === 'ok' && <FechaCopia fecha={copiaDe} />}
      {estado === 'cargando' && <Esqueleto texto="Cargando tu score…" />}
      {estado === 'error' && <ErrorDelBloque titulo="No pudimos cargar tu score" error={error} onReintentar={reintentar} />}
      {estado === 'ok' && data && data.estado === 'datos_faltantes' && (
        <p className="home__aviso">
          Aún no podemos calcular tu score: faltan datos. <Link to="/score">Ver qué falta</Link>
        </p>
      )}
      {calculado && calculado.puntaje !== null && (
        <div className="score-contenido">
          <ScoreResumen
            puntaje={calculado.puntaje}
            nivelTexto={calculado.nivel_texto}
            tono={tonoDelNivel(calculado.nivel)}
            periodo={calculado.periodo}
            suman={calculado.factores.filter((f) => efectoDe(f) === 'suma').length}
            restan={calculado.factores.filter((f) => efectoDe(f) === 'resta').length}
            puntajeBruto={calculado.tope_aplicado ? calculado.puntaje_bruto : null}
            textoTope={calculado.tope_aplicado && calculado.motivo_tope ? TEXTO_TOPE[calculado.motivo_tope] : null}
          />
          <Link className="home__ver-mas" to="/score">
            Ver el desglose del score
          </Link>
        </div>
      )}
    </section>
  )
}

export default HomePage
