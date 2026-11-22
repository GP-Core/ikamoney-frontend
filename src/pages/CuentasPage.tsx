import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Button from '../components/Button'
import FechaCopia from '../components/FechaCopia'
import FormAlert from '../components/FormAlert'
import Modal from '../components/Modal'
import SelectField from '../components/SelectField'
import TextField from '../components/TextField'
import { useConexion } from '../hooks/useConexion'
import { useCuentas, useMovimientosCuenta } from '../hooks/useFinanzas'
import { cuentasService } from '../services/cuentas'
import { NOMBRES_TIPO_CUENTA, TIPOS_DE_MOVIMIENTO } from '../types/cuenta'
import type { Cuenta, MovimientoCuenta, TipoCuentaNueva, TipoMovimientoCuenta } from '../types/cuenta'
import { mensajeError } from '../utils/errores'
import { formatMoney } from '../utils/formatMoney'
import { mesActual, mesLargo, sumarMeses } from '../utils/formatMes'
import './MovimientosPage.css'
import './CuentasPage.css'

const dinero = (n: number) => formatMoney(n, 'MXN', 'es-MX')
const hoyIso = () => new Date().toLocaleDateString('en-CA') // AAAA-MM-DD en hora local
const TIPOS_NUEVA: TipoCuentaNueva[] = ['debito', 'ahorro', 'efectivo', 'monedero', 'otro']
const ENTRADAS: TipoMovimientoCuenta[] = ['abono', 'pago']

const TEXTO_TIPO: Record<TipoMovimientoCuenta, string> = {
  abono: 'Abono',
  cargo: 'Cargo',
  pago: 'Pago',
  interes: 'Interés',
  comision: 'Comisión',
  mensualidad_msi: 'Mensualidad MSI',
}

