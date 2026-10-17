import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import Button from '../components/Button'
import EncabezadoPagina from '../components/EncabezadoPagina'
import EstadoCarga from '../components/EstadoCarga'
import FormAlert from '../components/FormAlert'
import TextField from '../components/TextField'
import { useTarjeta } from '../hooks/useFinanzas'
import { finanzasService } from '../services/finanzas'
import type { PlanMsi, PlanMsiPayload, Tarjeta } from '../types/finanzas'
import { mensajeError } from '../utils/errores'
import { calcularMensualidad, hoyIso, redondear2 } from '../utils/finanzas'
import { formatMoney } from '../utils/formatMoney'
import {
  hayErrores,
  leerNumero,
  numeroONulo,
  validarEntero,
  validarFecha,
  validarMonto,
  validarTexto,
} from '../utils/validacionFinanzas'
import '../components/Button.css'
import './Finanzas.css'

type Campos = {
  descripcion: string
  monto_original: string
  num_mensualidades: string
  mensualidades_pagadas: string
  fecha_compra: string
}

type Errores = Partial<Record<keyof Campos, string | null>>

function camposIniciales(plan: PlanMsi | null): Campos {
  return {
    descripcion: plan?.descripcion ?? '',
    monto_original: plan ? String(plan.monto_original) : '',
    num_mensualidades: plan ? String(plan.num_mensualidades) : '',
    mensualidades_pagadas: plan ? String(plan.mensualidades_pagadas) : '0',
    fecha_compra: plan?.fecha_compra ?? hoyIso(),
  }
}

function validar(c: Campos): Errores {
  const meses = leerNumero(c.num_mensualidades)
  const errorMeses = validarEntero(c.num_mensualidades, 2, 60)
  const errorPagadas =
    validarEntero(c.mensualidades_pagadas, 0, 60) ??
    (!errorMeses && meses !== null && Number(leerNumero(c.mensualidades_pagadas)) > meses
      ? 'No pueden ser más que el número de mensualidades'
      : null)
  return {
    descripcion: validarTexto(c.descripcion, 120, 'Escribe qué compraste'),
    monto_original: validarMonto(c.monto_original),
    num_mensualidades: errorMeses,
    mensualidades_pagadas: errorPagadas,
    fecha_compra: validarFecha(c.fecha_compra, hoyIso()),
  }
}

/** Mensualidad y saldo pendiente, si los datos ya son válidos. */
function calcular(c: Campos) {
  const monto = numeroONulo(c.monto_original)
  const meses = numeroONulo(c.num_mensualidades)
  const pagadas = numeroONulo(c.mensualidades_pagadas) ?? 0
  if (!monto || !meses || meses < 2 || !Number.isInteger(meses) || pagadas > meses) return null
  const mensualidad = calcularMensualidad(monto, meses)
  const restantes = meses - pagadas
  return { mensualidad, restantes, pendiente: redondear2(mensualidad * restantes) }
}

