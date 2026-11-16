import { useEffect, useState } from 'react'
import { useTarjetas } from '../hooks/useTarjetas'
import { ApiError } from '../services/api'
import { SIMULADOR_USANDO_EJEMPLO, simularCompra } from '../services/simulador'
import type { EscenarioPedido, EscenarioResultado, Prioridad, SimulacionResultado, Tarjeta, Veredicto } from '../types/simulador'
import { pesos } from '../utils/pesos'
import { leerPrecio, MAX_ESCENARIOS, nombreTarjeta, PLAZOS_MSI, PRIORIDADES } from '../utils/simulador'
import './BalancePage.css'
import './SimuladorPage.css'

/** Pantalla de registro de tarjeta (RegistrarTarjetaPage). */
const RUTA_REGISTRAR_TARJETA = '/?tarjeta-nueva'

interface Errores {
  precio?: string
  tarjeta?: string
  escenarios?: string
}

/** Pantalla del simulador (T39): captura una compra y compara contado contra varios plazos MSI. */
function SimuladorPage() {
  const { estado, tarjetas, error, reintentar } = useTarjetas()

  return (
    <main className="balance">
      <div className="balance__ancho">
        <header className="balance__encabezado">
          <a className="balance__mes-boton score-volver" href="/" aria-label="Volver al balance">
            ‹
          </a>
          <div className="balance__mes">
            <h1 className="balance__titulo">¿Me conviene?</h1>
            {SIMULADOR_USANDO_EJEMPLO && <span className="balance__ejemplo">Datos de ejemplo</span>}
          </div>
          <span className="score-volver score-volver--vacio" aria-hidden="true" />
        </header>

        {estado === 'cargando' && (
          <div className="balance__contenido" aria-busy="true" aria-live="polite">
            <span className="balance__sr">Cargando tus tarjetas…</span>
            <div className="esqueleto esqueleto--resumen" />
            <div className="esqueleto esqueleto--grafica" />
          </div>
        )}

        {estado === 'error' && (
          <section className="balance__error" role="alert">
            <h2>No pudimos cargar tus tarjetas</h2>
            <p>{error}</p>
            <button type="button" className="balance__reintentar" onClick={reintentar}>
              Reintentar
            </button>
          </section>
        )}

        {estado === 'ok' && tarjetas.length === 0 && <SinTarjetas />}
        {estado === 'ok' && tarjetas.length > 0 && <Formulario tarjetas={tarjetas} />}
      </div>
    </main>
  )
}

/** Usuario sin tarjetas: el formulario no le serviría, se le lleva a registrar una. */
function SinTarjetas() {
  return (
    <section className="sim-vacio" aria-labelledby="sim-vacio-titulo">
      <h2 id="sim-vacio-titulo">Primero registra una tarjeta</h2>
      <p>
        Para comparar una compra a meses necesitamos saber con qué tarjeta la harías: su límite y su fecha de pago.
        Toma menos de un minuto.
      </p>
      <a className="sim-boton" href={RUTA_REGISTRAR_TARJETA}>
        Registrar mi tarjeta
      </a>
    </section>
  )
}