/** Cuentas del usuario (débito, ahorro, efectivo…, y sus tarjetas de crédito) con lo que pasó en cada una. */
function CuentasPage() {
  const enLinea = useConexion()
  const { datos: cuentas, copiaDe, error, cargando, recargar } = useCuentas()
  const [elegida, setElegida] = useState<number | null>(null)
  const [mes, setMes] = useState(mesActual)
  const [formCuenta, setFormCuenta] = useState(false)
  const [formMovimiento, setFormMovimiento] = useState(false)
  const [aviso, setAviso] = useState('')

  const cuenta = cuentas?.find((c) => c.id === (elegida ?? cuentas[0]?.id)) ?? null
  const { datos: lista, error: errorLista, cargando: cargandoLista, recargar: recargarLista } = useMovimientosCuenta(
    cuenta?.id ?? null,
    mes,
  )

  useEffect(() => {
    if (!aviso) return
    const timer = setTimeout(() => setAviso(''), 2500)
    return () => clearTimeout(timer)
  }, [aviso])

  async function eliminarMovimiento(m: MovimientoCuenta) {
    try {
      await cuentasService.eliminarMovimiento(m.cuenta_id, m.id)
      setAviso('Movimiento eliminado')
      recargarLista()
    } catch (err) {
      setAviso(mensajeError(err))
    }
  }

  async function eliminarCuenta(c: Cuenta) {
    try {
      await cuentasService.eliminar(c.id)
      setElegida(null)
      setAviso('Cuenta eliminada')
      recargar()
    } catch (err) {
      setAviso(mensajeError(err))
    }
  }

  return (
    <main className="movements cuentas">
      <h1>Cuentas</h1>
      <p className="cuentas__intro">Débito, ahorro, efectivo… y tus tarjetas. Aquí ves lo que pasó en cada una.</p>

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

      {cuentas && cuentas.length === 0 && <p className="cuentas__vacio">Todavía no tienes cuentas. Agrega la primera.</p>}

      {cuentas && cuentas.length > 0 && (
        <ul className="cuentas__lista" aria-label="Tus cuentas">
          {cuentas.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="cuentas__cuenta"
                aria-pressed={c.id === cuenta?.id}
                onClick={() => setElegida(c.id)}
              >
                <strong>{c.nombre}</strong>
                <span>
                  {NOMBRES_TIPO_CUENTA[c.tipo]}
                  {c.ultimos_4 ? ` ····${c.ultimos_4}` : ''}
                </span>
                <span className="cuentas__saldo">
                  {c.tipo === 'credito' ? `Debes ${dinero(c.saldo_actual ?? 0)}` : dinero(c.saldo_disponible ?? 0)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {cuenta && (
        <section aria-label={`Movimientos de ${cuenta.nombre}`}>
          <div className="movements__mes">
            <button type="button" onClick={() => setMes(sumarMeses(mes, -1))} aria-label="Mes anterior">
              ‹
            </button>
            <p aria-live="polite">{mesLargo(mes)}</p>
            <button type="button" onClick={() => setMes(sumarMeses(mes, 1))} aria-label="Mes siguiente">
              ›
            </button>
          </div>

          {errorLista && (
            <p className="movements__warn" role="alert">
              {errorLista}
            </p>
          )}
          {cargandoLista && !lista && <p role="status">Cargando…</p>}

          {lista && (
            <>
              <dl className="cuentas__totales">
                <div>
                  <dt>Entradas</dt>
                  <dd>{dinero(lista.totales.entradas)}</dd>
                </div>
                <div>
                  <dt>Salidas</dt>
                  <dd>{dinero(lista.totales.salidas)}</dd>
                </div>
                <div>
                  <dt>Neto</dt>
                  <dd>{dinero(lista.totales.neto)}</dd>
                </div>
              </dl>
              {lista.movimientos.length === 0 ? (
                <p className="cuentas__vacio">Sin movimientos este mes.</p>
              ) : (
                <ul className="cuentas__movimientos">
                  {lista.movimientos.map((m) => (
                    <li key={m.id}>
                      <span>
                        <strong>{m.descripcion}</strong>
                        <small>
                          {m.fecha} · {TEXTO_TIPO[m.tipo]}
                        </small>
                      </span>
                      <span className={ENTRADAS.includes(m.tipo) ? 'cuentas__entra' : 'cuentas__sale'}>
                        {ENTRADAS.includes(m.tipo) ? '+' : '−'}
                        {dinero(m.monto)}
                      </span>
                      <button
                        type="button"
                        className="btn btn--ghost"
                        disabled={!enLinea}
                        aria-label={`Eliminar ${m.descripcion}`}
                        onClick={() => eliminarMovimiento(m)}
                      >
                        Eliminar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          <div className="cuentas__acciones">
            <button type="button" className="btn btn--primary" disabled={!enLinea} onClick={() => setFormMovimiento(true)}>
              + Agregar movimiento
            </button>
            {cuenta.tipo !== 'credito' && (
              <button type="button" className="btn btn--ghost" disabled={!enLinea} onClick={() => eliminarCuenta(cuenta)}>
                Eliminar cuenta
              </button>
            )}
          </div>
        </section>
      )}

      <div className="movements__bar">
        <button type="button" className="btn btn--primary" disabled={!enLinea} onClick={() => setFormCuenta(true)}>
          + Agregar cuenta
        </button>
      </div>

      <Modal open={formCuenta} title="Nueva cuenta" onClose={() => setFormCuenta(false)}>
        {formCuenta && (
          <FormularioCuenta
            onListo={() => {
              setFormCuenta(false)
              setAviso('Cuenta guardada')
              recargar()
            }}
            onCancelar={() => setFormCuenta(false)}
          />
        )}
      </Modal>

      <Modal open={formMovimiento} title="Nuevo movimiento" onClose={() => setFormMovimiento(false)}>
        {formMovimiento && cuenta && (
          <FormularioMovimiento
            cuenta={cuenta}
            onListo={() => {
              setFormMovimiento(false)
              setAviso('Movimiento guardado')
              recargarLista()
            }}
            onCancelar={() => setFormMovimiento(false)}
          />
        )}
      </Modal>

      {aviso && (
        <div className="movements__toast" role="status">
          {aviso}
        </div>
      )}
    </main>
  )
}

function FormularioCuenta({ onListo, onCancelar }: { onListo: () => void; onCancelar: () => void }) {
  const [tipo, setTipo] = useState<TipoCuentaNueva>('debito')
  const [nombre, setNombre] = useState('')
  const [banco, setBanco] = useState('')
  const [saldo, setSaldo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) return setError('Escribe un nombre para la cuenta.')
    const monto = saldo.trim() === '' ? 0 : Number(saldo)
    if (Number.isNaN(monto) || monto < 0) return setError('El saldo debe ser un número mayor o igual a cero.')
    setEnviando(true)
    setError(null)
    try {
      await cuentasService.crear({
        tipo,
        nombre: nombre.trim(),
        ...(banco.trim() && { banco: banco.trim() }),
        saldo_disponible: monto,
      })
      onListo()
    } catch (err) {
      setError(mensajeError(err))
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="cuentas__form">
      {error && <FormAlert tipo="critico">{error}</FormAlert>}
      <SelectField
        etiqueta="Tipo"
        value={tipo}
        onChange={(e) => setTipo(e.target.value as TipoCuentaNueva)}
        opciones={TIPOS_NUEVA.map((t) => ({ valor: t, texto: NOMBRES_TIPO_CUENTA[t] }))}
      />
      <TextField etiqueta="Nombre" value={nombre} maxLength={60} onChange={(e) => setNombre(e.target.value)} />
      <TextField etiqueta="Banco (opcional)" value={banco} maxLength={60} onChange={(e) => setBanco(e.target.value)} />
      <TextField etiqueta="Saldo actual" inputMode="decimal" value={saldo} onChange={(e) => setSaldo(e.target.value)} />
      <div className="movements__confirm">
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

function FormularioMovimiento({ cuenta, onListo, onCancelar }: { cuenta: Cuenta; onListo: () => void; onCancelar: () => void }) {
  const tipos = TIPOS_DE_MOVIMIENTO[cuenta.tipo === 'credito' ? 'credito' : 'otras']
  const [tipo, setTipo] = useState<TipoMovimientoCuenta>(tipos[0].valor)
  const [descripcion, setDescripcion] = useState('')
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(hoyIso)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    const valor = Number(monto)
    if (!descripcion.trim()) return setError('Describe el movimiento.')
    if (!monto.trim() || Number.isNaN(valor) || valor <= 0) return setError('El monto debe ser mayor a cero.')
    setEnviando(true)
    setError(null)
    try {
      await cuentasService.crearMovimiento(cuenta.id, { fecha, descripcion: descripcion.trim(), monto: valor, tipo })
      onListo()
    } catch (err) {
      setError(mensajeError(err))
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="cuentas__form">
      {error && <FormAlert tipo="critico">{error}</FormAlert>}
      <SelectField
        etiqueta="Tipo"
        value={tipo}
        onChange={(e) => setTipo(e.target.value as TipoMovimientoCuenta)}
        opciones={tipos.map((t) => ({ valor: t.valor, texto: t.texto }))}
      />
      <TextField etiqueta="Descripción" value={descripcion} maxLength={255} onChange={(e) => setDescripcion(e.target.value)} />
      <TextField etiqueta="Monto" inputMode="decimal" value={monto} onChange={(e) => setMonto(e.target.value)} />
      <TextField etiqueta="Fecha" type="date" value={fecha} max={hoyIso()} onChange={(e) => setFecha(e.target.value)} />
      <div className="movements__confirm">
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

export default CuentasPage
