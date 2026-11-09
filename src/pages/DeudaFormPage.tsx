import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import Button from '../components/Button'
import EncabezadoPagina from '../components/EncabezadoPagina'
import EstadoCarga from '../components/EstadoCarga'
import FormAlert from '../components/FormAlert'
import SelectField from '../components/SelectField'
import TextField from '../components/TextField'
import { useDeuda } from '../hooks/useFinanzas'
import { finanzasService } from '../services/finanzas'
import type { Deuda, DeudaPayload, TipoDeuda } from '../types/finanzas'
import { mensajeError } from '../utils/errores'
import { TIPO_DEUDA_TEXTO } from '../utils/finanzas'
import {
  hayErrores,
  numeroONulo,
  validarDia,
  validarEntero,
  validarMonto,
  validarTasa,
  validarTexto,
} from '../utils/validacionFinanzas'
import '../components/Button.css'
import './Finanzas.css'

type Campos = {
  nombre: string
  tipo: TipoDeuda
  acreedor: string
  monto_original: string
  saldo_actual: string
  pago_mensual: string
  tasa_anual: string
  dia_pago: string
  pagos_restantes: string
}

type Errores = Partial<Record<keyof Campos, string | null>>

const OPCIONES_TIPO = (Object.keys(TIPO_DEUDA_TEXTO) as TipoDeuda[]).map((valor) => ({
  valor,
  texto: TIPO_DEUDA_TEXTO[valor],
}))

const texto = (n: number | null | undefined) => (n === null || n === undefined ? '' : String(n))

function camposIniciales(d: Deuda | null): Campos {
  return {
    nombre: d?.nombre ?? '',
    tipo: d?.tipo ?? 'prestamo_personal',
    acreedor: d?.acreedor ?? '',
    monto_original: texto(d?.monto_original),
    saldo_actual: texto(d?.saldo_actual),
    pago_mensual: texto(d?.pago_mensual),
    tasa_anual: texto(d?.tasa_anual),
    dia_pago: texto(d?.dia_pago),
    pagos_restantes: texto(d?.pagos_restantes),
  }
}

function validar(c: Campos): Errores {
  return {
    nombre: validarTexto(c.nombre, 100, 'Escribe un nombre para reconocer la deuda'),
    acreedor: validarTexto(c.acreedor, 100, null),
    monto_original: validarMonto(c.monto_original),
    saldo_actual: validarMonto(c.saldo_actual, { permitirCero: true }),
    pago_mensual: validarMonto(c.pago_mensual),
    tasa_anual: validarTasa(c.tasa_anual),
    dia_pago: validarDia(c.dia_pago, false),
    pagos_restantes: validarEntero(c.pagos_restantes, 0, 600, false),
  }
}

function aPayload(c: Campos, original: Deuda | null): DeudaPayload {
  return {
    nombre: c.nombre.trim(),
    tipo: c.tipo,
    acreedor: c.acreedor.trim() || null,
    monto_original: numeroONulo(c.monto_original) ?? 0,
    saldo_actual: numeroONulo(c.saldo_actual) ?? 0,
    pago_mensual: numeroONulo(c.pago_mensual),
    tasa_anual: numeroONulo(c.tasa_anual),
    dia_pago: numeroONulo(c.dia_pago),
    pagos_restantes: numeroONulo(c.pagos_restantes),
    fecha_inicio: original?.fecha_inicio ?? null,
  }
}

