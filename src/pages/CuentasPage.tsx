import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router'
import AyudaTermino from '../components/AyudaTermino'
import Button from '../components/Button'
import DetalleCuenta from '../components/DetalleCuenta'
import FechaCopia from '../components/FechaCopia'
import FormAlert from '../components/FormAlert'
import Icon from '../components/Icon'
import type { NombreIcono } from '../components/Icon'
import Modal from '../components/Modal'
import TextField from '../components/TextField'
import { useConexion } from '../hooks/useConexion'
import { useCuentas, useMovimientosCuenta } from '../hooks/useFinanzas'
import { cuentasService } from '../services/cuentas'
import { NOMBRES_TIPO_CUENTA } from '../types/cuenta'
import type { Cuenta, TipoCuentaNueva } from '../types/cuenta'
import { agruparCuentas, deudaEnTarjetas, dineroDisponible, esCredito, saldoDe } from '../utils/cuentas'
import { mensajeError } from '../utils/errores'
import { mesActual } from '../utils/formatMes'
import { pesos } from '../utils/pesos'
import './BalancePage.css'
import '../components/CuentasForm.css'
import './CuentasPage.css'

const TIPOS_NUEVA: TipoCuentaNueva[] = ['debito', 'ahorro', 'efectivo', 'monedero', 'otro']
const ICONO_TIPO: Record<Cuenta['tipo'], NombreIcono> = {
  credito: 'tarjeta',
  debito: 'cartera',
  ahorro: 'cartera',
  efectivo: 'cartera',
  monedero: 'cartera',
  otro: 'cartera',
}

