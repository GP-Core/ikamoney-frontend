import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router'
import { useConexion } from '../hooks/useConexion'
import { cuentasService } from '../services/cuentas'
import { NOMBRES_TIPO_CUENTA } from '../types/cuenta'
import type { Cuenta, ListaMovimientosCuenta, MovimientoCuenta, MovimientoCuentaPayload } from '../types/cuenta'
import { agruparPorDia, esCredito, esEntrada, saldoDe, textoTipoMovimiento } from '../utils/cuentas'
import { mensajeError } from '../utils/errores'
import { mesActual, mesLargo, sumarMeses } from '../utils/formatMes'
import { pesos } from '../utils/pesos'
import BotonPagar from './BotonPagar'
import Button from './Button'
import ConfirmDialog from './ConfirmDialog'
import FormAlert from './FormAlert'
import FormularioMovimientoCuenta from './FormularioMovimientoCuenta'
import Icon from './Icon'
import Modal from './Modal'
import TextField from './TextField'

const DIA = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', timeZone: 'UTC' })

interface Props {
  cuenta: Cuenta
  mes: string
  onMes: (mes: string) => void
  lista: ListaMovimientosCuenta | null
  cargando: boolean
  error: string | null
  /** Algo cambió: se vuelven a pedir saldos y movimientos. */
  onCambio: (aviso: string) => void
  onEliminada: () => void
}

type Ventana =
  | { tipo: 'movimiento'; movimiento?: MovimientoCuenta }
  | { tipo: 'saldo' }
  | { tipo: 'eliminar'; movimiento: MovimientoCuenta }
  | { tipo: 'eliminar-cuenta' }
  | null

