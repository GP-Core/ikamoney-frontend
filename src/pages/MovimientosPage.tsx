import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import Modal from '../components/Modal'
import MovimientoFormulario from '../components/MovimientoFormulario'
import MovimientosLista from '../components/MovimientosLista'
import FechaCopia from '../components/FechaCopia'
import FormularioOcurrencia from '../components/FormularioOcurrencia'
import { useConexion } from '../hooks/useConexion'
import { useCategorias, useCuentas, useMovimientos } from '../hooks/useFinanzas'
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
  const { datos: cuentas, recargar: recargarCuentas } = useCuentas()
  const [pestana, setPestana] = useState<TipoMovimiento>('gasto')
  const [porPagar, setPorPagar] = useState<MovimientoDelMes | null>(null)
  // null = cerrado; con "movimiento" es edición, sin él es alta.
  const [formulario, setFormulario] = useState<{ movimiento?: MovimientoDelMes } | null>(null)
  const [porEliminar, setPorEliminar] = useState<MovimientoDelMes | null>(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null)
  // Otras pantallas (el simulador) llegan aquí con un aviso de lo que registraron.
  const llegada = useLocation().state as { aviso?: string } | null
  const [aviso, setAviso] = useState(llegada?.aviso ?? '')

  useEffect(() => {
    if (!aviso) return
    const timer = setTimeout(() => setAviso(''), 3500)
    return () => clearTimeout(timer)
  }, [aviso])

  const etiqueta = pestana === 'gasto' ? 'gasto' : 'ingreso'
  const delTipo = (tipo: TipoMovimiento) => datos?.movimientos.filter((m) => m.tipo === tipo) ?? []

  function recargarTodo() {
    recargar()
    recargarCuentas()
  }

  async function guardar(payload: MovimientoPayload) {
    const editando = formulario?.movimiento
    let guardado
    if (editando) {
      // El tipo no se puede cambiar: el backend rechaza el campo en la edición.
      guardado = await movimientosService.actualizar(editando.id, {
        // Solo si cambió: enviar la misma no hace falta
        ...(payload.cuenta_id !== (editando.cuenta_id ?? null) && { cuenta_id: payload.cuenta_id }),
        concepto: payload.concepto,
        monto: payload.monto,
        frecuencia: payload.frecuencia,
        fecha: payload.fecha,
        categoria_id: payload.categoria_id,
        clase: payload.clase,
      })
    } else {
      guardado = await movimientosService.crear(payload)
    }
    const que = payload.tipo === 'gasto' ? 'Gasto' : 'Ingreso'
    setAviso(
      guardado.registrado_como === 'compra_tarjeta'
        ? `Guardado como compra en ${guardado.cuenta_nombre}. La verás en Cuentas.`
        : guardado.saldo_negativo
          ? `${que} guardado. Ojo: ${guardado.cuenta_nombre} quedó en negativo.`
          : `${que} ${editando ? 'actualizado' : 'guardado'}`,
    )
    setFormulario(null)
    recargarTodo()
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
      recargarTodo()
    } catch (err) {
      setErrorEliminar(mensajeError(err))
    } finally {
      setEliminando(false)
    }
  }

  async function deshacerPago(m: MovimientoDelMes) {
    try {
      await movimientosService.quitarOcurrencia(m.id, m.fecha_ocurrencia)
      setAviso('Listo: el dinero regresó a la cuenta')
      recargarTodo()
    } catch (err) {
      setAviso(mensajeError(err))
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
            onMarcar={setPorPagar}
            onDeshacer={deshacerPago}
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
            cuentas={cuentas}
            onGuardar={guardar}
            onCrearCategoria={crearCategoria}
            onCancelar={() => setFormulario(null)}
          />
        )}
      </Modal>

      <Modal
        open={porPagar !== null}
        title={porPagar ? porPagar.concepto : ''}
        onClose={() => setPorPagar(null)}
      >
        {porPagar && (
          <FormularioOcurrencia
            movimiento={porPagar}
            onListo={() => {
              setPorPagar(null)
              setAviso(porPagar.tipo === 'gasto' ? 'Marcado como pagado' : 'Marcado como recibido')
              recargarTodo()
            }}
            onCancelar={() => setPorPagar(null)}
          />
        )}
      </Modal>

      <Modal open={porEliminar !== null} title="¿Eliminar este movimiento?" onClose={() => setPorEliminar(null)}>
        <p>
          {porEliminar?.concepto} · {porEliminar && dinero(porEliminar.monto)}.
          {porEliminar && porEliminar.frecuencia !== 'unico' && ' Se quitará también de los demás meses; lo que ya pagaste se queda en tu cuenta.'}
          {porEliminar?.cuenta_nombre && porEliminar.frecuencia === 'unico' && ` El dinero regresa a ${porEliminar.cuenta_nombre}.`}{' '}
          Esta acción no se puede deshacer.
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
