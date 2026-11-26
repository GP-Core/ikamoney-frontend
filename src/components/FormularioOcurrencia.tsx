import { useState } from 'react'
import type { FormEvent } from 'react'
import { useCuentas } from '../hooks/useFinanzas'
import { movimientosService } from '../services/movimientos'
import type { MovimientoDelMes } from '../types/movimiento'
import { esCredito, saldoDe, saldoDespues } from '../utils/cuentas'
import { mensajeError } from '../utils/errores'
import { todayISO } from '../utils/formatDate'
import { pesos } from '../utils/pesos'
import Button from './Button'
import FormAlert from './FormAlert'
import SelectField from './SelectField'
import TextField from './TextField'
import './CuentasForm.css'

interface Props {
  movimiento: MovimientoDelMes
  onListo: () => void
  onCancelar: () => void
}

/** "Ya lo pagué" / "Ya me cayó": de qué cuenta fue, cuánto y cuándo. */
function FormularioOcurrencia({ movimiento, onListo, onCancelar }: Props) {
  const esGasto = movimiento.tipo === 'gasto'
  const { datos: cuentas, cargando } = useCuentas()
  const opciones = cuentas?.filter((c) => c.activa && !esCredito(c)) ?? []
  const [elegida, setElegida] = useState<string | null>(null)
  const [monto, setMonto] = useState(String(movimiento.monto))
  const hoy = todayISO()
  const [fecha, setFecha] = useState(movimiento.fecha_ocurrencia < hoy ? movimiento.fecha_ocurrencia : hoy)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const cuenta = opciones.find((c) => String(c.id) === (elegida ?? String(movimiento.cuenta_id))) ?? opciones[0]
  const valor = Number(monto)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!(valor > 0)) return setError('El monto debe ser mayor a cero.')
    if (!cuenta) return setError('Primero registra una cuenta de débito, ahorro o efectivo.')
    setEnviando(true)
    setError(null)
    try {
      await movimientosService.registrarOcurrencia(movimiento.id, {
        ocurrencia: movimiento.fecha_ocurrencia,
        cuenta_id: cuenta.id,
        monto: Math.round(valor * 100) / 100,
        fecha,
      })
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
      <TextField etiqueta="Monto" inputMode="decimal" value={monto} onChange={(e) => setMonto(e.target.value)} />
      <SelectField
        etiqueta={esGasto ? '¿Con qué cuenta lo pagaste?' : '¿En qué cuenta cayó?'}
        value={cuenta ? String(cuenta.id) : ''}
        onChange={(e) => setElegida(e.target.value)}
        opciones={opciones.map((c) => ({ valor: String(c.id), texto: `${c.nombre} · ${pesos(saldoDe(c))}` }))}
      />
      <TextField etiqueta="Fecha" type="date" max={hoy} value={fecha} onChange={(e) => setFecha(e.target.value)} />
      <p className="cform__nota" role="status">
        {cuenta && valor > 0
          ? `${cuenta.nombre} quedará en ${pesos(saldoDespues(cuenta, esGasto ? 'cargo' : 'abono', valor))}. `
          : ''}
        No se cuenta dos veces: ya estaba en tu Balance.
      </p>
      <div className="cform__acciones">
        <Button type="button" variante="secundario" onClick={onCancelar} disabled={enviando}>
          Cancelar
        </Button>
        <Button type="submit" cargando={enviando}>
          {esGasto ? 'Ya lo pagué' : 'Ya me cayó'}
        </Button>
      </div>
    </form>
  )
}

export default FormularioOcurrencia
