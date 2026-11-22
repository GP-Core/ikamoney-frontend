import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type {
  Categoria,
  ClaseGasto,
  ErroresMovimiento,
  Frecuencia,
  Movimiento,
  MovimientoPayload,
  TipoMovimiento,
  ValoresMovimiento,
} from '../types/movimiento'
import { mensajeError } from '../utils/errores'
import { todayISO } from '../utils/formatDate'
import { leerMonto, validarMovimiento } from '../utils/validarMovimiento'
import './MovimientoFormulario.css'

interface MovimientoFormularioProps {
  tipo: TipoMovimiento
  /** Si viene un movimiento, el formulario es de edición. */
  inicial?: Movimiento
  /** Categorías para clasificar el gasto; null si todavía no cargan. */
  categorias: Categoria[] | null
  /** Guarda el movimiento. Si lanza un error, el formulario lo muestra y se queda abierto. */
  onGuardar: (datos: MovimientoPayload) => Promise<void>
  /** Crea una categoría propia y devuelve la creada (la página recarga la lista). */
  onCrearCategoria: (nombre: string) => Promise<Categoria>
  onCancelar: () => void
}

type Campo = keyof ValoresMovimiento

/** Valor de la opción del selector que abre el alta de una categoría propia. */
const NUEVA = '__nueva__'

const FRECUENCIAS_INGRESO: { valor: Frecuencia; texto: string }[] = [
  { valor: 'unico', texto: 'Una sola vez' },
  { valor: 'semanal', texto: 'Cada semana' },
  { valor: 'quincenal', texto: 'Cada quincena' },
  { valor: 'mensual', texto: 'Cada mes' },
  { valor: 'anual', texto: 'Cada año' },
]

/** Un gasto fijo siempre se repite; uno variable es siempre único (regla del backend). */
const FRECUENCIAS_GASTO_FIJO = FRECUENCIAS_INGRESO.filter((f) => f.valor !== 'unico')

