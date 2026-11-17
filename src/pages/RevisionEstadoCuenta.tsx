import { useEffect, useReducer, useRef, useState } from 'react'
import type { ChangeEvent, InputHTMLAttributes } from 'react'
import { Link } from 'react-router'
import { useTarjetasYDeudas } from '../hooks/useFinanzas'
import { errorDeExtraccion, esReintentable, extraerEstadoCuenta, faltantesDeTarjetaNueva, guardarEstadoCuenta } from '../services/estadosCuenta'
import type { ApiError } from '../services/api'
import type { DestinoTarjeta, ResultadoGuardado } from '../types/estadoCuenta'
import { mensajeError } from '../utils/errores'
import { formatMoney } from '../utils/formatMoney'
import {
  aPayload, campoCambiado, campoTarjetaCambiado, CAMPOS_TARJETA, estadoDeFila,
  estadoInicial, reducer, tarjetaEditada, validar,
} from '../utils/revisionEstado'
import type { CampoFilaTexto, Errores, EstadoFila } from '../utils/revisionEstado'
import './RevisionEstadoCuenta.css'

const MAX_MB = 10
const ETIQUETA: Record<EstadoFila, string> = {
  ia: 'IA',
  editado: 'Editado por ti',
  agregado: 'Agregado por ti',
}

type Etapa = 'subir' | 'extrayendo' | 'revisar' | 'guardado'

const SIN_ERRORES: Errores = { filas: {}, tarjeta: {}, total: 0 }