/** Saldo, acciones y lo que pasó en la cuenta elegida. */
function DetalleCuenta({ cuenta, mes, onMes, lista, cargando, error, onCambio, onEliminada }: Props) {
  const enLinea = useConexion()
  const credito = esCredito(cuenta)
  const [ventana, setVentana] = useState<Ventana>(null)
  const [procesando, setProcesando] = useState(false)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)
  const cerrar = () => {
    setVentana(null)
    setErrorAccion(null)
  }
  const nombreMes = mesLargo(mes).toLowerCase()

  async function guardarMovimiento(datos: MovimientoCuentaPayload) {
    const editando = ventana?.tipo === 'movimiento' ? ventana.movimiento : undefined
    const guardado = editando
      ? await cuentasService.editarMovimiento(cuenta.id, editando.id, datos)
      : await cuentasService.crearMovimiento(cuenta.id, datos)
    cerrar()
    onCambio(guardado.saldo_negativo ? 'Guardado. Ojo: el saldo quedó en negativo.' : 'Movimiento guardado')
  }

  async function eliminar() {
    setProcesando(true)
    try {
      if (ventana?.tipo === 'eliminar') {
        await cuentasService.eliminarMovimiento(cuenta.id, ventana.movimiento.id)
        cerrar()
        onCambio('Movimiento eliminado')
      } else {
        await cuentasService.eliminar(cuenta.id)
        cerrar()
        onEliminada()
      }
    } catch (err) {
      setErrorAccion(mensajeError(err))
    } finally {
      setProcesando(false)
    }
  }

  const fila = (m: MovimientoCuenta) => {
    const entra = esEntrada(m.tipo)
    // En una tarjeta, un pago es bueno y un cargo sube la deuda: el signo habla de lo que debes.
    const signo = credito ? (entra ? '−' : '+') : entra ? '+' : '−'
    return (
      <li key={m.id} className="mcuenta">
        <div className="mcuenta__datos">
          <strong>{m.descripcion}</strong>
          <small>{m.es_pago && !credito ? 'Pago de deuda' : textoTipoMovimiento(m.tipo, credito)}</small>
          {m.en_balance && <span className="mcuenta__sello">En tu Balance</span>}
          {m.origen === 'extraido' && <span className="mcuenta__sello">Del estado de cuenta</span>}
        </div>
        <span className={entra ? 'mcuenta__monto mcuenta__monto--entra' : 'mcuenta__monto'}>
          {signo}
          {pesos(m.monto)}
        </span>
        <div className="mcuenta__acciones">
          {!m.es_pago && m.origen === 'manual' && (
            <button
              type="button"
              disabled={!enLinea}
              aria-label={`Editar ${m.descripcion}`}
              title="Editar"
              onClick={() => setVentana({ tipo: 'movimiento', movimiento: m })}
            >
              <Icon nombre="editar" tamano={18} />
            </button>
          )}
          <button
            type="button"
            disabled={!enLinea}
            aria-label={`Eliminar ${m.descripcion}`}
            title="Eliminar"
            onClick={() => setVentana({ tipo: 'eliminar', movimiento: m })}
          >
            <Icon nombre="basura" tamano={18} />
          </button>
        </div>
      </li>
    )
  }

  return (
    <section className="detalle" aria-label={`Detalle de ${cuenta.nombre}`}>
      <header className="detalle__cabeza">
        <h2>{cuenta.nombre}</h2>
        <p className="detalle__tipo">
          {NOMBRES_TIPO_CUENTA[cuenta.tipo]}
          {cuenta.banco ? ` · ${cuenta.banco}` : ''}
          {cuenta.ultimos_4 ? ` ····${cuenta.ultimos_4}` : ''}
        </p>
        <p className="detalle__saldo">
          <span>{credito ? 'Debes' : 'Tienes'}</span>
          <strong>{pesos(saldoDe(cuenta))}</strong>
        </p>
        <div className="detalle__acciones">
          <Button disabled={!enLinea} onClick={() => setVentana({ tipo: 'movimiento' })}>
            <Icon nombre="mas" tamano={18} />
            Agregar movimiento
          </Button>
          {credito ? (
            <>
              <BotonPagar
                destino={{ tipo: 'tarjeta', id: cuenta.id, nombre: cuenta.nombre }}
                texto="Pagar tarjeta"
                deshabilitado={!enLinea}
                onPagado={() => onCambio('Pago registrado')}
              />
              <Link className="boton boton--secundario detalle__enlace" to={`/tarjetas/${cuenta.id}`}>
                Ver tarjeta
              </Link>
            </>
          ) : (
            <Button variante="secundario" disabled={!enLinea} onClick={() => setVentana({ tipo: 'saldo' })}>
              Actualizar saldo
            </Button>
          )}
        </div>
      </header>

      <div className="detalle__mes">
        <button type="button" onClick={() => onMes(sumarMeses(mes, -1))} aria-label="Mes anterior">
          ‹
        </button>
        <h3 aria-live="polite">{mesLargo(mes)}</h3>
        <button type="button" disabled={mes >= mesActual()} onClick={() => onMes(sumarMeses(mes, 1))} aria-label="Mes siguiente">
          ›
        </button>
      </div>
      {mes !== mesActual() && (
        <button type="button" className="balance__volver" onClick={() => onMes(mesActual())}>
          Volver a este mes
        </button>
      )}

      {error && <FormAlert tipo="critico">{error}</FormAlert>}
      {cargando && !lista && <p role="status">Cargando…</p>}

      {lista && (
        <>
          <dl className="detalle__totales">
            <div>
              <dt>{credito ? 'Pagaste' : 'Entró'}</dt>
              <dd className="detalle__entra">{pesos(lista.totales.entradas)}</dd>
            </div>
            <div>
              <dt>{credito ? 'Se cargó' : 'Salió'}</dt>
              <dd>{pesos(lista.totales.salidas)}</dd>
            </div>
          </dl>

          {lista.movimientos.length === 0 ? (
            <p className="detalle__vacio">Sin movimientos en {nombreMes}.</p>
          ) : (
            agruparPorDia(lista.movimientos).map((grupo) => (
              <div key={grupo.fecha}>
                <h4 className="detalle__dia">{DIA.format(new Date(`${grupo.fecha}T00:00:00Z`))}</h4>
                <ul className="detalle__lista">{grupo.movimientos.map(fila)}</ul>
              </div>
            ))
          )}
        </>
      )}

      {!credito && (
        <button type="button" className="detalle__borrar" disabled={!enLinea} onClick={() => setVentana({ tipo: 'eliminar-cuenta' })}>
          Eliminar esta cuenta
        </button>
      )}

      <Modal
        open={ventana?.tipo === 'movimiento'}
        title={ventana?.tipo === 'movimiento' && ventana.movimiento ? 'Editar movimiento' : `Nuevo en ${cuenta.nombre}`}
        onClose={cerrar}
      >
        {ventana?.tipo === 'movimiento' && (
          <FormularioMovimientoCuenta cuenta={cuenta} inicial={ventana.movimiento} onGuardar={guardarMovimiento} onCancelar={cerrar} />
        )}
      </Modal>

      <Modal open={ventana?.tipo === 'saldo'} title="Actualizar saldo" onClose={cerrar}>
        {ventana?.tipo === 'saldo' && (
          <FormularioSaldo
            cuenta={cuenta}
            onListo={() => {
              cerrar()
              onCambio('Saldo actualizado')
            }}
            onCancelar={cerrar}
          />
        )}
      </Modal>

      <ConfirmDialog
        abierto={ventana?.tipo === 'eliminar' || ventana?.tipo === 'eliminar-cuenta'}
        titulo={ventana?.tipo === 'eliminar-cuenta' ? `¿Eliminar ${cuenta.nombre}?` : '¿Eliminar este movimiento?'}
        textoConfirmar={ventana?.tipo === 'eliminar-cuenta' ? 'Eliminar cuenta' : 'Eliminar'}
        procesando={procesando}
        onConfirmar={eliminar}
        onCancelar={cerrar}
      >
        {errorAccion && <FormAlert tipo="critico">{errorAccion}</FormAlert>}
        {ventana?.tipo === 'eliminar' && (
          <p>
            {ventana.movimiento.descripcion} · {pesos(ventana.movimiento.monto)}.{' '}
            {ventana.movimiento.es_pago
              ? 'Se deshace el pago completo: el dinero regresa a la cuenta y lo que debes vuelve a subir.'
              : ventana.movimiento.en_balance
                ? 'El saldo se corrige y deja de contar en tu Balance.'
                : 'Esta acción no se puede deshacer.'}
          </p>
        )}
        {ventana?.tipo === 'eliminar-cuenta' && (
          <p>Se borran la cuenta y sus movimientos. Tus gastos e ingresos se quedan en Balance. No se puede deshacer.</p>
        )}
      </ConfirmDialog>
    </section>
  )
}

