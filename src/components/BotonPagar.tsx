import { useState } from 'react'
import type { FormEvent } from 'react'
import { useCuentas } from '../hooks/useFinanzas'
import { pagar } from '../services/pagos'
import { dineroDisponible, esCredito, saldoDe } from '../utils/cuentas'
import { mensajeError } from '../utils/errores'
import { todayISO } from '../utils/formatDate'
import { pesos } from '../utils/pesos'
import Button from './Button'
import FormAlert from './FormAlert'
import Modal from './Modal'
import SelectField from './SelectField'
import TextField from './TextField'
import './CuentasForm.css'

export interface DestinoPago {
  tipo: 'tarjeta' | 'deuda'
  id: number
  nombre: string
  /** Mínimo de la tarjeta o cuota del préstamo. */
  minimo?: number | null
  /** Solo tarjetas: lo que evita intereses. */
  sinIntereses?: number | null
}

interface BotonPagarProps {
  destino: DestinoPago
  onPagado: () => void
  texto?: string
  variante?: 'primario' | 'secundario'
  deshabilitado?: boolean
}

/** Botón que abre el pago de una tarjeta o un préstamo desde una de tus cuentas. */
function BotonPagar({ destino, onPagado, texto = 'Pagar', variante = 'secundario', deshabilitado }: BotonPagarProps) {
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      <Button variante={variante} disabled={deshabilitado} onClick={() => setAbierto(true)}>
        {texto}
      </Button>
      <Modal open={abierto} title={`Pagar ${destino.nombre}`} onClose={() => setAbierto(false)}>
        {abierto && (
          <FormularioPago
            destino={destino}
            onListo={() => {
              setAbierto(false)
              onPagado()
            }}
            onCancelar={() => setAbierto(false)}
          />
        )}
      </Modal>
    </>
  )
}

function FormularioPago({ destino, onListo, onCancelar }: { destino: DestinoPago; onListo: () => void; onCancelar: () => void }) {
  const { datos: cuentas, cargando } = useCuentas()
  const origenes = cuentas?.filter((c) => c.activa && !esCredito(c)) ?? []
  const atajos = [
    destino.minimo ? { texto: destino.tipo === 'tarjeta' ? 'Mínimo' : 'Mensualidad', monto: destino.minimo } : null,
    destino.sinIntereses ? { texto: 'Para no generar intereses', monto: destino.sinIntereses } : null,
  ].filter((a) => a !== null)
  const [monto, setMonto] = useState(destino.minimo ? String(destino.minimo) : '')
  const [elegida, setElegida] = useState<string | null>(null)
  const [fecha, setFecha] = useState(todayISO())
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  // Por defecto, la cuenta con más dinero.
  const mayor = [...origenes].sort((a, b) => saldoDe(b) - saldoDe(a))[0]
  const origen = origenes.find((c) => String(c.id) === elegida) ?? mayor
  const valor = Number(monto)
  const queda = origen && valor > 0 ? saldoDe(origen) - valor : null

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!(valor > 0)) return setError('El monto debe ser mayor a cero.')
    if (!origen) return setError('Registra una cuenta de débito, ahorro o efectivo para pagar desde ella.')
    setEnviando(true)
    setError(null)
    try {
      await pagar(destino.tipo, destino.id, { monto: valor, fecha, desde_cuenta_id: origen.id })
      onListo()
    } catch (err) {
      setError(mensajeError(err))
      setEnviando(false)
    }
  }

  if (cargando && !cuentas) return <p role="status">Cargando tus cuentas…</p>

  return (
    <form className="cform" onSubmit={enviar} noValidate>
      {error && <FormAlert tipo="critico">{error}</FormAlert>}
      {atajos.length > 0 && (
        <div className="cform__opciones" role="group" aria-label="Cuánto pagar">
          {atajos.map((a) => (
            <button key={a.texto} type="button" aria-pressed={valor === a.monto} onClick={() => setMonto(String(a.monto))}>
              {a.texto}
              <strong>{pesos(a.monto)}</strong>
            </button>
          ))}
        </div>
      )}
      <TextField etiqueta="Monto" inputMode="decimal" value={monto} onChange={(e) => setMonto(e.target.value)} />
      <SelectField
        etiqueta="¿De qué cuenta sale?"
        value={origen ? String(origen.id) : ''}
        onChange={(e) => setElegida(e.target.value)}
        opciones={origenes.map((c) => ({ valor: String(c.id), texto: `${c.nombre} · ${pesos(saldoDe(c))}` }))}
      />
      <TextField etiqueta="Fecha del pago" type="date" max={todayISO()} value={fecha} onChange={(e) => setFecha(e.target.value)} />
      <p className="cform__nota" role="status">
        {queda === null
          ? `Tienes ${pesos(dineroDisponible(cuentas ?? []))} en tus cuentas.`
          : queda < 0
            ? `${origen?.nombre} quedaría en negativo (${pesos(queda)}). Revisa que su saldo esté al día.`
            : `${origen?.nombre} quedará en ${pesos(queda)}. No cuenta como gasto: es tu dinero pagando lo que debes.`}
      </p>
      <div className="cform__acciones">
        <Button type="button" variante="secundario" onClick={onCancelar} disabled={enviando}>
          Cancelar
        </Button>
        <Button type="submit" cargando={enviando}>
          Registrar pago
        </Button>
      </div>
    </form>
  )
}

export default BotonPagar
