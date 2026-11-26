import type { Frecuencia, MovimientoDelMes, TipoMovimiento } from '../types/movimiento'
import { faltaMarcar } from '../utils/cuentas'
import { formatDate, todayISO } from '../utils/formatDate'
import { formatMoney } from '../utils/formatMoney'
import { mesActual } from '../utils/formatMes'
import './MovimientosLista.css'

interface MovimientosListaProps {
  tipo: TipoMovimiento
  movimientos: MovimientoDelMes[]
  /** Sin conexión no se edita ni se elimina (T60). */
  soloLectura: boolean
  /** "Ya lo pagué" / "Ya me cayó" en lo que se repite. */
  onMarcar: (movimiento: MovimientoDelMes) => void
  onDeshacer: (movimiento: MovimientoDelMes) => void
  onEditar: (movimiento: MovimientoDelMes) => void
  onEliminar: (movimiento: MovimientoDelMes) => void
}

const dinero = (n: number) => formatMoney(n, 'MXN', 'es-MX')

const TEXTO_FRECUENCIA: Record<Frecuencia, string | null> = {
  unico: null,
  semanal: 'Cada semana',
  quincenal: 'Cada quincena',
  mensual: 'Cada mes',
  anual: 'Cada año',
}

/** Listado de ingresos o gastos del mes con editar y eliminar; muestra el estado vacío si no hay nada. */
function MovimientosLista({ tipo, movimientos, soloLectura, onMarcar, onDeshacer, onEditar, onEliminar }: MovimientosListaProps) {
  const esGasto = tipo === 'gasto'

  if (movimientos.length === 0) {
    return (
      <div className="empty">
        <div className="empty__icon" aria-hidden="true">
          $
        </div>
        <h2>{esGasto ? 'No hay gastos en este mes' : 'No hay ingresos en este mes'}</h2>
        <p>
          {esGasto
            ? 'Registra tus gastos fijos y variables para saber cuánto dinero te queda cada mes.'
            : 'Registra tu sueldo y otros ingresos para empezar a ver tu panorama.'}
        </p>
      </div>
    )
  }

  const ordenados = [...movimientos].sort((a, b) => b.fecha_ocurrencia.localeCompare(a.fecha_ocurrencia))

  return (
    <ul className="mlist">
      {/* Un movimiento recurrente sale varias veces en el mes con el mismo id: la fecha completa la llave. */}
      {ordenados.map((m) => (
        <li key={`${m.id}-${m.fecha_ocurrencia}`} className="mlist__item">
          <div className="mlist__row">
            <div>
              <p className="mlist__name">{m.concepto}</p>
              <p className="mlist__meta">
                {formatDate(m.fecha_ocurrencia)}
                {m.categoria && ` · ${m.categoria}`}
                {TEXTO_FRECUENCIA[m.frecuencia] && ` · ${TEXTO_FRECUENCIA[m.frecuencia]}`}
                {m.cuenta_nombre && ` · ${m.cuenta_nombre}`}
              </p>
            </div>
            <p className={`mlist__amount mlist__amount--${m.tipo}`}>
              {esGasto ? '−' : '+'}
              {dinero(m.monto)}
            </p>
          </div>
          {/* Lo que se repite se marca cuando de verdad pasa; los meses que no llegan, todavía no.
              Un único solo lo pide si se registró con fecha futura y ya llegó. */}
          {(m.frecuencia !== 'unico' ? m.fecha_ocurrencia.slice(0, 7) <= mesActual() : faltaMarcar(m, todayISO())) && (
            <div className="mlist__pago">
              {m.pagado ? (
                <>
                  <span className="mlist__pagado">
                    ✓ {esGasto ? 'Pagado' : 'Recibido'}
                    {m.fecha_pago && ` el ${formatDate(m.fecha_pago)}`}
                    {m.monto_planeado != null && ` (planeado: ${dinero(m.monto_planeado)})`}
                  </span>
                  <button type="button" className="mlist__deshacer" disabled={soloLectura} onClick={() => onDeshacer(m)}>
                    Deshacer
                  </button>
                </>
              ) : (
                <>
                  <span className="mlist__pendiente">Pendiente</span>
                  <button type="button" className="mlist__marcar" disabled={soloLectura} onClick={() => onMarcar(m)}>
                    {esGasto ? 'Ya lo pagué' : 'Ya me cayó'}
                  </button>
                </>
              )}
            </div>
          )}
          <div className="mlist__row mlist__row--foot">
            {m.clase && (
              <span className={`mlist__badge mlist__badge--${m.clase}`}>{m.clase === 'fijo' ? 'Fijo' : 'Variable'}</span>
            )}
            <div className="mlist__actions">
              <button type="button" disabled={soloLectura} onClick={() => onEditar(m)} aria-label={`Editar ${m.concepto}`}>
                Editar
              </button>
              <button
                type="button"
                className="mlist__delete"
                disabled={soloLectura}
                onClick={() => onEliminar(m)}
                aria-label={`Eliminar ${m.concepto}`}
              >
                Eliminar
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

export default MovimientosLista
