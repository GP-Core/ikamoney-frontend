import { useEffect, useReducer, useRef, useState } from 'react'
import type { ChangeEvent, InputHTMLAttributes } from 'react'
import { confirmarEstadoCuenta, ErrorApi, extraerEstadoCuenta } from '../api/estadosCuenta'
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

const pesos = (n: number) => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })

/** Pantalla obligatoria entre la extracción y el guardado. onGuardado se llama al confirmar. */
export default function RevisionEstadoCuenta({ onGuardado }: { onGuardado?: () => void }) {
  const [etapa, setEtapa] = useState<Etapa>('subir')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [errorArchivo, setErrorArchivo] = useState('')
  const [errorApi, setErrorApi] = useState<ErrorApi | null>(null)
  const [datos, dispatch] = useReducer(reducer, estadoInicial)
  const [intentoConfirmar, setIntentoConfirmar] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorGuardar, setErrorGuardar] = useState('')
  const [modoManual, setModoManual] = useState(false)
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
      setErrorApi(
        e instanceof ErrorApi
          ? e
          : new ErrorApi(0, 'ERROR', 'Algo salió mal. Puedes capturar los datos a mano.'),
      )
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
    setGuardando(true)
    try {
      await confirmarEstadoCuenta(aPayload(datos))
      setEtapa('guardado')
      onGuardado?.()
    } catch (e) {
      setErrorGuardar(
        e instanceof Error ? e.message : 'No pudimos guardar. Tus cambios siguen aquí; intenta de nuevo.',
      )
    } finally {
      setGuardando(false)
    }
  }

  // ---------- Vistas ----------
  if (etapa === 'guardado') {
    return (
      <section className="rev">
        <div className="rev-aviso rev-aviso--ok" role="status">
          Guardado. Los datos de tu estado de cuenta ya son definitivos.
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
              {errorApi.reintentable && archivo && (
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
          {pesos(filas.reduce((t, f) => t + (Number(f.monto) > 0 ? Number(f.monto) : 0), 0))}
        </p>
        <button type="button" className="rev-btn rev-btn--principal" disabled={guardando} onClick={confirmar}>
          {guardando ? 'Guardando…' : 'Confirmar y guardar'}
        </button>
      </div>
    </section>
  )
}