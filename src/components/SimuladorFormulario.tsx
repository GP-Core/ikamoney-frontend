import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import type { Tarjeta } from '../types/finanzas'
import { useBalance } from '../hooks/useBalance'
import type { EscenarioPedido, PedidoSimulacion, Prioridad } from '../types/simulador'
import { mesActual } from '../utils/formatMes'
import { prioridadVecina } from '../utils/prioridad'
import { escenariosAUrl, leerPrecio, MAX_ESCENARIOS, nombreTarjeta, OPCIONES_PRIORIDAD, PLAZOS_MSI } from '../utils/simulador'
import '../pages/SimuladorPage.css'

interface Errores {
  precio?: string
  ahorro?: string
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

const MONTO = new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

interface FormularioProps {
  tarjetas: Tarjeta[]
  /** La compra que se está corrigiendo ("Cambiar datos"); null al capturar una nueva. */
  inicial?: PedidoSimulacion | null
}

export function Formulario({ tarjetas, inicial = null }: FormularioProps) {
  const msiInicial = inicial?.escenarios?.filter((e) => e.tipo === 'msi') ?? []
  const tarjetaInicial = tarjetas.find((t) => t.id === msiInicial[0]?.tarjeta_id)
  const [descripcion, setDescripcion] = useState(
    inicial && inicial.descripcion !== 'Tu compra' ? inicial.descripcion : '',
  )
  const [precioTexto, setPrecioTexto] = useState(inicial ? String(inicial.precio) : '')
  // null = sin tocar: se muestra lo que hay en las cuentas.
  const [ahorroEscrito, setAhorroEscrito] = useState<string | null>(
    inicial ? (inicial.ahorro_inicial > 0 ? String(inicial.ahorro_inicial) : '') : null,
  )
  const cuentas = useBalance(mesActual())
  const enCuentas = cuentas.data?.en_cuentas ?? 0
  const prellenado = ahorroEscrito === null && enCuentas > 0
  const ahorroTexto = ahorroEscrito ?? (enCuentas > 0 ? MONTO.format(enCuentas) : '')
  const buscandoCuentas = ahorroEscrito === null && cuentas.estado === 'cargando'
  const [prioridad, setPrioridad] = useState<Prioridad>(inicial?.prioridad ?? 'media')
  const [contado, setContado] = useState(!inicial?.escenarios || inicial.escenarios.some((e) => e.tipo === 'contado'))
  const [plazos, setPlazos] = useState<number[]>(
    inicial?.escenarios ? msiInicial.flatMap((e) => (e.meses ? [e.meses] : [])) : [6, 12, 18],
  )
  const [tarjetaId, setTarjetaId] = useState<number | ''>(
    tarjetaInicial?.id ?? (tarjetas.length === 1 ? tarjetas[0].id : ''),
  )
  const navigate = useNavigate()
  const [errores, setErrores] = useState<Errores>({})
  const opcionesPrioridad = useRef<Record<string, HTMLButtonElement | null>>({})

  const hayMsi = plazos.length > 0
  const total = (contado ? 1 : 0) + plazos.length
  const lleno = total >= MAX_ESCENARIOS
  const ayudaPrioridad = OPCIONES_PRIORIDAD.find((p) => p.valor === prioridad)?.ayuda

  // Al aparecer un error, se manda el foco al primer campo con problema.
  useEffect(() => {
    if (errores.precio) document.getElementById('sim-precio')?.focus()
    else if (errores.ahorro) document.getElementById('sim-ahorro')?.focus()
    else if (errores.tarjeta) document.getElementById('sim-tarjeta')?.focus()
  }, [errores])

  /** Flechas, Inicio y Fin cambian la prioridad y llevan el foco a la opción elegida. */
  function teclaPrioridad(evento: React.KeyboardEvent) {
    const siguiente = prioridadVecina(prioridad, evento.key)
    if (!siguiente) return
    evento.preventDefault()
    setPrioridad(siguiente)
    opcionesPrioridad.current[siguiente]?.focus()
  }

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
    if (ahorroTexto.trim() !== '' && Number.isNaN(leerPrecio(ahorroTexto))) e.ahorro = 'Escribe solo números, por ejemplo 5000.'
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
    const ahorro = leerPrecio(ahorroTexto)
    if (ahorro > 0) params.set('ahorro', String(ahorro))
    navigate(`/simulador?${params}`)
  }

  return (
    <div className="balance__contenido">
      <form className="sim-form" onSubmit={enviar} noValidate>
        <div className="sim-campo">
          <label htmlFor="sim-desc">
            ¿Qué quieres comprar? <span className="sim-opcional">(opcional)</span>
          </label>
          <input id="sim-desc" autoFocus maxLength={120} autoComplete="off" placeholder="Ej. Laptop, tenis…" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </div>

        <div className="sim-campo">
          <label htmlFor="sim-precio">¿Cuánto cuesta?</label>
          <div className="sim-precio">
            <span aria-hidden="true">$</span>
            <input
              id="sim-precio"
              inputMode="decimal"
              autoComplete="off"
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

        <div className="sim-campo">
          <label htmlFor="sim-ahorro">
            ¿Con cuánto dinero cuentas hoy? <span className="sim-opcional">(opcional)</span>
          </label>
          <div className="sim-precio">
            <span aria-hidden="true">$</span>
            <input
              id="sim-ahorro"
              inputMode="decimal"
              autoComplete="off"
              placeholder={buscandoCuentas ? 'Cargando…' : '0'}
              value={ahorroTexto}
              aria-invalid={!!errores.ahorro}
              aria-describedby="sim-ahorro-ayuda"
              onChange={(e) => {
                setAhorroEscrito(e.target.value)
                setErrores((x) => ({ ...x, ahorro: undefined }))
              }}
            />
          </div>
          <p id="sim-ahorro-ayuda" className="sim-nota">
            {prellenado
              ? 'Tomado de tus cuentas. Cámbialo si parte de ese dinero ya está apartado.'
              : 'Sin este dato, pagar de contado casi siempre saldrá como no recomendable.'}
          </p>
          {errores.ahorro && (
            <p className="sim-error" role="alert">
              {errores.ahorro}
            </p>
          )}
        </div>

        <fieldset className="sim-campo">
          <legend>¿Cómo lo pagarías?</legend>
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
          <legend id="sim-prioridad-titulo">¿Qué tan necesaria es?</legend>
          <div className="sim-segmentos" role="radiogroup" aria-labelledby="sim-prioridad-titulo" aria-describedby="sim-prioridad-ayuda" onKeyDown={teclaPrioridad}>
            {OPCIONES_PRIORIDAD.map((p) => (
              <button
                key={p.valor}
                ref={(el) => {
                  opcionesPrioridad.current[p.valor] = el
                }}
                type="button"
                role="radio"
                aria-checked={prioridad === p.valor}
                tabIndex={prioridad === p.valor ? 0 : -1}
                className="sim-segmento"
                onClick={() => setPrioridad(p.valor)}
              >
                {p.etiqueta}
              </button>
            ))}
          </div>
          <p id="sim-prioridad-ayuda" className="sim-nota">
            {ayudaPrioridad} Pesa en el veredicto final.
          </p>
        </fieldset>

        <button type="submit" className="sim-boton" disabled={buscandoCuentas}>
          Ver si me conviene
        </button>
      </form>
    </div>
  )
}