function FormularioSaldo({ cuenta, onListo, onCancelar }: { cuenta: Cuenta; onListo: () => void; onCancelar: () => void }) {
  const [saldo, setSaldo] = useState(String(saldoDe(cuenta)))
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    const monto = Number(saldo)
    if (saldo.trim() === '' || Number.isNaN(monto) || monto < 0) return setError('Escribe cuánto tienes: cero o más.')
    setEnviando(true)
    try {
      await cuentasService.editar(cuenta.id, { saldo_disponible: Math.round(monto * 100) / 100 })
      onListo()
    } catch (err) {
      setError(mensajeError(err))
      setEnviando(false)
    }
  }

  return (
    <form className="cform" onSubmit={enviar} noValidate>
      {error && <FormAlert tipo="critico">{error}</FormAlert>}
      <TextField etiqueta={`¿Cuánto hay en ${cuenta.nombre}?`} inputMode="decimal" value={saldo} onChange={(e) => setSaldo(e.target.value)} />
      <p className="cform__nota">Úsalo para cuadrar con tu banco. No crea ningún gasto ni ingreso.</p>
      <div className="cform__acciones">
        <Button type="button" variante="secundario" onClick={onCancelar} disabled={enviando}>
          Cancelar
        </Button>
        <Button type="submit" cargando={enviando}>
          Guardar
        </Button>
      </div>
    </form>
  )
}

export default DetalleCuenta
