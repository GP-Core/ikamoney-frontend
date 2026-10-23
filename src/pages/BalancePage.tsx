import { useState } from 'react'
import BalanceVacio from '../components/BalanceVacio'
import CompromisosMsi from '../components/CompromisosMsi'
import GraficaProyeccion from '../components/GraficaProyeccion'
import ResumenMes from '../components/ResumenMes'
import { useBalance } from '../hooks/useBalance'
import { USANDO_EJEMPLO } from '../services/balance'
import { mesActual, mesLargo, sumarMeses } from '../utils/formatMes'
import './BalancePage.css'

/** Pantalla principal: balance del mes y proyección de los meses siguientes. */
function BalancePage() {
  const [mes, setMes] = useState(mesActual)
  const { estado, data, error, reintentar } = useBalance(mes)

  return (
    <main className="balance">
      <header className="balance__encabezado">
        <button type="button" className="balance__mes-boton" onClick={() => setMes(sumarMeses(mes, -1))} aria-label="Mes anterior">
          ‹
        </button>
        <div className="balance__mes">
          <h1 className="balance__titulo">{mesLargo(mes)}</h1>
          {USANDO_EJEMPLO && <span className="balance__ejemplo">Datos de ejemplo</span>}
        </div>
        <button type="button" className="balance__mes-boton" onClick={() => setMes(sumarMeses(mes, 1))} aria-label="Mes siguiente">
          ›
        </button>
      </header>

      {estado === 'cargando' && (
        <div className="balance__contenido" aria-busy="true" aria-live="polite">
          <span className="balance__sr">Cargando tu balance…</span>
          <div className="esqueleto esqueleto--resumen" />
          <div className="esqueleto esqueleto--grafica" />
          <div className="esqueleto esqueleto--msi" />
        </div>
      )}

      {estado === 'error' && (
        <section className="balance__error" role="alert">
          <h2>No pudimos cargar tu balance</h2>
          <p>{error}</p>
          <button type="button" className="balance__reintentar" onClick={reintentar}>
            Reintentar
          </button>
        </section>
      )}

      {estado === 'ok' && data && !data.tiene_datos && <BalanceVacio />}

      {estado === 'ok' && data && data.tiene_datos && (
        <div className="balance__contenido">
          <ResumenMes datos={data.resumen} />
          <GraficaProyeccion meses={[data.resumen, ...data.proyeccion]} />
          <CompromisosMsi meses={[data.resumen, ...data.proyeccion]} msi={data.msi} />
        </div>
      )}
    </main>
  )
}

export default BalancePage