/** Pantalla obligatoria entre la extracción y el guardado: nada se guarda hasta que el usuario confirma. */
export default function RevisionEstadoCuenta() {
  const { datos: finanzas } = useTarjetasYDeudas()
  const tarjetasGuardadas = finanzas?.tarjetas ?? []
  const [etapa, setEtapa] = useState<Etapa>('subir')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [errorArchivo, setErrorArchivo] = useState('')
  const [errorApi, setErrorApi] = useState<ApiError | null>(null)
  const [datos, dispatch] = useReducer(reducer, estadoInicial)
  const [intentoConfirmar, setIntentoConfirmar] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorGuardar, setErrorGuardar] = useState('')
  const [modoManual, setModoManual] = useState(false)
  // 'nueva' o el id de una tarjeta ya guardada.
  const [destinoId, setDestinoId] = useState('nueva')
  const [nombreNueva, setNombreNueva] = useState('')
  const [resultado, setResultado] = useState<ResultadoGuardado | null>(null)
  const abortar = useRef<AbortController | null>(null)

  useEffect(() => () => abortar.current?.abort(), [])

  // ---------- Subir y extraer ----------
  function elegirArchivo(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    setErrorApi(null)
    if (!f) {
      setArchivo(null)
      return
    }
    if (f.type !== 'application/pdf') {
      setArchivo(null)
      setErrorArchivo('Solo se aceptan archivos PDF.')
      return
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setArchivo(null)
      setErrorArchivo(`El PDF pesa más de ${MAX_MB} MB.`)
      return
    }
    setErrorArchivo('')
    setArchivo(f)
  }

  async function extraer() {
    if (!archivo) return
    setErrorApi(null)
    setEtapa('extrayendo')
    abortar.current = new AbortController()
    try {
      const respuesta = await extraerEstadoCuenta(archivo, { signal: abortar.current.signal })
      dispatch({ type: 'CARGAR', respuesta })
      setModoManual(false)
      setEtapa('revisar')
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      setErrorApi(errorDeExtraccion(e))
      setEtapa('subir')
    }
  }

  function cancelarExtraccion() {
    abortar.current?.abort()
    setEtapa('subir')
  }

  function capturarAMano() {
    dispatch({ type: 'MANUAL' })
    setModoManual(true)
    setErrorApi(null)
    setEtapa('revisar')
  }

  // ---------- Confirmar ----------
  const errores = etapa === 'revisar' ? validar(datos) : SIN_ERRORES

  async function confirmar() {
    setIntentoConfirmar(true)
    setErrorGuardar('')
    if (errores.total > 0) return

    const payload = aPayload(datos)
    const nombre = nombreNueva.trim() || (payload.tarjeta?.banco ?? '')
    if (destinoId === 'nueva') {
      const faltan = faltantesDeTarjetaNueva(payload.tarjeta)
      if (faltan.length > 0) {
        setErrorGuardar(`Para crear la tarjeta falta ${faltan.join(', ')}. Complétalo arriba o elige una tarjeta que ya tengas.`)
        return
      }
      if (!nombre) {
        setErrorGuardar('Escribe un nombre para reconocer la tarjeta.')
        return
      }
    }
    const destino: DestinoTarjeta = destinoId === 'nueva' ? { tipo: 'nueva', nombre } : { tipo: 'existente', id: Number(destinoId) }

    setGuardando(true)
    try {
      setResultado(await guardarEstadoCuenta(payload, destino))
      setEtapa('guardado')
    } catch (e) {
      setErrorGuardar(mensajeError(e))
    } finally {
      setGuardando(false)
    }
  }

  // ---------- Vistas ----------
  if (etapa === 'guardado' && resultado) {
    const { planesCreados: planes, tarjetaNueva, movimientosSinGuardar: sueltos } = resultado
    return (
      <section className="rev">
        <div className="rev-aviso rev-aviso--ok" role="status">
          <p>
            {tarjetaNueva ? 'Tarjeta creada' : 'Tarjeta actualizada'}
            {planes > 0 && ` y ${planes} ${planes === 1 ? 'compra' : 'compras'} a MSI guardadas`}.
          </p>
          {sueltos > 0 && (
            <p>
              Los {sueltos} {sueltos === 1 ? 'movimiento suelto' : 'movimientos sueltos'} no se guardaron: todavía no hay
              dónde registrarlos.
            </p>
          )}
        </div>
        <div className="rev-acciones">
          <Link className="rev-btn rev-btn--principal" to={`/tarjetas/${resultado.tarjetaId}`}>
            Ver la tarjeta
          </Link>
          <Link className="rev-btn rev-btn--sec" to="/tarjetas">
            Ir a Tarjetas y deudas
          </Link>
        </div>
      </section>
    )
  }

  if (etapa === 'extrayendo') {
    return (
      <section className="rev">
        <div className="rev-cargando" role="status" aria-live="polite">
          <div className="rev-spinner" aria-hidden="true" />
          <p>Leyendo tu estado de cuenta… puede tardar hasta un minuto.</p>
          <button type="button" className="rev-btn rev-btn--sec" onClick={cancelarExtraccion}>
            Cancelar
          </button>
        </div>
      </section>
    )
  }

  if (etapa === 'subir') {
    return (
      <section className="rev">
        <h1>Sube tu estado de cuenta</h1>
        <p className="rev-ayuda">
          PDF de tarjeta de crédito, máximo {MAX_MB} MB. Antes de enviarlo a la IA se ocultan tu
          número de tarjeta, CLABE, RFC, CURP y nombre. Siempre podrás revisar y corregir lo que lea.
        </p>
        <input type="file" accept="application/pdf" onChange={elegirArchivo} aria-label="Estado de cuenta en PDF" />
        {errorArchivo && <p className="rev-error" role="alert">{errorArchivo}</p>}
        {errorApi && (
          <div className="rev-aviso rev-aviso--error" role="alert">
            <p>{errorApi.message}</p>
            <div className="rev-acciones">
              {esReintentable(errorApi) && archivo && (
                <button type="button" className="rev-btn" onClick={extraer}>Reintentar</button>
              )}
              <button type="button" className="rev-btn rev-btn--sec" onClick={capturarAMano}>
                Capturar a mano
              </button>
            </div>
          </div>
        )}
        <div className="rev-acciones">
          <button type="button" className="rev-btn" disabled={!archivo} onClick={extraer}>
            Leer con IA
          </button>
          <button type="button" className="rev-btn rev-btn--sec" onClick={capturarAMano}>
            Prefiero capturar a mano
          </button>
        </div>
      </section>
    )
  }

  // etapa === 'revisar'
  const { filas, tarjeta, ultimaEliminada } = datos
  if (!tarjeta) return null
  const sinNada = filas.length === 0

  return (
    <section className="rev">
      <h1>{modoManual ? 'Captura tus datos' : 'Revisa lo que leyó la IA'}</h1>
      {!modoManual && (
        <p className="rev-ayuda">
          La IA puede equivocarse. Corrige lo que haga falta, elimina lo que sobre y agrega lo que
          falte. Nada se guarda hasta que confirmes.
        </p>
      )}
      <ul className="rev-leyenda" aria-label="Significado de las marcas">
        <li><span className="rev-marca rev-marca--ia">IA</span> Tal como lo leyó la IA</li>
        <li><span className="rev-marca rev-marca--editado">Editado por ti</span> Lo cambiaste</li>
        <li><span className="rev-marca rev-marca--agregado">Agregado por ti</span> Lo capturaste tú</li>
      </ul>

      {/* ---------- Tarjeta ---------- */}
      <fieldset className={`rev-tarjeta ${tarjetaEditada(tarjeta) ? 'rev-tarjeta--editado' : ''}`}>
        <legend>
          Datos de la tarjeta{' '}
          {tarjeta.original && (
            <span className={`rev-marca rev-marca--${tarjetaEditada(tarjeta) ? 'editado' : 'ia'}`}>
              {tarjetaEditada(tarjeta) ? ETIQUETA.editado : ETIQUETA.ia}
            </span>
          )}
        </legend>
        <div className="rev-tarjeta-grid">
          {CAMPOS_TARJETA.map(({ campo, etiqueta, tipo }) => {
            const msg = errores.tarjeta[campo]
            const sinDato = tarjeta.original !== null && tarjeta.original[campo] === null
            return (
              <label key={campo} className={campoTarjetaCambiado(tarjeta, campo) ? 'rev-cambiado' : ''}>
                <span>{etiqueta}</span>
                <input
                  type={tipo === 'text' ? 'text' : 'number'}
                  step={tipo === 'number' ? '0.01' : '1'}
                  min={tipo === 'dia' ? 1 : 0}
                  max={tipo === 'dia' ? 31 : undefined}
                  value={tarjeta.valores[campo] ?? ''}
                  placeholder={sinDato ? 'No se detectó' : ''}
                  aria-invalid={intentoConfirmar && !!msg}
                  onChange={(e) => dispatch({ type: 'EDITAR_TARJETA', campo, valor: e.target.value })}
                />
                {intentoConfirmar && msg && <small className="rev-error">{msg}</small>}
              </label>
            )
          })}
        </div>
      </fieldset>

      {/* ---------- Destino ---------- */}
      <fieldset className="rev-destino">
        <legend>¿A qué tarjeta corresponde?</legend>
        <label>
          <span>Tarjeta</span>
          <select value={destinoId} onChange={(e) => setDestinoId(e.target.value)}>
            <option value="nueva">Es una tarjeta nueva</option>
            {tarjetasGuardadas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
        </label>
        {destinoId === 'nueva' ? (
          <label>
            <span>Nombre para reconocerla</span>
            <input
              type="text"
              maxLength={60}
              value={nombreNueva}
              placeholder={tarjeta.valores.banco ? String(tarjeta.valores.banco) : 'Ej. BBVA Azul'}
              onChange={(e) => setNombreNueva(e.target.value)}
            />
          </label>
        ) : (
          <p className="rev-ayuda">
            Se actualizarán el saldo, el límite, la tasa y las fechas de esa tarjeta con los datos de arriba, y se
            agregarán sus compras a MSI.
          </p>
        )}
      </fieldset>

      {/* ---------- Movimientos ---------- */}
      <h2>Movimientos ({filas.length})</h2>

      {sinNada && (
        <div className="rev-aviso rev-aviso--vacio" role="status">
          <p>
            {modoManual
              ? 'Todavía no hay movimientos.'
              : 'No encontramos movimientos en este estado de cuenta.'}{' '}
            Puedes capturarlos a mano.
          </p>
          <button type="button" className="rev-btn" onClick={() => dispatch({ type: 'AGREGAR' })}>
            Capturar a mano
          </button>
        </div>
      )}

      <ul className="rev-lista">
        {filas.map((f) => {
          const estado = estadoDeFila(f)
          const e = errores.filas[f.id] ?? {}
          const campo = (
            nombre: CampoFilaTexto,
            etiqueta: string,
            props: InputHTMLAttributes<HTMLInputElement>,
          ) => (
            <label className={`rev-campo rev-campo--${nombre} ${campoCambiado(f, nombre) ? 'rev-cambiado' : ''}`}>
              <span>{etiqueta}</span>
              <input
                {...props}
                value={f[nombre] ?? ''}
                aria-invalid={intentoConfirmar && !!e[nombre]}
                onChange={(ev) =>
                  dispatch({ type: 'EDITAR_FILA', id: f.id, campo: nombre, valor: ev.target.value })
                }
              />
              {intentoConfirmar && e[nombre] && <small className="rev-error">{e[nombre]}</small>}
            </label>
          )
          return (
            <li key={f.id} className={`rev-fila rev-fila--${estado}`}>
              <div className="rev-fila-cabecera">
                <span className={`rev-marca rev-marca--${estado}`}>{ETIQUETA[estado]}</span>
                <button
                  type="button"
                  className="rev-btn rev-btn--peligro"
                  onClick={() => dispatch({ type: 'ELIMINAR', id: f.id })}
                  aria-label={`Eliminar ${f.concepto || 'movimiento'}`}
                >
                  Eliminar
                </button>
              </div>
              <div className="rev-fila-campos">
                {campo('fecha', f.esMsi ? 'Fecha de compra (opcional)' : 'Fecha', { type: 'date' })}
                {campo('concepto', 'Concepto', { type: 'text', maxLength: 120 })}
                {campo('monto', f.esMsi ? 'Monto total (MXN)' : 'Monto (MXN)', { type: 'number', step: '0.01', min: '0' })}
                <label className={`rev-msi ${campoCambiado(f, 'esMsi') ? 'rev-cambiado' : ''}`}>
                  <input
                    type="checkbox"
                    checked={f.esMsi}
                    onChange={(ev) =>
                      dispatch({ type: 'EDITAR_FILA', id: f.id, campo: 'esMsi', valor: ev.target.checked })
                    }
                  />
                  <span>Es a meses sin intereses</span>
                </label>
                {f.esMsi && (
                  <>
                    {campo('meses', 'Meses', { type: 'number', step: '1', min: '2' })}
                    {campo('mensualidadesPagadas', 'Mensualidades pagadas', { type: 'number', step: '1', min: '0' })}
                  </>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      <div className="rev-acciones">
        <button type="button" className="rev-btn rev-btn--sec" onClick={() => dispatch({ type: 'AGREGAR' })}>
          + Agregar movimiento
        </button>
        {ultimaEliminada && (
          <button type="button" className="rev-btn rev-btn--sec" onClick={() => dispatch({ type: 'DESHACER' })}>
            Deshacer eliminación
          </button>
        )}
      </div>

      {/* ---------- Confirmar ---------- */}
      <div className="rev-pie">
        {intentoConfirmar && errores.total > 0 && (
          <p className="rev-error" role="alert">
            Hay {errores.total} dato{errores.total === 1 ? '' : 's'} por corregir (marcados en rojo).
          </p>
        )}
        {errorGuardar && <p className="rev-error" role="alert">{errorGuardar}</p>}
        <p className="rev-resumen">
          {filas.filter((f) => !f.esMsi).length} movimientos · {filas.filter((f) => f.esMsi).length} compras a MSI
          {' · '}Total:{' '}
          {formatMoney(filas.reduce((t, f) => t + (Number(f.monto) > 0 ? Number(f.monto) : 0), 0))}
        </p>
        {filas.some((f) => !f.esMsi) && (
          <p className="rev-aviso rev-aviso--vacio" role="note">
            Por ahora se guardan la tarjeta y las compras a MSI. Los movimientos sueltos todavía no se pueden guardar.
          </p>
        )}
        <button type="button" className="rev-btn rev-btn--principal" disabled={guardando} onClick={confirmar}>
          {guardando ? 'Guardando…' : 'Confirmar y guardar'}
        </button>
      </div>
    </section>
  )
}