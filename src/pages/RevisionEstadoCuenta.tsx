import { useEffect, useReducer, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import Button from '../components/Button'
import ConfirmDialog from '../components/ConfirmDialog'
import EstadoCuentaGuardado from '../components/EstadoCuentaGuardado'
import FormAlert from '../components/FormAlert'
import PasosEstadoCuenta from '../components/PasosEstadoCuenta'
import RevisionMovimientos from '../components/RevisionMovimientos'
import RevisionTarjeta from '../components/RevisionTarjeta'
import SubirEstadoCuenta from '../components/SubirEstadoCuenta'
import { useCupoLecturas } from '../hooks/useCupoLecturas'
import { useTarjetasYDeudas } from '../hooks/useFinanzas'
import { ApiError } from '../services/api'
import { errorDeExtraccion, extraerEstadoCuenta, guardarEstadoCuenta } from '../services/estadosCuenta'
import type { DestinoTarjeta, ResultadoGuardado } from '../types/estadoCuenta'
import type { Tarjeta } from '../types/finanzas'
import { mensajeError } from '../utils/errores'
import { pesos } from '../utils/pesos'
import {
  aPayload, aTextoFecha, cupoTrasLectura, estadoInicial, faltantesNueva, fechaCortePropuesta, hayCambios, reducer,
  resumenFilas, tarjetaSugerida, textoLecturaUsada, totalFilas, validar,
} from '../utils/revisionEstado'
import './BalancePage.css'
import './RevisionEstadoCuenta.css'

const MAX_MB = 10
type Etapa = 'subir' | 'extrayendo' | 'revisar' | 'guardado'

/** Pantalla obligatoria entre la extracción y el guardado: nada se guarda hasta que el usuario confirma. */
export default function RevisionEstadoCuenta() {
  const navegar = useNavigate()
  const { key } = useLocation()
  const { datos: finanzas, recargar } = useTarjetasYDeudas()
  // Mientras se recarga se conservan las anteriores, para que el selector no se vacíe.
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([])
  if (finanzas && finanzas.tarjetas !== tarjetas) setTarjetas(finanzas.tarjetas)

  const [cupo, setCupo] = useCupoLecturas()
  const [etapa, setEtapa] = useState<Etapa>('subir')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [errorArchivo, setErrorArchivo] = useState('')
  const [errorApi, setErrorApi] = useState<ApiError | null>(null)
  const [datos, despachar] = useReducer(reducer, estadoInicial)
  const [intentoConfirmar, setIntentoConfirmar] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorGuardar, setErrorGuardar] = useState('')
  const [errorCorte, setErrorCorte] = useState('')
  // null = lo que se propone solo; el usuario puede cambiarlo.
  const [destinoElegido, setDestinoElegido] = useState<string | null>(null)
  const [fechaElegida, setFechaElegida] = useState<string | null>(null)
  const [nombreNueva, setNombreNueva] = useState('')
  const [resultado, setResultado] = useState<ResultadoGuardado | null>(null)
  const [descartando, setDescartando] = useState(false)
  // Una clave por revisión: si el guardado se corta y se reintenta, el backend no duplica nada (N1).
  const claveConfirmacion = useRef(crypto.randomUUID())
  const abortar = useRef<AbortController | null>(null)
  const revision = useRef<HTMLDivElement>(null)

  const conIa = !!datos.tarjeta?.original
  const sinGuardar = etapa === 'revisar' && (hayCambios(datos) || nombreNueva !== '' || fechaElegida !== null)

  useEffect(() => () => abortar.current?.abort(), [])
  // Cerrar o recargar la pestaña con una revisión abierta: el navegador pregunta antes.
  useEffect(() => {
    if (!sinGuardar) return
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [sinGuardar])

  // ---------- Subir y extraer ----------
  function elegirArchivo(f: File | null) {
    setErrorApi(null)
    setArchivo(null)
    if (!f) return setErrorArchivo('')
    if (f.type !== 'application/pdf') return setErrorArchivo('Solo se aceptan archivos PDF.')
    if (f.size > MAX_MB * 1024 * 1024) return setErrorArchivo(`El PDF pesa más de ${MAX_MB} MB.`)
    setErrorArchivo('')
    setArchivo(f)
  }

  function empezarRevision() {
    setDestinoElegido(null)
    setFechaElegida(null)
    setNombreNueva('')
    setIntentoConfirmar(false)
    setErrorGuardar('')
    setErrorCorte('')
    setErrorApi(null)
    claveConfirmacion.current = crypto.randomUUID()
    setEtapa('revisar')
    window.scrollTo(0, 0)
  }

  async function extraer() {
    if (!archivo) return
    setErrorApi(null)
    setEtapa('extrayendo')
    abortar.current = new AbortController()
    try {
      const respuesta = await extraerEstadoCuenta(archivo, { signal: abortar.current.signal })
      despachar({ type: 'CARGAR', respuesta })
      setCupo(cupoTrasLectura)
      empezarRevision()
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      const error = errorDeExtraccion(e)
      setErrorApi(error)
      if (error.codigo === 'CUPO_AGOTADO') setCupo((c) => (c ? { ...c, usados: c.limite, restantes: 0 } : c))
      setEtapa('subir')
    }
  }

  function cancelarExtraccion() {
    abortar.current?.abort()
    setEtapa('subir')
  }

  function capturarAMano() {
    despachar({ type: 'MANUAL' })
    empezarRevision()
  }

  /** Si se entró directo a esta pantalla no hay a dónde regresar dentro de la app. */
  function salir() {
    if (key === 'default') navegar('/tarjetas')
    else navegar(-1)
  }

  function volverASubir() {
    setDescartando(false)
    setArchivo(null)
    setResultado(null)
    setErrorArchivo('')
    setEtapa('subir')
    window.scrollTo(0, 0)
  }

  // ---------- Confirmar ----------
  const hoy = aTextoFecha(new Date())
  const payload = aPayload(datos)
  const sugeridaId = tarjetaSugerida(datos.tarjeta?.original?.banco, tarjetas)
  const destinoId = destinoElegido ?? (sugeridaId === null ? 'nueva' : String(sugeridaId))
  const esNueva = destinoId === 'nueva'
  const fechaCorte = fechaElegida ?? fechaCortePropuesta(payload.tarjeta?.diaCorte ?? null, new Date())
  const errores = validar(datos, hoy)
  const faltan = esNueva ? faltantesNueva(payload.tarjeta, nombreNueva) : {}
  const errorFecha = !fechaCorte ? 'Elige la fecha de corte.' : fechaCorte > hoy ? 'No puede ser futura.' : ''
  const porCorregir = errores.total + Object.keys(faltan).length + (errorFecha ? 1 : 0)

  function irAlPrimerError() {
    requestAnimationFrame(() => revision.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
  }

  async function confirmar() {
    setIntentoConfirmar(true)
    setErrorGuardar('')
    setErrorCorte('')
    if (porCorregir > 0) return irAlPrimerError()

    const destino: DestinoTarjeta = esNueva
      ? { tipo: 'nueva', nombre: nombreNueva.trim() || (payload.tarjeta?.banco ?? '') }
      : { tipo: 'existente', id: Number(destinoId) }
    // En una tarjeta que ya existe no se muestra el banco, así que tampoco se cambia.
    const envio = esNueva || !payload.tarjeta ? payload : { ...payload, tarjeta: { ...payload.tarjeta, banco: null } }

    setGuardando(true)
    try {
      setResultado(await guardarEstadoCuenta(envio, destino, { claveConfirmacion: claveConfirmacion.current, fechaCorte }))
      setEtapa('guardado')
      recargar()
      window.scrollTo(0, 0)
    } catch (e) {
      const codigo = e instanceof ApiError ? e.codigo : undefined
      if (codigo === 'ESTADO_DUPLICADO' || codigo === 'FECHA_INVALIDA') {
        setErrorCorte(mensajeError(e))
        irAlPrimerError()
      } else {
        setErrorGuardar(mensajeError(e))
      }
    } finally {
      setGuardando(false)
    }
  }

  const paso = etapa === 'revisar' ? 2 : etapa === 'guardado' ? 3 : 1
  const titulos = {
    subir: ['Sube tu estado de cuenta', 'Leemos tu PDF y tú revisas todo antes de guardar.'],
    extrayendo: ['Leyendo tu estado de cuenta', 'Puede tardar hasta un minuto.'],
    revisar: conIa
      ? ['Revisa lo que leyó la IA', 'La IA puede equivocarse: corrige lo que haga falta. Nada se guarda hasta que confirmes.']
      : ['Captura tus datos', 'Escribe lo que aparece en tu estado de cuenta.'],
    guardado: ['Listo', 'Tu estado de cuenta quedó guardado.'],
  }[etapa]

  return (
    <main className="balance balance--t20 balance--estado">
      <div className="balance__ancho">
        <PasosEstadoCuenta paso={paso} />
        <header className="balance__cabecera">
          <h1>{titulos[0]}</h1>
        </header>
        <p className="estado-entrada">{titulos[1]}</p>

        {etapa === 'subir' && (
          <SubirEstadoCuenta
            maxMb={MAX_MB}
            cupo={cupo}
            archivo={archivo}
            errorArchivo={errorArchivo}
            errorApi={errorApi}
            onArchivo={elegirArchivo}
            onLeer={extraer}
            onManual={capturarAMano}
            onCancelar={salir}
          />
        )}

        {etapa === 'extrayendo' && (
          <section className="estado-ficha estado-cargando" role="status" aria-live="polite">
            <div className="estado-spinner" aria-hidden="true" />
            <p>Leyendo {archivo?.name}…</p>
            <p className="estado-nota">Si cancelas ahora, puede que la lectura ya cuente en tu cupo.</p>
            <Button variante="secundario" onClick={cancelarExtraccion}>
              Cancelar
            </Button>
          </section>
        )}

        {etapa === 'guardado' && resultado && (
          <EstadoCuentaGuardado resultado={resultado} conIa={conIa} cupo={cupo} onOtro={volverASubir} />
        )}

        {etapa === 'revisar' && datos.tarjeta && (
          <div className="estado-revision" ref={revision}>
            <div className="estado-revision__datos">
              {conIa && cupo && <p className="estado-nota">{textoLecturaUsada(cupo)}</p>}
              <RevisionTarjeta
                tarjetas={tarjetas}
                destinoId={destinoId}
                sugerida={destinoElegido === null && sugeridaId !== null}
                onDestino={setDestinoElegido}
                nombre={nombreNueva}
                onNombre={setNombreNueva}
                tarjeta={datos.tarjeta}
                onCampo={(campo, valor) => despachar({ type: 'EDITAR_TARJETA', campo, valor })}
                errores={intentoConfirmar ? errores.tarjeta : {}}
                faltan={intentoConfirmar ? faltan : {}}
                fechaCorte={fechaCorte}
                onFechaCorte={(f) => {
                  setFechaElegida(f)
                  setErrorCorte('')
                }}
                errorFecha={errorCorte || (intentoConfirmar ? errorFecha : '')}
                hoy={hoy}
              />
              <RevisionMovimientos
                filas={datos.filas}
                errores={intentoConfirmar ? errores.filas : {}}
                conIa={conIa}
                hayEliminada={!!datos.ultimaEliminada}
                hoy={hoy}
                despachar={despachar}
              />
            </div>

            <aside className="estado-ficha estado-pie">
              <h2>Antes de guardar</h2>
              <p>{resumenFilas(datos.filas)}</p>
              <p className="estado-pie__total">
                Total <strong>{pesos(totalFilas(datos.filas))}</strong>
              </p>
              {datos.filas.some((f) => !f.esMsi) && (
                <p className="estado-nota">
                  Los movimientos se guardan como historial de la tarjeta; no vuelven a mover tus saldos porque ya
                  vienen en el saldo al corte.
                </p>
              )}
              {intentoConfirmar && porCorregir > 0 && (
                <FormAlert tipo="critico">
                  Hay {porCorregir} dato{porCorregir === 1 ? '' : 's'} por corregir (marcados en rojo).
                </FormAlert>
              )}
              {errorGuardar && <FormAlert tipo="critico">{errorGuardar}</FormAlert>}
              <div className="estado-botones">
                <Button cargando={guardando} onClick={confirmar}>
                  Confirmar y guardar
                </Button>
                <Button
                  variante="secundario"
                  disabled={guardando}
                  onClick={() => (sinGuardar ? setDescartando(true) : volverASubir())}
                >
                  Cancelar
                </Button>
              </div>
            </aside>
          </div>
        )}
      </div>

      <ConfirmDialog
        abierto={descartando}
        titulo="¿Descartar este estado de cuenta?"
        textoConfirmar="Descartar"
        textoCancelar="Seguir revisando"
        onConfirmar={volverASubir}
        onCancelar={() => setDescartando(false)}
      >
        <p>No se ha guardado nada y se perderá lo que capturaste.</p>
        {conIa && <p>La lectura ya se descontó de tu cupo.</p>}
      </ConfirmDialog>
    </main>
  )
}
