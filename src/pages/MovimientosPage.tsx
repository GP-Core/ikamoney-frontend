import { useEffect, useState } from 'react'
import Modal from '../components/Modal'
import MovimientoFormulario from '../components/MovimientoFormulario'
import MovimientosLista from '../components/MovimientosLista'
import FechaCopia from '../components/FechaCopia'
import { useConexion } from '../hooks/useConexion'
import { useCategorias, useMovimientos } from '../hooks/useFinanzas'
import { movimientosService } from '../services/movimientos'
import type { MovimientoDelMes, MovimientoPayload, TipoMovimiento } from '../types/movimiento'
import { mensajeError } from '../utils/errores'
import { formatMoney } from '../utils/formatMoney'
import { mesActual, mesLargo, sumarMeses } from '../utils/formatMes'
import './MovimientosPage.css'

const dinero = (n: number) => formatMoney(n, 'MXN', 'es-MX')

/** Pantalla de movimientos: resumen del mes, listados de gastos e ingresos y formularios de alta y edición. */
function MovimientosPage() {
  const enLinea = useConexion()
  const [mes, setMes] = useState(mesActual)
  const { datos, copiaDe, error, cargando, recargar } = useMovimientos(mes)
  const { datos: categorias, recargar: recargarCategorias } = useCategorias()
  const [pestana, setPestana] = useState<TipoMovimiento>('gasto')
  // null = cerrado; con "movimiento" es edición, sin él es alta.
  const [formulario, setFormulario] = useState<{ movimiento?: MovimientoDelMes } | null>(null)
  const [porEliminar, setPorEliminar] = useState<MovimientoDelMes | null>(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null)
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    if (!aviso) return
    const timer = setTimeout(() => setAviso(''), 2500)
    return () => clearTimeout(timer)
  }, [aviso])

  const etiqueta = pestana === 'gasto' ? 'gasto' : 'ingreso'
  const delTipo = (tipo: TipoMovimiento) => datos?.movimientos.filter((m) => m.tipo === tipo) ?? []

  async function guardar(payload: MovimientoPayload) {
    const editando = formulario?.movimiento
    if (editando) {
      // El tipo no se puede cambiar: el backend rechaza el campo en la edición.
      await movimientosService.actualizar(editando.id, {
        concepto: payload.concepto,
        monto: payload.monto,
        frecuencia: payload.frecuencia,
        fecha: payload.fecha,
        categoria_id: payload.categoria_id,
        clase: payload.clase,
      })
    } else {
      await movimientosService.crear(payload)
    }
    setAviso(`${payload.tipo === 'gasto' ? 'Gasto' : 'Ingreso'} ${editando ? 'actualizado' : 'guardado'}`)
    setFormulario(null)
    recargar()
  }

  async function crearCategoria(nombre: string) {
    const creada = await movimientosService.crearCategoria(nombre)
    recargarCategorias()
    return creada
  }

  async function confirmarEliminacion() {
    if (!porEliminar) return
    setEliminando(true)
    setErrorEliminar(null)
    try {
      await movimientosService.eliminar(porEliminar.id)
      setAviso(`${porEliminar.tipo === 'gasto' ? 'Gasto' : 'Ingreso'} eliminado`)
      setPorEliminar(null)
      recargar()
    } catch (err) {
      setErrorEliminar(mensajeError(err))
    } finally {
      setEliminando(false)
    }
  }

  return (
    <main className="movements">
      <h1>Movimientos</h1>

      <div className="movements__mes">
        <button type="button" onClick={() => setMes(sumarMeses(mes, -1))} aria-label="Mes anterior">
          ‹
        </button>
        <p aria-live="polite">{mesLargo(mes)}</p>
        <button type="button" onClick={() => setMes(sumarMeses(mes, 1))} aria-label="Mes siguiente">
          ›
        </button>
      </div>

      {copiaDe && <FechaCopia fecha={copiaDe} />}

      {cargando && (
        <p role="status" className="movements__estado">
          Cargando…
        </p>
      )}

      {error && (
        <div className="movements__warn" role="alert">
          <p>{error}</p>
          <button type="button" className="btn btn--ghost" onClick={recargar}>
            Reintentar
          </button>
        </div>
      )}

      {datos && (
        <>
          <section className="movements__summary" aria-label="Resumen del mes">
            <p className="movements__eyebrow">Te quedan</p>
            <p className="movements__balance">{dinero(datos.totales.balance)}</p>
            <dl>
              <div>
                <dt>Ingresos</dt>
                <dd>{dinero(datos.totales.ingresos)}</dd>
              </div>
              <div>
                <dt>Gastos</dt>
                <dd>{dinero(datos.totales.gastos)}</dd>
              </div>
            </dl>
            {datos.movimientos.length > 0 && datos.totales.balance < 0 && (
              <p className="movements__warn" role="status">
                ⚠ Estás gastando más de lo que ingresas.
              </p>
            )}
          </section>

          <div className="movements__tabs" role="tablist" aria-label="Tipo de movimiento">
            {(['gasto', 'ingreso'] as const).map((tipo) => (
              <button key={tipo} type="button" role="tab" aria-selected={pestana === tipo} onClick={() => setPestana(tipo)}>
                {tipo === 'gasto' ? 'Gastos' : 'Ingresos'} ({delTipo(tipo).length})
              </button>
            ))}
          </div>

          <MovimientosLista
            tipo={pestana}
            movimientos={delTipo(pestana)}
            soloLectura={!enLinea}
            onEditar={(movimiento) => setFormulario({ movimiento })}
            onEliminar={(movimiento) => {
              setErrorEliminar(null)
              setPorEliminar(movimiento)
            }}
          />
        </>
      )}

      <div className="movements__bar">
        <button
          type="button"
          className="btn btn--primary"
          disabled={!enLinea}
          title={enLinea ? undefined : 'Sin conexión'}
          onClick={() => setFormulario({})}
        >
          + Agregar {etiqueta}
        </button>
      </div>

      <Modal
        open={formulario !== null}
        title={`${formulario?.movimiento ? 'Editar' : 'Nuevo'} ${formulario?.movimiento?.tipo ?? etiqueta}`}
        onClose={() => setFormulario(null)}
      >
        {formulario && (
          <MovimientoFormulario
            tipo={formulario.movimiento?.tipo ?? pestana}
            inicial={formulario.movimiento}
            categorias={categorias}
            onGuardar={guardar}
            onCrearCategoria={crearCategoria}
            onCancelar={() => setFormulario(null)}
          />
        )}
      </Modal>

      <Modal open={porEliminar !== null} title="¿Eliminar este movimiento?" onClose={() => setPorEliminar(null)}>
        <p>
          {porEliminar?.concepto} · {porEliminar && dinero(porEliminar.monto)}.
          {porEliminar && porEliminar.frecuencia !== 'unico' && ' Se quitará también de los demás meses.'} Esta acción no
          se puede deshacer.
        </p>
        {errorEliminar && (
          <p className="movements__warn" role="alert">
            {errorEliminar}
          </p>
        )}
        <div className="movements__confirm">
          <button type="button" className="btn btn--ghost" onClick={() => setPorEliminar(null)} disabled={eliminando}>
            Cancelar
          </button>
          <button type="button" className="btn btn--danger" onClick={confirmarEliminacion} disabled={eliminando}>
            {eliminando ? 'Eliminando…' : 'Eliminar'}
          </button>
        </div>
      </Modal>

      {aviso && (
        <div className="movements__toast" role="status">
          {aviso}
        </div>
      )}
    </main>
  )
}

export default MovimientosPage
