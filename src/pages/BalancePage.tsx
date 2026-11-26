import { useState } from 'react'
import { Link } from 'react-router'
import BalanceVacio from '../components/BalanceVacio'
import CompromisosMsi from '../components/CompromisosMsi'
import FechaCopia from '../components/FechaCopia'
import GraficaProyeccion from '../components/GraficaProyeccion'
import Icon from '../components/Icon'
import ResumenMes from '../components/ResumenMes'
import { useBalance } from '../hooks/useBalance'
import { USANDO_EJEMPLO } from '../services/balance'
import { CLAVE_HORIZONTE, leerHorizonte, momentoDelMes, recortarMeses } from '../utils/balanceVista'
import type { Horizonte } from '../utils/balanceVista'
import { mesActual, mesLargo, mesNombre, sumarMeses } from '../utils/formatMes'
import './BalancePage.css'

/** El backend proyecta desde el mes actual hasta 24 meses. */
const MESES_ADELANTE = 23

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
  const hoy = mesActual()
  const momento = momentoDelMes(mes, hoy)

  function elegirHorizonte(h: Horizonte) {
    setHorizonte(h)
    try {
      localStorage.setItem(CLAVE_HORIZONTE, String(h))
    } catch {
      // sin almacenamiento: el cambio vale solo en esta visita
    }
  }

  return (
    <main className="balance balance--t20 balance--proyeccion">
      <div className="balance__ancho">
      <header className="balance__cabecera">
        <h1>Balance y proyección</h1>
        <Link className="balance__simular" to="/simulador">
          <Icon nombre="calculadora" tamano={20} />
          Simular una compra
        </Link>
      </header>

      <div className="balance__encabezado">
        <button
          type="button"
          className="balance__mes-boton"
          onClick={() => setMes(sumarMeses(mes, -1))}
          disabled={mes <= hoy}
          title={mes <= hoy ? 'La proyección empieza en el mes actual' : undefined}
          aria-label="Mes anterior"
        >
          ‹
        </button>
        <div className="balance__mes">
          <h2 className="balance__titulo" aria-live="polite">
            {mesLargo(mes)}
          </h2>
          <span className={`balance__momento balance__momento--${momento}`}>
            {momento === 'proyeccion' && <Icon nombre="calendario" tamano={14} />}
            {momento === 'proyeccion' ? 'Proyección' : 'Este mes'}
          </span>
          {USANDO_EJEMPLO && <span className="balance__ejemplo">Datos de ejemplo</span>}
        </div>
        <button
          type="button"
          className="balance__mes-boton"
          onClick={() => setMes(sumarMeses(mes, 1))}
          disabled={mes >= sumarMeses(hoy, MESES_ADELANTE)}
          aria-label="Mes siguiente"
        >
          ›
        </button>
      </div>

      {mes !== hoy && (
        <button type="button" className="balance__volver" onClick={() => setMes(hoy)}>
          Volver a {mesNombre(hoy).toLowerCase()}
        </button>
      )}

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
          <ResumenMes datos={data.resumen} momento={momento} variablesEstimadas={data.variables_estimadas} />
          <div className="balance__columna-grafica">
            <GraficaProyeccion
              meses={recortarMeses([data.resumen, ...data.proyeccion], horizonte)}
              mesDeHoy={hoy}
              horizonte={horizonte}
              onHorizonte={elegirHorizonte}
              ahorroInicial={data.en_cuentas}
              variablesEstimadas={data.variables_estimadas}
            />
          </div>
          <CompromisosMsi meses={[data.resumen, ...data.proyeccion]} msi={data.msi} momento={momento} />
        </div>
      )}
      </div>
    </main>
  )
}

export default BalancePage
