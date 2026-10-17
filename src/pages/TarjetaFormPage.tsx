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
import type { Tarjeta, TarjetaPayload } from '../types/finanzas'
import { mensajeError } from '../utils/errores'
import {
  hayErrores,
  numeroONulo,
  validarDia,
  validarMonto,
  validarTasa,
  validarTexto,
  validarUltimos4,
} from '../utils/validacionFinanzas'
import '../components/Button.css'
import './Finanzas.css'

type Campos = {
  nombre: string
  banco: string
  ultimos_4: string
  limite_credito: string
  saldo_actual: string
  dia_corte: string
  dia_pago: string
  tasa_anual: string
  pago_minimo: string
}

type Errores = Partial<Record<keyof Campos, string | null>>

const texto = (n: number | null) => (n === null ? '' : String(n))

function camposIniciales(t: Tarjeta | null): Campos {
  return {
    nombre: t?.nombre ?? '',
    banco: t?.banco ?? '',
    ultimos_4: t?.ultimos_4 ?? '',
    limite_credito: texto(t?.limite_credito ?? null),
    saldo_actual: texto(t?.saldo_actual ?? null),
    dia_corte: texto(t?.dia_corte ?? null),
    dia_pago: texto(t?.dia_pago ?? null),
    tasa_anual: texto(t?.tasa_anual ?? null),
    pago_minimo: texto(t?.pago_minimo ?? null),
  }
}

function validar(c: Campos): Errores {
  return {
    nombre: validarTexto(c.nombre, 60, 'Escribe un nombre para reconocer la tarjeta'),
    banco: validarTexto(c.banco, 60, 'Escribe el banco'),
    ultimos_4: validarUltimos4(c.ultimos_4),
    limite_credito: validarMonto(c.limite_credito),
    saldo_actual: validarMonto(c.saldo_actual, { permitirCero: true }),
    dia_corte: validarDia(c.dia_corte),
    dia_pago: validarDia(c.dia_pago),
    tasa_anual: validarTasa(c.tasa_anual),
    pago_minimo: validarMonto(c.pago_minimo, { obligatorio: false, permitirCero: true }),
  }
}

function aPayload(c: Campos): TarjetaPayload {
  return {
    nombre: c.nombre.trim(),
    banco: c.banco.trim(),
    ultimos_4: c.ultimos_4.trim() || null,
    limite_credito: numeroONulo(c.limite_credito) ?? 0,
    saldo_actual: numeroONulo(c.saldo_actual) ?? 0,
    dia_corte: numeroONulo(c.dia_corte) ?? 1,
    dia_pago: numeroONulo(c.dia_pago) ?? 1,
    tasa_anual: numeroONulo(c.tasa_anual),
    pago_minimo: numeroONulo(c.pago_minimo),
  }
}