/** Dónde está tu dinero y lo que debes, con lo que pasó en cada cuenta. */
function CuentasPage() {
  const enLinea = useConexion()
  const { datos, copiaDe, error, cargando, recargar } = useCuentas()
  // Mientras se recarga tras guardar, se conserva lo anterior para que la pantalla no parpadee.
  const [previas, setPrevias] = useState<Cuenta[] | null>(null)
  if (datos && datos !== previas) setPrevias(datos)
  const cuentas = datos ?? previas
  const [elegida, setElegida] = useState<number | null>(null)
  const [mes, setMes] = useState(mesActual)
  const [nueva, setNueva] = useState(false)
  const [aviso, setAviso] = useState('')
  const detalle = useRef<HTMLDivElement>(null)

  // Por defecto, la primera cuenta con dinero (el primer grupo que se ve).
  const cuenta =
    cuentas?.find((c) => c.id === elegida) ?? cuentas?.find((c) => !esCredito(c)) ?? cuentas?.[0] ?? null
  const movimientos = useMovimientosCuenta(cuenta?.id ?? null, mes)

  useEffect(() => {
    if (!aviso) return
    const timer = setTimeout(() => setAviso(''), 3500)
    return () => clearTimeout(timer)
  }, [aviso])

  function elegir(id: number) {
    setElegida(id)
    // En una pantalla angosta el detalle queda abajo: se lleva a la vista.
    if (window.matchMedia('(max-width: 1023px)').matches) {
      requestAnimationFrame(() => detalle.current?.scrollIntoView({ block: 'start' }))
    }
  }

  function cambio(mensaje: string) {
    setAviso(mensaje)
    recargar()
    movimientos.recargar()
  }

  const grupos = cuentas ? agruparCuentas(cuentas) : null

  const grupo = (titulo: string, lista: Cuenta[]) =>
    lista.length > 0 && (
      <section aria-label={titulo}>
        <h2 className="cuentas__grupo">{titulo}</h2>
        <ul className="cuentas__lista">
          {lista.map((c) => (
            <li key={c.id}>
              <button type="button" className="cuentas__cuenta" aria-pressed={c.id === cuenta?.id} onClick={() => elegir(c.id)}>
                <span className="cuentas__icono" aria-hidden="true">
                  <Icon nombre={ICONO_TIPO[c.tipo]} tamano={20} />
                </span>
                <strong>{c.nombre}</strong>
                <small>
                  {NOMBRES_TIPO_CUENTA[c.tipo]}
                  {c.ultimos_4 ? ` ····${c.ultimos_4}` : ''}
                </small>
                <span className="cuentas__saldo">
                  {esCredito(c) && <small>Debes </small>}
                  {pesos(saldoDe(c))}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    )

  return (
    <main className="balance balance--t20 balance--cuentas">
      <div className="balance__ancho">
        <header className="balance__cabecera">
          <h1>Cuentas</h1>
          <Button variante="secundario" className="cuentas__nueva" disabled={!enLinea} onClick={() => setNueva(true)}>
            <Icon nombre="mas" tamano={18} />
            Agregar cuenta
          </Button>
        </header>

        {copiaDe && <FechaCopia fecha={copiaDe} />}
        {cargando && !cuentas && <p role="status">Cargando tus cuentas…</p>}
        {error && (
          <section className="balance__error" role="alert">
            <h2>No pudimos cargar tus cuentas</h2>
            <p>{error}</p>
            <button type="button" className="balance__reintentar" onClick={recargar}>
              Reintentar
            </button>
          </section>
        )}

        {cuentas && cuentas.length === 0 && (
          <section className="cuentas__vacio">
            <h2>Todavía no tienes cuentas</h2>
            <p>Agrega dónde tienes tu dinero: débito, ahorro o efectivo. Las tarjetas de crédito se agregan en Tarjetas.</p>
            <Button disabled={!enLinea} onClick={() => setNueva(true)}>
              Agregar cuenta
            </Button>
          </section>
        )}

        {cuentas && grupos && cuentas.length > 0 && (
          <div className="cuentas__columnas">
            <div className="cuentas__lado">
              <dl className="cuentas__resumen">
                <div>
                  <dt>
                    <AyudaTermino termino="dineroHoy">Tu dinero hoy</AyudaTermino>
                  </dt>
                  <dd>{pesos(dineroDisponible(cuentas))}</dd>
                </div>
                <div>
                  <dt>Debes en tarjetas</dt>
                  <dd>{pesos(deudaEnTarjetas(cuentas))}</dd>
                  <dd>
                    <Link to="/ranking">Ver deudas</Link>
                  </dd>
                </div>
              </dl>
              {grupo('Tu dinero', grupos.dinero)}
              {grupo('Tarjetas de crédito', grupos.tarjetas)}
            </div>

            <div ref={detalle} className="cuentas__detalle">
              {cuenta && (
                <DetalleCuenta
                  key={cuenta.id}
                  cuenta={cuenta}
                  mes={mes}
                  onMes={setMes}
                  lista={movimientos.datos}
                  cargando={movimientos.cargando}
                  error={movimientos.error}
                  onCambio={cambio}
                  onEliminada={() => {
                    setElegida(null)
                    setAviso('Cuenta eliminada')
                    recargar()
                  }}
                />
              )}
            </div>
          </div>
        )}

        <Modal open={nueva} title="Nueva cuenta" onClose={() => setNueva(false)}>
          {nueva && (
            <FormularioCuenta
              onListo={() => {
                setNueva(false)
                setAviso('Cuenta guardada')
                recargar()
              }}
              onCancelar={() => setNueva(false)}
            />
          )}
        </Modal>
        {aviso && (
          <div className="cuentas__aviso" role="status">
            {aviso}
          </div>
        )}
      </div>
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
    <form onSubmit={enviar} noValidate className="cform">
      {error && <FormAlert tipo="critico">{error}</FormAlert>}
      <div className="cform__opciones" role="group" aria-label="Tipo de cuenta">
        {TIPOS_NUEVA.map((t) => (
          <button key={t} type="button" aria-pressed={tipo === t} onClick={() => setTipo(t)}>
            {NOMBRES_TIPO_CUENTA[t]}
          </button>
        ))}
      </div>
      <TextField etiqueta="Nombre" value={nombre} maxLength={60} onChange={(e) => setNombre(e.target.value)} />
      <TextField etiqueta="Banco (opcional)" value={banco} maxLength={60} onChange={(e) => setBanco(e.target.value)} />
      <TextField
        etiqueta="¿Cuánto tienes hoy?"
        inputMode="decimal"
        value={saldo}
        ayuda="Lo usamos como tu dinero de hoy en Balance."
        onChange={(e) => setSaldo(e.target.value)}
      />
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

export default CuentasPage