function FormularioDeuda({ deuda }: { deuda: Deuda | null }) {
  const navegar = useNavigate()
  const [campos, setCampos] = useState<Campos>(() => camposIniciales(deuda))
  const [errores, setErrores] = useState<Errores>({})
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const cambiar = (campo: keyof Campos) => (e: { target: { value: string } }) =>
    setCampos((c) => ({ ...c, [campo]: e.target.value }))

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const nuevos = validar(campos)
    setErrores(nuevos)
    setErrorGeneral(null)
    if (hayErrores(nuevos)) return

    setEnviando(true)
    try {
      const datos = aPayload(campos, deuda)
      if (deuda) await finanzasService.actualizarDeuda(deuda.id, datos)
      else await finanzasService.crearDeuda(datos)
      navegar('/tarjetas', {
        replace: true,
        state: { aviso: deuda ? 'Se guardaron los cambios de la deuda.' : `Deuda "${datos.nombre}" agregada.` },
      })
    } catch (err) {
      setErrorGeneral(mensajeError(err))
      setEnviando(false)
    }
  }

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo={deuda ? 'Editar deuda' : 'Agregar otra deuda'}
        subtitulo="Préstamos personales, créditos de tienda, de auto o dinero que le debes a alguien."
        regresar={{ a: '/tarjetas', texto: 'Tarjetas y deudas' }}
      />

      {errorGeneral && <FormAlert tipo="critico">{errorGeneral}</FormAlert>}

      <form className="ficha formulario" onSubmit={enviar} noValidate>
        <TextField
          etiqueta="Nombre de la deuda"
          placeholder="Ej. Préstamo de nómina"
          value={campos.nombre}
          maxLength={100}
          onChange={cambiar('nombre')}
          error={errores.nombre}
        />
        <div className="formulario__fila">
          <SelectField
            etiqueta="Tipo"
            opciones={OPCIONES_TIPO}
            value={campos.tipo}
            onChange={cambiar('tipo')}
          />
          <TextField
            etiqueta="¿A quién le debes? (opcional)"
            placeholder="Ej. Banco Azteca"
            value={campos.acreedor}
            maxLength={100}
            onChange={cambiar('acreedor')}
            error={errores.acreedor}
          />
        </div>
        <div className="formulario__fila">
          <TextField
            etiqueta="Monto que te prestaron"
            inputMode="decimal"
            placeholder="$0.00"
            value={campos.monto_original}
            onChange={cambiar('monto_original')}
            error={errores.monto_original}
          />
          <TextField
            etiqueta="Saldo pendiente"
            inputMode="decimal"
            placeholder="$0.00"
            value={campos.saldo_actual}
            onChange={cambiar('saldo_actual')}
            error={errores.saldo_actual}
          />
        </div>
        <div className="formulario__fila">
          <TextField
            etiqueta="Pago mensual"
            inputMode="decimal"
            placeholder="$0.00"
            value={campos.pago_mensual}
            onChange={cambiar('pago_mensual')}
            error={errores.pago_mensual}
          />
          <TextField
            etiqueta="Tasa anual % (opcional)"
            inputMode="decimal"
            placeholder="Ej. 35"
            value={campos.tasa_anual}
            onChange={cambiar('tasa_anual')}
            error={errores.tasa_anual}
          />
        </div>
        <div className="formulario__fila">
          <TextField
            etiqueta="Día de pago (opcional)"
            inputMode="numeric"
            placeholder="1 a 31"
            value={campos.dia_pago}
            maxLength={2}
            onChange={cambiar('dia_pago')}
            error={errores.dia_pago}
          />
          <TextField
            etiqueta="Pagos restantes (opcional)"
            inputMode="numeric"
            placeholder="Ej. 18"
            value={campos.pagos_restantes}
            maxLength={3}
            onChange={cambiar('pagos_restantes')}
            error={errores.pagos_restantes}
          />
        </div>
        <p className="pagina__nota">Si es un préstamo de un familiar o amigo sin intereses, escribe 0 en la tasa.</p>

        <div className="formulario__acciones">
          <Link to="/tarjetas" className="boton boton--secundario">
            Cancelar
          </Link>
          <Button type="submit" cargando={enviando}>
            Guardar deuda
          </Button>
        </div>
      </form>
    </div>
  )
}

/** Alta y edición de préstamos y otras deudas (REQ-TD-08, REQ-TD-09). */
function DeudaFormPage() {
  const { id } = useParams()
  const deudaId = id === undefined ? null : Number(id)
  const { datos: deuda, error, cargando } = useDeuda(deudaId)

  if (deudaId !== null && (cargando || !deuda)) return <EstadoCarga error={error} />
  return <FormularioDeuda key={deuda?.id ?? 'nueva'} deuda={deuda} />
}

export default DeudaFormPage