function FormularioTarjeta({ tarjeta }: { tarjeta: Tarjeta | null }) {
  const navegar = useNavigate()
  const [campos, setCampos] = useState<Campos>(() => camposIniciales(tarjeta))
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
      const datos = aPayload(campos)
      const guardada = tarjeta
        ? await finanzasService.actualizarTarjeta(tarjeta.id, datos)
        : await finanzasService.crearTarjeta(datos)
      navegar(`/tarjetas/${guardada.id}`, {
        replace: true,
        state: { aviso: tarjeta ? 'Se guardaron los cambios.' : 'Tarjeta agregada. Ahora puedes registrar sus compras a MSI.' },
      })
    } catch (err) {
      setErrorGeneral(mensajeError(err))
      setEnviando(false)
    }
  }

  const regresarA = tarjeta ? `/tarjetas/${tarjeta.id}` : '/tarjetas'

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo={tarjeta ? 'Editar tarjeta' : 'Agregar tarjeta'}
        subtitulo="Copia los datos de tu estado de cuenta o de la app de tu banco."
        regresar={{ a: regresarA, texto: tarjeta ? tarjeta.nombre : 'Tarjetas y deudas' }}
      />

      {errorGeneral && <FormAlert tipo="critico">{errorGeneral}</FormAlert>}

      <form className="ficha formulario" onSubmit={enviar} noValidate>
        <TextField
          etiqueta="Nombre de la tarjeta"
          placeholder="Ej. BBVA Azul"
          value={campos.nombre}
          maxLength={60}
          onChange={cambiar('nombre')}
          error={errores.nombre}
        />
        <div className="formulario__fila">
          <TextField
            etiqueta="Banco"
            placeholder="Ej. BBVA"
            value={campos.banco}
            maxLength={60}
            onChange={cambiar('banco')}
            error={errores.banco}
          />
          <TextField
            etiqueta="Últimos 4 dígitos (opcional)"
            inputMode="numeric"
            placeholder="1234"
            value={campos.ultimos_4}
            maxLength={4}
            onChange={cambiar('ultimos_4')}
            error={errores.ultimos_4}
          />
        </div>
        <p className="pagina__nota">Nunca te pediremos el número completo de tu tarjeta, el CVV ni tus claves del banco.</p>

        <div className="formulario__fila">
          <TextField
            etiqueta="Límite de crédito"
            inputMode="decimal"
            placeholder="$0.00"
            value={campos.limite_credito}
            onChange={cambiar('limite_credito')}
            error={errores.limite_credito}
          />
          <TextField
            etiqueta="Saldo actual"
            inputMode="decimal"
            placeholder="$0.00"
            value={campos.saldo_actual}
            onChange={cambiar('saldo_actual')}
            error={errores.saldo_actual}
          />
        </div>
        <p className="pagina__nota">
          En el saldo no incluyas lo que te falta pagar de tus compras a meses sin intereses: esas se registran aparte y
          nosotros las sumamos.
        </p>

        <div className="formulario__fila">
          <TextField
            etiqueta="Día de corte"
            inputMode="numeric"
            placeholder="1 a 31"
            value={campos.dia_corte}
            maxLength={2}
            onChange={cambiar('dia_corte')}
            error={errores.dia_corte}
          />
          <TextField
            etiqueta="Día límite de pago"
            inputMode="numeric"
            placeholder="1 a 31"
            value={campos.dia_pago}
            maxLength={2}
            onChange={cambiar('dia_pago')}
            error={errores.dia_pago}
          />
        </div>

        <div className="formulario__fila">
          <TextField
            etiqueta="Tasa anual % (opcional)"
            inputMode="decimal"
            placeholder="Ej. 45.5"
            value={campos.tasa_anual}
            onChange={cambiar('tasa_anual')}
            error={errores.tasa_anual}
          />
          <TextField
            etiqueta="Pago mínimo (opcional)"
            inputMode="decimal"
            placeholder="$0.00"
            value={campos.pago_minimo}
            onChange={cambiar('pago_minimo')}
            error={errores.pago_minimo}
          />
        </div>
        <p className="pagina__nota">
          La tasa aparece en tu estado de cuenta como "tasa de interés ordinaria anual"; sin ella no podemos estimar tus
          intereses. Si dejas vacío el pago mínimo, lo estimamos con la regla de Banxico.
        </p>

        <div className="formulario__acciones">
          <Link to={regresarA} className="boton boton--secundario">
            Cancelar
          </Link>
          <Button type="submit" cargando={enviando}>
            Guardar tarjeta
          </Button>
        </div>
      </form>
    </div>
  )
}

/** Alta y edición de una tarjeta de crédito (REQ-TD-01, REQ-TD-09). */
function TarjetaFormPage() {
  const { id } = useParams()
  const tarjetaId = id === undefined ? null : Number(id)
  const { datos: tarjeta, error, cargando } = useTarjeta(tarjetaId)

  if (tarjetaId !== null && (cargando || !tarjeta)) return <EstadoCarga error={error} />
  return <FormularioTarjeta key={tarjeta?.id ?? 'nueva'} tarjeta={tarjeta} />
}

export default TarjetaFormPage