import { useState } from 'react'
import { Link } from 'react-router'
import BalanceVacio from '../components/BalanceVacio'
import CompromisosMsi from '../components/CompromisosMsi'
import FechaCopia from '../components/FechaCopia'
import GraficaProyeccion from '../components/GraficaProyeccion'
import ResumenMes from '../components/ResumenMes'
import { useBalance } from '../hooks/useBalance'
import { USANDO_EJEMPLO } from '../services/balance'
import { CLAVE_HORIZONTE, HORIZONTES, leerHorizonte, recortarMeses } from '../utils/balanceVista'
import type { Horizonte } from '../utils/balanceVista'
import { mesActual, mesLargo, sumarMeses } from '../utils/formatMes'
import './BalancePage.css'

/** Pantalla principal: balance del mes y proyección de los meses siguientes. */
function BalancePage() {
  const [mes, setMes] = useState(mesActual)
  // RF-40: 3, 6 o 12 meses (6 por defecto, RF-36). Se recuerda; se borra al cerrar sesión (prefijo ikamoney:).
  const [horizonte, setHorizonte] = useState<Horizonte>(() => {
    try {
      return leerHorizonte(localStorage.getItem(CLAVE_HORIZONTE))
    } catch {
      return leerHorizonte(null)
    }
  })
  const { estado, data, copiaDe, error, reintentar } = useBalance(mes)

  function elegirHorizonte(h: Horizonte) {
    setHorizonte(h)
    try {
      localStorage.setItem(CLAVE_HORIZONTE, String(h))
    } catch {
      // sin almacenamiento: el cambio vale solo en esta visita
    }
  }

  return (
    <main className="balance">
      <div className="balance__ancho">
      <nav className="balance__acciones" aria-label="Acciones">
        <Link className="balance__simular" to="/simulador">
          <span aria-hidden="true">＋</span> Simular una compra
        </Link>
      </nav>

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

      {estado === 'ok' && <FechaCopia fecha={copiaDe} />}

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
          <div className="balance__columna-grafica">
          <fieldset className="balance__horizonte">
            <legend>Ver los próximos</legend>
            {HORIZONTES.map((h) => (
              <label key={h} className={h === horizonte ? 'balance__horizonte-opcion balance__horizonte-opcion--activa' : 'balance__horizonte-opcion'}>
                <input type="radio" name="horizonte" value={h} checked={h === horizonte} onChange={() => elegirHorizonte(h)} />
                {h} meses
              </label>
            ))}
          </fieldset>
          <GraficaProyeccion meses={recortarMeses([data.resumen, ...data.proyeccion], horizonte)} />
          </div>
          <CompromisosMsi meses={recortarMeses([data.resumen, ...data.proyeccion], horizonte)} msi={data.msi} />
        </div>
      )}
      </div>
    </main>
  )
}

export default BalancePage