/** Formulario de alta y edición de ingreso o gasto, con validaciones. */
function MovimientoFormulario({ tipo, inicial, categorias, onGuardar, onCrearCategoria, onCancelar }: MovimientoFormularioProps) {
  const esGasto = tipo === 'gasto'
  const formRef = useRef<HTMLFormElement>(null)
  const [valores, setValores] = useState<ValoresMovimiento>({
    concepto: inicial?.concepto ?? '',
    monto: inicial ? String(inicial.monto) : '',
    fecha: inicial?.fecha ?? todayISO(),
    categoria_id: inicial?.categoria_id ? String(inicial.categoria_id) : '',
    clase: inicial?.clase ?? '',
    frecuencia: inicial?.frecuencia ?? 'unico',
  })
  const [errores, setErrores] = useState<ErroresMovimiento>({})
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  // Alta de categoría propia: null = cerrado; si no, el nombre que se va escribiendo.
  const [nuevaCategoria, setNuevaCategoria] = useState<string | null>(null)
  const [errorCategoria, setErrorCategoria] = useState<string | null>(null)
  const [creandoCategoria, setCreandoCategoria] = useState(false)

  // Revisa un solo campo (al salir de él o mientras se corrige).
  function revisarCampo(nombre: Campo, siguiente: ValoresMovimiento = valores) {
    const mensaje = validarMovimiento(siguiente, tipo)[nombre]
    setErrores((previos) => ({ ...previos, [nombre]: mensaje }))
  }

  function cambiar(nombre: Campo, valor: string) {
    const siguiente = { ...valores, [nombre]: valor } as ValoresMovimiento
    // La clase decide cuánto se repite: variable = una vez; fijo = cada mes mientras no se elija otra cosa.
    if (nombre === 'clase') {
      siguiente.frecuencia = valor === 'variable' ? 'unico' : valores.frecuencia === 'unico' ? 'mensual' : valores.frecuencia
    }
    setValores(siguiente)
    if (errores[nombre]) revisarCampo(nombre, siguiente)
    if (nombre === 'frecuencia' && errores.fecha) revisarCampo('fecha', siguiente)
  }

  async function agregarCategoria() {
    const nombre = (nuevaCategoria ?? '').trim()
    if (nombre.length < 1 || nombre.length > 60) {
      setErrorCategoria('Escribe un nombre de 1 a 60 caracteres.')
      return
    }
    setCreandoCategoria(true)
    setErrorCategoria(null)
    try {
      const creada = await onCrearCategoria(nombre)
      setValores((previos) => ({ ...previos, categoria_id: String(creada.id) }))
      setErrores((previos) => ({ ...previos, categoria_id: undefined }))
      setNuevaCategoria(null)
    } catch (error) {
      setErrorCategoria(mensajeError(error))
    } finally {
      setCreandoCategoria(false)
    }
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const encontrados = validarMovimiento(valores, tipo)
    setErrores(encontrados)
    setErrorGeneral(null)
    const primero = (Object.keys(encontrados) as Campo[])[0]
    if (primero) {
      formRef.current?.querySelector<HTMLElement>(`[name="${primero}"]`)?.focus()
      return
    }
    setEnviando(true)
    try {
      await onGuardar({
        tipo,
        concepto: valores.concepto.trim(),
        monto: Math.round(leerMonto(valores.monto) * 100) / 100,
        frecuencia: esGasto && valores.clase === 'variable' ? 'unico' : valores.frecuencia,
        fecha: valores.fecha,
        ...(esGasto && { categoria_id: Number(valores.categoria_id), clase: valores.clase as ClaseGasto }),
      })
    } catch (error) {
      setErrorGeneral(mensajeError(error))
      setEnviando(false)
    }
  }

  // Props comunes de cada campo.
  const campo = (nombre: Campo) => ({
    id: `mf-${nombre}`,
    name: nombre,
    value: valores[nombre],
    'aria-invalid': Boolean(errores[nombre]),
    'aria-describedby': errores[nombre] ? `mf-${nombre}-error` : undefined,
    onChange: (e: { target: { value: string } }) => cambiar(nombre, e.target.value),
    onBlur: () => revisarCampo(nombre),
  })

  const error = (nombre: Campo) =>
    errores[nombre] && (
      <p className="mform__error" id={`mf-${nombre}-error`} role="alert">
        <span aria-hidden="true">⚠</span> {errores[nombre]}
      </p>
    )

  const seRepite = valores.frecuencia !== 'unico'
  // Un ingreso elige libremente; un gasto fijo solo entre las que se repiten; uno variable no pregunta.
  const opcionesFrecuencia = esGasto ? FRECUENCIAS_GASTO_FIJO : FRECUENCIAS_INGRESO
  const preguntaFrecuencia = esGasto ? valores.clase === 'fijo' : true

  return (
    <form ref={formRef} className="mform" onSubmit={enviar} noValidate>
      {errorGeneral && (
        <p className="mform__error" role="alert">
          <span aria-hidden="true">⚠</span> {errorGeneral}
        </p>
      )}

      <div className="mform__field">
        <label htmlFor="mf-concepto">Concepto</label>
        <input {...campo('concepto')} maxLength={120} autoComplete="off" placeholder="Ej. Renta, Sueldo, Súper" />
        {error('concepto')}
      </div>

      <div className="mform__field">
        <label htmlFor="mf-monto">Monto (MXN)</label>
        <input {...campo('monto')} inputMode="decimal" autoComplete="off" placeholder="$0.00" />
        {error('monto')}
      </div>

      {esGasto && (
        <>
          <div className="mform__field">
            <label htmlFor="mf-categoria_id">Categoría</label>
            <select
              {...campo('categoria_id')}
              value={nuevaCategoria === null ? valores.categoria_id : NUEVA}
              onChange={(e) => {
                if (e.target.value === NUEVA) setNuevaCategoria('')
                else {
                  setNuevaCategoria(null)
                  setErrorCategoria(null)
                  cambiar('categoria_id', e.target.value)
                }
              }}
              disabled={categorias === null}
            >
              <option value="">{categorias === null ? 'Cargando categorías…' : 'Elige una categoría'}</option>
              {categorias?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
              <option value={NUEVA}>+ Nueva categoría</option>
            </select>
            {error('categoria_id')}
            {nuevaCategoria !== null && (
              <div className="mform__nueva">
                <label htmlFor="mf-nueva-categoria">Nombre de la categoría</label>
                <input
                  id="mf-nueva-categoria"
                  value={nuevaCategoria}
                  maxLength={60}
                  autoComplete="off"
                  placeholder="Ej. Mascotas"
                  aria-invalid={Boolean(errorCategoria)}
                  aria-describedby={errorCategoria ? 'mf-nueva-categoria-error' : undefined}
                  onChange={(e) => setNuevaCategoria(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void agregarCategoria()
                    }
                  }}
                />
                {errorCategoria && (
                  <p className="mform__error" id="mf-nueva-categoria-error" role="alert">
                    <span aria-hidden="true">⚠</span> {errorCategoria}
                  </p>
                )}
                <div className="mform__actions">
                  <button type="button" className="btn btn--ghost" onClick={() => setNuevaCategoria(null)} disabled={creandoCategoria}>
                    Cancelar
                  </button>
                  <button type="button" className="btn btn--primary" onClick={() => void agregarCategoria()} disabled={creandoCategoria}>
                    {creandoCategoria ? 'Agregando…' : 'Agregar categoría'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <fieldset className="mform__field">
            <legend>¿Es fijo o variable?</legend>
            <div className="mform__radios">
              {(
                [
                  ['fijo', 'Fijo', 'Se repite igual cada mes'],
                  ['variable', 'Variable', 'Cambia de monto'],
                ] as const
              ).map(([valor, etiqueta, ayuda]) => (
                <label key={valor} className="mform__radio">
                  <input
                    type="radio"
                    name="clase"
                    value={valor}
                    checked={valores.clase === valor}
                    aria-invalid={Boolean(errores.clase)}
                    onChange={() => {
                      cambiar('clase', valor)
                      setErrores((previos) => ({ ...previos, clase: undefined }))
                    }}
                  />
                  <span>
                    <strong>{etiqueta}</strong>
                    <small>{ayuda}</small>
                  </span>
                </label>
              ))}
            </div>
            {error('clase')}
          </fieldset>
        </>
      )}

      {preguntaFrecuencia && (
        <div className="mform__field">
          <label htmlFor="mf-frecuencia">¿Cada cuándo {esGasto ? 'se paga' : 'te llega'}?</label>
          <select {...campo('frecuencia')}>
            {opcionesFrecuencia.map((f) => (
              <option key={f.valor} value={f.valor}>
                {f.texto}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mform__field">
        <label htmlFor="mf-fecha">{seRepite ? 'Fecha de inicio' : 'Fecha'}</label>
        <input {...campo('fecha')} type="date" max={seRepite ? undefined : todayISO()} />
        {error('fecha')}
      </div>

      <div className="mform__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancelar} disabled={enviando}>
          Cancelar
        </button>
        <button type="submit" className="btn btn--primary" disabled={enviando}>
          {enviando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}

export default MovimientoFormulario
