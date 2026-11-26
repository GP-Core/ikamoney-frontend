import { useState } from 'react'
import type { FormEvent } from 'react'
import { useCategorias } from '../hooks/useFinanzas'
import type { Cuenta, MovimientoCuenta, MovimientoCuentaPayload, TipoMovimientoCuenta } from '../types/cuenta'
import { esCredito, saldoDespues } from '../utils/cuentas'
import { mensajeError } from '../utils/errores'
import { todayISO } from '../utils/formatDate'
import { pesos } from '../utils/pesos'
import Button from './Button'
import FormAlert from './FormAlert'
import SelectField from './SelectField'
import TextField from './TextField'
import './CuentasForm.css'

interface Props {
  cuenta: Cuenta
  /** Si viene, el formulario es de edición. */
  inicial?: MovimientoCuenta
  onGuardar: (datos: MovimientoCuentaPayload) => Promise<void>
  onCancelar: () => void
}

const OPCIONES_DINERO: { valor: TipoMovimientoCuenta; texto: string }[] = [
  { valor: 'cargo', texto: 'Gasto' },
  { valor: 'abono', texto: 'Ingreso' },
]
// Los pagos a una tarjeta van con "Pagar", que los descuenta de una cuenta.
const OPCIONES_CREDITO: { valor: TipoMovimientoCuenta; texto: string }[] = [
  { valor: 'cargo', texto: 'Compra' },
  { valor: 'interes', texto: 'Intereses' },
  { valor: 'comision', texto: 'Comisión' },
]

/** Alta y edición de un movimiento de una cuenta, diciendo qué pasará al guardarlo. */
function FormularioMovimientoCuenta({ cuenta, inicial, onGuardar, onCancelar }: Props) {
  const credito = esCredito(cuenta)
  const opciones = credito ? OPCIONES_CREDITO : OPCIONES_DINERO
  const [tipo, setTipo] = useState<TipoMovimientoCuenta>(inicial?.tipo ?? 'cargo')
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? '')
  const [monto, setMonto] = useState(inicial ? String(inicial.monto) : '')
  const [fecha, setFecha] = useState(inicial?.fecha ?? todayISO())
  const [categoria, setCategoria] = useState(inicial?.categoria_id ? String(inicial.categoria_id) : '')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const { datos: categorias } = useCategorias()
  const pideCategoria = !credito && tipo === 'cargo'
  const valor = Number(monto)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!descripcion.trim()) return setError('Describe el movimiento.')
    if (!(valor > 0)) return setError('El monto debe ser mayor a cero.')
    if (pideCategoria && !categoria) return setError('Elige una categoría para el gasto.')
    setEnviando(true)
    setError(null)
    try {
      await onGuardar({
        fecha,
        descripcion: descripcion.trim(),
        monto: Math.round(valor * 100) / 100,
        tipo,
        ...(categoria && tipo === 'cargo' && { categoria_id: Number(categoria) }),
      })
    } catch (err) {
      setError(mensajeError(err))
      setEnviando(false)
    }
  }

  // Al editar, el saldo mostrado ya incluye el movimiento anterior: primero se le quita.
  const base = inicial
    ? credito
      ? { ...cuenta, saldo_actual: saldoDespues(cuenta, inicial.tipo, -inicial.monto) }
      : { ...cuenta, saldo_disponible: saldoDespues(cuenta, inicial.tipo, -inicial.monto) }
    : cuenta
  const queda = valor > 0 ? pesos(saldoDespues(base, tipo, valor)) : null
  const nota = credito
    ? `Sube lo que debes${queda ? `: quedará en ${queda}` : ''}. No cuenta como gasto del mes.`
    : `${queda ? `El saldo quedará en ${queda}` : 'Cambiará el saldo'} y contará en tu Balance.`

  return (
    <form className="cform" onSubmit={enviar} noValidate>
      {error && <FormAlert tipo="critico">{error}</FormAlert>}
      <div className="cform__opciones" role="group" aria-label="Qué fue">
        {opciones.map((o) => (
          <button key={o.valor} type="button" aria-pressed={tipo === o.valor} onClick={() => setTipo(o.valor)}>
            {o.texto}
          </button>
        ))}
      </div>
      <TextField etiqueta="Descripción" value={descripcion} maxLength={120} onChange={(e) => setDescripcion(e.target.value)} />
      <TextField etiqueta="Monto" inputMode="decimal" value={monto} onChange={(e) => setMonto(e.target.value)} />
      {pideCategoria && (
        <SelectField
          etiqueta="Categoría"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          opciones={[
            { valor: '', texto: categorias ? 'Elige una categoría' : 'Cargando categorías…' },
            ...(categorias ?? []).map((c) => ({ valor: String(c.id), texto: c.nombre })),
          ]}
        />
      )}
      <TextField etiqueta="Fecha" type="date" value={fecha} max={todayISO()} onChange={(e) => setFecha(e.target.value)} />
      <p className="cform__nota" role="status">
        {nota}
      </p>
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

export default FormularioMovimientoCuenta
