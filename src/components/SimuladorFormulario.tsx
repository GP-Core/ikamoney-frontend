import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import type { Tarjeta } from '../types/finanzas'
import type { EscenarioPedido, Prioridad } from '../types/simulador'
import { escenariosAUrl, leerPrecio, MAX_ESCENARIOS, nombreTarjeta, OPCIONES_PRIORIDAD, PLAZOS_MSI } from '../utils/simulador'
import '../pages/SimuladorPage.css'

interface Errores {
  precio?: string
  tarjeta?: string
  escenarios?: string
}

/** Usuario sin tarjetas: el formulario no le serviría, se le lleva a registrar una. */
export function SinTarjetas() {
  return (
    <section className="simf-vacio" aria-labelledby="simf-vacio-titulo">
      <h2 id="simf-vacio-titulo">Primero registra una tarjeta</h2>
      <p>
        Para comparar una compra a meses necesitamos saber con qué tarjeta la harías: su límite y su fecha de pago.
        Toma menos de un minuto.
      </p>
      <Link className="sim-boton" to="/tarjetas/nueva">
        Registrar mi tarjeta
      </Link>
    </section>
  )
}

export function Formulario({ tarjetas }: { tarjetas: Tarjeta[] }) {
  const [descripcion, setDescripcion] = useState('')
  const [precioTexto, setPrecioTexto] = useState('')
  const [prioridad, setPrioridad] = useState<Prioridad>('media')
  const [contado, setContado] = useState(true)
  const [plazos, setPlazos] = useState<number[]>([6, 12, 18])
  const [tarjetaId, setTarjetaId] = useState<number | ''>(tarjetas.length === 1 ? tarjetas[0].id : '')
  const navigate = useNavigate()
  const [errores, setErrores] = useState<Errores>({})

  const hayMsi = plazos.length > 0
  const total = (contado ? 1 : 0) + plazos.length
  const lleno = total >= MAX_ESCENARIOS
  const ayudaPrioridad = OPCIONES_PRIORIDAD.find((p) => p.valor === prioridad)?.ayuda

  // Al aparecer un error, se manda el foco al primer campo con problema.
  useEffect(() => {
    if (errores.precio) document.getElementById('sim-precio')?.focus()
    else if (errores.tarjeta) document.getElementById('sim-tarjeta')?.focus()
  }, [errores])

  function alternarPlazo(meses: number) {
    setPlazos((actuales) => (actuales.includes(meses) ? actuales.filter((m) => m !== meses) : [...actuales, meses].sort((a, b) => a - b)))
    setErrores((e) => ({ ...e, escenarios: undefined, tarjeta: undefined }))
  }

  /** Solo valida formato; si la tarjeta alcanza o no lo decide el backend. */
  function validar(): Errores {
    const e: Errores = {}
    const precio = leerPrecio(precioTexto)
    if (precioTexto.trim() === '') e.precio = 'Escribe cuánto cuesta.'
    else if (Number.isNaN(precio)) e.precio = 'Escribe solo números, por ejemplo 12500.'
    else if (precio <= 0) e.precio = 'El precio debe ser mayor a cero.'
    if (!contado && !hayMsi) e.escenarios = 'Elige al menos una forma de pago para comparar.'
    if (hayMsi && tarjetaId === '') e.tarjeta = 'Elige la tarjeta para pagar a meses.'
    return e
  }

  function enviar(evento: React.SyntheticEvent) {
    evento.preventDefault()
    const nuevos = validar()
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) return

    const escenarios: EscenarioPedido[] = []
    if (contado) escenarios.push({ tipo: 'contado' })
    for (const meses of plazos) escenarios.push({ tipo: 'msi', tarjeta_id: Number(tarjetaId), meses })

    // El resultado se calcula y se muestra en /simulador: la compra viaja en la URL.
    const params = new URLSearchParams({
      precio: String(leerPrecio(precioTexto)),
      prioridad,
      escenarios: escenariosAUrl(escenarios),
    })
    if (descripcion.trim()) params.set('descripcion', descripcion.trim())
    navigate(`/simulador?${params}`)
  }

  return (
    <div className="balance__contenido">
      <form className="sim-form" onSubmit={enviar} noValidate>
        <div className="sim-campo">
          <label htmlFor="sim-precio">¿Cuánto cuesta?</label>
          <div className="sim-precio">
            <span aria-hidden="true">$</span>
            <input
              id="sim-precio"
              inputMode="decimal"
              autoComplete="off"
              autoFocus
              placeholder="0"
              value={precioTexto}
              aria-invalid={!!errores.precio}
              aria-describedby={errores.precio ? 'sim-precio-error' : undefined}
              onChange={(e) => {
                setPrecioTexto(e.target.value)
                setErrores((x) => ({ ...x, precio: undefined }))
              }}
            />
          </div>
          {errores.precio && (
            <p id="sim-precio-error" className="sim-error" role="alert">
              {errores.precio}
            </p>
          )}
        </div>

        <fieldset className="sim-campo">
          <legend>¿Cómo quieres compararlo?</legend>
          <div className="sim-chips">
            <button type="button" className="sim-chip" aria-pressed={contado} disabled={lleno && !contado} onClick={() => { setContado(!contado); setErrores((e) => ({ ...e, escenarios: undefined })) }}>
              Contado
            </button>
            {PLAZOS_MSI.map((meses) => (
              <button key={meses} type="button" className="sim-chip sim-chip--msi" aria-pressed={plazos.includes(meses)} disabled={lleno && !plazos.includes(meses)} onClick={() => alternarPlazo(meses)}>
                {meses} MSI
              </button>
            ))}
          </div>
          {lleno && <p className="sim-nota">Máximo {MAX_ESCENARIOS} escenarios a la vez. Quita uno para elegir otro.</p>}
          {errores.escenarios && (
            <p className="sim-error" role="alert">
              {errores.escenarios}
            </p>
          )}
        </fieldset>

        {hayMsi && tarjetas.length > 1 && (
          <div className="sim-campo">
            <label htmlFor="sim-tarjeta">¿Con qué tarjeta?</label>
            <select
              id="sim-tarjeta"
              value={tarjetaId}
              aria-invalid={!!errores.tarjeta}
              onChange={(e) => {
                setTarjetaId(e.target.value === '' ? '' : Number(e.target.value))
                setErrores((x) => ({ ...x, tarjeta: undefined }))
              }}
            >
              <option value="">Elige una tarjeta</option>
              {tarjetas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.banco} · {nombreTarjeta(t)}
                </option>
              ))}
            </select>
            {errores.tarjeta && (
              <p className="sim-error" role="alert">
                {errores.tarjeta}
              </p>
            )}
          </div>
        )}
        {hayMsi && tarjetas.length === 1 && (
          <p className="sim-nota">
            Tarjeta: {tarjetas[0].banco} · {nombreTarjeta(tarjetas[0])}
          </p>
        )}

        <Link className="sim-enlace" to="/tarjetas/nueva">
          ＋ Agregar otra tarjeta
        </Link>

        <fieldset className="sim-campo">
          <legend>¿Qué tan necesaria es?</legend>
          <div className="sim-segmentos" role="radiogroup">
            {OPCIONES_PRIORIDAD.map((p) => (
              <button key={p.valor} type="button" role="radio" aria-checked={prioridad === p.valor} className="sim-segmento" onClick={() => setPrioridad(p.valor)}>
                {p.etiqueta}
              </button>
            ))}
          </div>
          <p className="sim-nota">{ayudaPrioridad} Pesa en el veredicto final.</p>
        </fieldset>

        <div className="sim-campo">
          <label htmlFor="sim-desc">
            ¿Qué es? <span className="sim-opcional">(opcional)</span>
          </label>
          <input id="sim-desc" maxLength={120} autoComplete="off" placeholder="Ej. Laptop, tenis…" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </div>

        <button type="submit" className="sim-boton">
          Comparar escenarios
        </button>
      </form>
    </div>
  )
}