function FormularioMsi({ tarjeta, plan }: { tarjeta: Tarjeta; plan: PlanMsi | null }) {
  const navegar = useNavigate()
  const [campos, setCampos] = useState<Campos>(() => camposIniciales(plan))
  const [errores, setErrores] = useState<Errores>({})
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const cambiar = (campo: keyof Campos) => (e: { target: { value: string } }) =>
    setCampos((c) => ({ ...c, [campo]: e.target.value }))

  const calculo = calcular(campos)
  const volverA = `/tarjetas/${tarjeta.id}`

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const nuevos = validar(campos)
    setErrores(nuevos)
    setErrorGeneral(null)
    if (hayErrores(nuevos) || !calculo) return

    const datos: PlanMsiPayload = {
      descripcion: campos.descripcion.trim(),
      monto_original: numeroONulo(campos.monto_original) ?? 0,
      num_mensualidades: numeroONulo(campos.num_mensualidades) ?? 0,
      mensualidades_pagadas: numeroONulo(campos.mensualidades_pagadas) ?? 0,
      monto_mensualidad: calculo.mensualidad,
      fecha_compra: campos.fecha_compra,
    }

    setEnviando(true)
    try {
      if (plan) await finanzasService.actualizarPlanMsi(plan.id, datos)
      else await finanzasService.crearPlanMsi(tarjeta.id, datos)
      navegar(volverA, {
        replace: true,
        state: { aviso: plan ? 'Se guardaron los cambios de la compra.' : `Compra "${datos.descripcion}" agregada.` },
      })
    } catch (err) {
      setErrorGeneral(mensajeError(err))
      setEnviando(false)
    }
  }

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo={plan ? 'Editar compra a MSI' : 'Agregar compra a MSI'}
        subtitulo={`Con la tarjeta ${tarjeta.nombre}`}
        regresar={{ a: volverA, texto: tarjeta.nombre }}
      />

      {errorGeneral && <FormAlert tipo="critico">{errorGeneral}</FormAlert>}

      <form className="ficha formulario" onSubmit={enviar} noValidate>
        <TextField
          etiqueta="¿Qué compraste?"
          placeholder="Ej. Laptop"
          value={campos.descripcion}
          maxLength={120}
          onChange={cambiar('descripcion')}
          error={errores.descripcion}
        />
        <div className="formulario__fila">
          <TextField
            etiqueta="Precio total"
            inputMode="decimal"
            placeholder="$0.00"
            value={campos.monto_original}
            onChange={cambiar('monto_original')}
            error={errores.monto_original}
          />
          <TextField
            etiqueta="Fecha de compra"
            type="date"
            max={hoyIso()}
            value={campos.fecha_compra}
            onChange={cambiar('fecha_compra')}
            error={errores.fecha_compra}
          />
        </div>
        <div className="formulario__fila">
          <TextField
            etiqueta="Número de meses"
            inputMode="numeric"
            placeholder="Ej. 12"
            value={campos.num_mensualidades}
            maxLength={2}
            onChange={cambiar('num_mensualidades')}
            error={errores.num_mensualidades}
          />
          <TextField
            etiqueta="Mensualidades ya pagadas"
            inputMode="numeric"
            value={campos.mensualidades_pagadas}
            maxLength={2}
            onChange={cambiar('mensualidades_pagadas')}
            error={errores.mensualidades_pagadas}
          />
        </div>
        <p className="pagina__nota">
          Las mensualidades pagadas son las que ya aparecieron en tus estados de cuenta. Si apenas la compraste, deja 0.
        </p>

        <div className="calculo" aria-live="polite">
          {calculo ? (
            <p>
              Pagarás <strong>{formatMoney(calculo.mensualidad)} al mes</strong>. Te{' '}
              {calculo.restantes === 1 ? 'falta' : 'faltan'} {calculo.restantes}{' '}
              {calculo.restantes === 1 ? 'mensualidad' : 'mensualidades'}: {formatMoney(calculo.pendiente)}.
            </p>
          ) : (
            <p className="pagina__nota">Escribe el precio y el número de meses para ver la mensualidad.</p>
          )}
        </div>

        <div className="formulario__acciones">
          <Link to={volverA} className="boton boton--secundario">
            Cancelar
          </Link>
          <Button type="submit" cargando={enviando}>
            Guardar compra
          </Button>
        </div>
      </form>
    </div>
  )
}

/** Alta y edición de una compra a MSI ligada a una tarjeta (REQ-TD-02, REQ-TD-09). */
function PlanMsiFormPage() {
  const params = useParams()
  const { datos: tarjeta, error, cargando } = useTarjeta(Number(params.id))

  if (cargando || !tarjeta) return <EstadoCarga error={error} />

  const plan = params.msiId ? (tarjeta.planes_msi.find((p) => p.id === Number(params.msiId)) ?? null) : null
  if (params.msiId && !plan) {
    return <EstadoCarga error="No encontramos esa compra a MSI." regresar={{ a: `/tarjetas/${tarjeta.id}`, texto: tarjeta.nombre }} />
  }

  return <FormularioMsi key={plan?.id ?? 'nueva'} tarjeta={tarjeta} plan={plan} />
}

export default PlanMsiFormPage