function Formulario({ tarjetas }: { tarjetas: Tarjeta[] }) {
  const [descripcion, setDescripcion] = useState('')
  const [precioTexto, setPrecioTexto] = useState('')
  const [prioridad, setPrioridad] = useState<Prioridad>('media')
  const [contado, setContado] = useState(true)
  const [plazos, setPlazos] = useState<number[]>([6, 12, 18])
  const [tarjetaId, setTarjetaId] = useState<number | ''>(tarjetas.length === 1 ? tarjetas[0].id : '')
  const [errores, setErrores] = useState<Errores>({})
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)
  const [sinIngresos, setSinIngresos] = useState(false)
  const [resultado, setResultado] = useState<SimulacionResultado | null>(null)

  const hayMsi = plazos.length > 0
  const total = (contado ? 1 : 0) + plazos.length
  const lleno = total >= MAX_ESCENARIOS
  const ayudaPrioridad = PRIORIDADES.find((p) => p.valor === prioridad)?.ayuda

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

  async function enviar(evento: React.SyntheticEvent) {
    evento.preventDefault()
    const nuevos = validar()
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) return

    const escenarios: EscenarioPedido[] = []
    if (contado) escenarios.push({ tipo: 'contado' })
    for (const meses of plazos) escenarios.push({ tipo: 'msi', tarjeta_id: Number(tarjetaId), meses })

    setEnviando(true)
    setErrorEnvio(null)
    setSinIngresos(false)
    try {
      setResultado(
        await simularCompra({
          descripcion: descripcion.trim() || 'Compra sin nombre',
          precio: leerPrecio(precioTexto),
          prioridad,
          escenarios,
        }),
      )
    } catch (error) {
      setResultado(null)
      setSinIngresos(error instanceof ApiError && error.codigo === 'SIN_INGRESOS')
      setErrorEnvio(error instanceof TypeError ? 'No se pudo conectar con el servidor.' : error instanceof Error ? error.message : 'Ocurrió un error inesperado.')
    } finally {
      setEnviando(false)
    }
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

        <a className="sim-enlace" href={RUTA_REGISTRAR_TARJETA}>
          ＋ Agregar otra tarjeta
        </a>

        <fieldset className="sim-campo">
          <legend>¿Qué tan necesaria es?</legend>
          <div className="sim-segmentos" role="radiogroup">
            {PRIORIDADES.map((p) => (
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

        <button type="submit" className="sim-boton" disabled={enviando}>
          {enviando ? 'Calculando…' : 'Comparar escenarios'}
        </button>
      </form>

      {errorEnvio && (
        <section className="balance__error" role="alert">
          <h2>{sinIngresos ? 'Falta registrar tus ingresos' : 'No pudimos simular la compra'}</h2>
          <p>{errorEnvio}</p>
        </section>
      )}

      {resultado && !errorEnvio && <Resultados resultado={resultado} />}
    </div>
  )
}

const ETIQUETA_VEREDICTO: Record<Veredicto, string> = {
  recomendable: 'Recomendable',
  con_precaucion: 'Con precaución',
  no_recomendable: 'No recomendable',
}

function Resultados({ resultado }: { resultado: SimulacionResultado }) {
  const mejor = resultado.escenarios.find((e) => e.id === resultado.menor_impacto)
  return (
    <section className="sim-resultados" aria-live="polite" aria-label="Resultado de los escenarios">
      {resultado.estado === 'sin_escenarios_validos' && (
        <p className="sim-nota">Ningún escenario aplica para esta compra. Revisa los motivos o prueba con otra tarjeta.</p>
      )}
      {resultado.veredicto && (
        <div className={`sim-veredicto sim-veredicto--${resultado.veredicto}`}>
          <strong>{resultado.veredicto_texto ?? ETIQUETA_VEREDICTO[resultado.veredicto]}</strong>
          {mejor && <span>Mejor opción: {nombreEscenario(mejor)}</span>}
          {mejor?.razon && <p>{mejor.razon}</p>}
        </div>
      )}
      {resultado.escenarios.map((e) => (
        <Escenario key={e.id} e={e} />
      ))}
      {resultado.supuestos.length > 0 && (
        <ul className="sim-supuestos">
          {resultado.supuestos.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      )}
    </section>
  )
}

function nombreEscenario(e: EscenarioResultado): string {
  return e.tipo === 'contado' ? 'De contado' : `${e.meses} meses sin intereses`
}

function Escenario({ e }: { e: EscenarioResultado }) {
  const clase = !e.aplica ? ' sim-escenario--no' : e.veredicto ? ` sim-escenario--${e.veredicto}` : ''
  return (
    <article className={`sim-escenario${clase}`}>
      <h3>
        {nombreEscenario(e)}
        {e.menor_impacto && <span className="sim-mejor">Menor impacto</span>}
      </h3>
      {e.aplica && e.mensualidad !== null && (
        <p className="sim-mensualidad">{e.tipo === 'contado' ? `${pesos(e.mensualidad)} hoy` : `${pesos(e.mensualidad)} al mes`}</p>
      )}
      {e.tarjeta_nombre && <p className="sim-nota">{e.tarjeta_nombre}</p>}
      {e.aplica && e.veredicto && <p className="sim-etiqueta">{e.veredicto_texto ?? ETIQUETA_VEREDICTO[e.veredicto]}</p>}
      {e.aplica && e.razon && <p className="sim-nota">{e.razon}</p>}
      {e.aplica && e.indicadores && e.indicadores.meses_en_negativo > 0 && (
        <p className="sim-no-viable">
          Tu dinero no alcanzaría en {e.indicadores.meses_en_negativo} {e.indicadores.meses_en_negativo === 1 ? 'mes' : 'meses'}.
        </p>
      )}
      {e.aplica && e.score && e.score.cambio !== 0 && (
        <p className="sim-nota">
          Tu índice {e.score.cambio > 0 ? 'subiría' : 'bajaría'} {Math.abs(e.score.cambio)} puntos ({e.score.nivel_texto}).
        </p>
      )}
      {!e.aplica && <p className="sim-no-viable">No aplica: {e.motivo?.mensaje ?? 'sin detalle'}</p>}
    </article>
  )
}

export default SimuladorPage