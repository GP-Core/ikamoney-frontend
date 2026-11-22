import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Button from '../components/Button'
import EncabezadoPagina from '../components/EncabezadoPagina'
import EstadoCarga from '../components/EstadoCarga'
import FormAlert from '../components/FormAlert'
import Interruptor from '../components/Interruptor'
import NotaSinConexion from '../components/NotaSinConexion'
import TextField from '../components/TextField'
import { useAlertas } from '../hooks/useAlertas'
import { useAuth } from '../hooks/useAuth'
import { useConexion } from '../hooks/useConexion'
import { alertasService } from '../services/alertas'
import { desuscribirPush, pedirPermisoPush, permisoPush, pushHabilitado, suscribirPush } from '../services/push'
import type { PermisoPush } from '../services/push'
import type { ConfiguracionAlertas, ConfiguracionEdicion } from '../types/alerta'
import { DIAS_MAX, DIAS_MIN, UMBRAL_MAX, UMBRAL_MIN, errorDias, errorUmbral } from '../utils/alertas'
import { mensajeError } from '../utils/errores'
import './Finanzas.css'
import './AlertasConfigPage.css'

/** Por qué el interruptor de push no se puede encender, o null si se puede. */
function notaDePush(permiso: PermisoPush, habilitado: boolean): string | null {
  if (!habilitado) return 'Disponible próximamente. Por ahora te avisamos en la app y por correo.'
  if (permiso === 'no-soportado') {
    return 'Este navegador no permite notificaciones. En iPhone, instala IkaMoney en tu pantalla de inicio para activarlas.'
  }
  if (permiso === 'denied') {
    return 'Bloqueaste las notificaciones de IkaMoney en el navegador. Actívalas en los ajustes del sitio para usar esta opción.'
  }
  return null
}

/** Configuración de alertas (T49): a partir de qué uso, con cuántos días de anticipación y por qué canales. */
function AlertasConfigPage() {
  const { usuario } = useAuth()
  const { recargar } = useAlertas()
  const enLinea = useConexion()

  const [base, setBase] = useState<ConfiguracionAlertas | null>(null)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [umbral, setUmbral] = useState(0)
  const [dias, setDias] = useState('')
  const [correo, setCorreo] = useState(false)
  const [push, setPush] = useState(false)
  const [permiso, setPermiso] = useState<PermisoPush>(() => permisoPush())
  const [avisoPush, setAvisoPush] = useState<string | null>(null)
  const [errorDiasCampo, setErrorDiasCampo] = useState<string | null>(null)
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null)
  const [guardado, setGuardado] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const habilitado = pushHabilitado()
  const notaPush = notaDePush(permiso, habilitado)
  const pushBloqueado = notaPush !== null

  function aplicar(c: ConfiguracionAlertas) {
    setBase(c)
    setUmbral(c.umbral_utilizacion)
    setDias(String(c.dias_anticipacion))
    setCorreo(c.canales.correo)
    setPush(c.canales.push)
  }

  useEffect(() => {
    let activo = true
    alertasService
      .obtenerConfiguracion()
      .then(async (c) => {
        let actual = c
        // Si el servidor dice que push está encendido pero este navegador no lo permite, no se muestra
        // encendido en falso: se corrige también en el servidor (IC-08).
        if (c.canales.push && (!pushHabilitado() || permisoPush() !== 'granted')) {
          try {
            actual = await alertasService.guardarConfiguracion({ canales: { push: false } })
          } catch {
            actual = { ...c, canales: { ...c.canales, push: false } }
          }
        }
        if (activo) aplicar(actual)
      })
      .catch((error) => activo && setErrorCarga(mensajeError(error)))
    return () => {
      activo = false
    }
  }, [])

  async function cambiarPush(activar: boolean) {
    setAvisoPush(null)
    setGuardado(false)
    if (!activar) {
      setPush(false)
      return
    }
    const resultado = await pedirPermisoPush()
    setPermiso(resultado)
    if (resultado === 'granted') {
      setPush(true)
    } else {
      setPush(false)
      setAvisoPush(
        resultado === 'denied'
          ? 'No diste el permiso en el navegador, así que no activamos las notificaciones.'
          : 'Para activarlas, acepta el permiso que pide el navegador.',
      )
    }
  }

  async function guardar(evento: FormEvent) {
    evento.preventDefault()
    if (!base) return
    setGuardado(false)
    setErrorGuardar(null)

    const diasNumero = Number(dias)
    const errorDeDias = dias.trim() === '' ? 'Escribe los días de anticipación' : errorDias(diasNumero)
    setErrorDiasCampo(errorDeDias)
    const errorDeUmbral = errorUmbral(umbral)
    if (errorDeDias || errorDeUmbral) {
      if (errorDeUmbral) setErrorGuardar(errorDeUmbral)
      return
    }

    // Solo se envía lo que cambió.
    // Encender push: primero se suscribe este dispositivo; si no se puede, no se guarda nada y se explica por qué.
    if (push && !base.canales.push) {
      try {
        await suscribirPush()
      } catch (error) {
        setErrorGuardar(mensajeError(error))
        setPush(false)
        return
      }
    }
    const cambios: ConfiguracionEdicion = {}
    if (umbral !== base.umbral_utilizacion) cambios.umbral_utilizacion = umbral
    if (diasNumero !== base.dias_anticipacion) cambios.dias_anticipacion = diasNumero
    const canales: NonNullable<ConfiguracionEdicion['canales']> = {}
    if (correo !== base.canales.correo) canales.correo = correo
    if (push !== base.canales.push) canales.push = push
    if (Object.keys(canales).length > 0) cambios.canales = canales
    if (Object.keys(cambios).length === 0) {
      setGuardado(true)
      return
    }

    setGuardando(true)
    try {
      aplicar(await alertasService.guardarConfiguracion(cambios))
      // Apagar push: ya guardado, este dispositivo deja de recibirlo (en el servidor y en el navegador).
      if (!push && base.canales.push) await desuscribirPush()
      recargar() // el servidor reevalúa las alertas con los valores nuevos
      setGuardado(true)
    } catch (error) {
      setErrorGuardar(mensajeError(error))
    } finally {
      setGuardando(false)
    }
  }

  if (!base) {
    return <EstadoCarga error={errorCarga} regresar={{ a: '/alertas', texto: 'Volver a los avisos' }} />
  }

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo="Cuándo avisarme"
        subtitulo="Elige cuándo y por dónde quieres recibir tus avisos."
        regresar={{ a: '/alertas', texto: 'Volver a los avisos' }}
      />

      {guardado && <FormAlert tipo="sano">Guardamos tus ajustes.</FormAlert>}
      {errorGuardar && <FormAlert tipo="critico">{errorGuardar}</FormAlert>}
      {avisoPush && <FormAlert tipo="precaucion">{avisoPush}</FormAlert>}

      <form className="formulario" onSubmit={guardar} noValidate>
        <section className="ficha alertas-config__bloque" aria-labelledby="umbral-titulo">
          <h2 id="umbral-titulo">Uso de tus tarjetas</h2>
          <label htmlFor="umbral" className="alertas-config__etiqueta">
            Avísame al llegar a <output htmlFor="umbral">{umbral} %</output>
          </label>
          <input
            id="umbral"
            type="range"
            className="alertas-config__rango"
            min={UMBRAL_MIN}
            max={UMBRAL_MAX}
            step={5}
            value={umbral}
            aria-describedby="umbral-ayuda"
            onChange={(e) => {
              setUmbral(Number(e.target.value))
              setGuardado(false)
            }}
          />
          <p id="umbral-ayuda" className="alertas-config__ayuda">
            Te avisamos cuando una tarjeta use este porcentaje o más de su límite de crédito. Recomendamos 50 % o
            menos, la referencia del Buró de Crédito.
          </p>
        </section>

        <section className="ficha alertas-config__bloque" aria-labelledby="dias-titulo">
          <h2 id="dias-titulo">Fecha de pago</h2>
          <TextField
            etiqueta="Días de anticipación"
            type="number"
            inputMode="numeric"
            min={DIAS_MIN}
            max={DIAS_MAX}
            step={1}
            value={dias}
            error={errorDiasCampo}
            ayuda={
              errorDias(Number(dias)) === null && dias.trim() !== ''
                ? `Avísame ${dias} ${dias === '1' ? 'día' : 'días'} antes de la fecha límite de pago.`
                : `Elige cuántos días antes de la fecha límite de pago quieres el aviso (de ${DIAS_MIN} a ${DIAS_MAX}).`
            }
            onChange={(e) => {
              setDias(e.target.value)
              setErrorDiasCampo(null)
              setGuardado(false)
            }}
          />
        </section>

        <section className="ficha alertas-config__bloque" aria-labelledby="canales-titulo">
          <h2 id="canales-titulo">Por dónde avisarme</h2>
          <Interruptor
            etiqueta="En la app"
            descripcion="Tus avisos siempre aparecen en la campana de IkaMoney."
            activo
            disabled
            onCambiar={() => {}}
          />
          <Interruptor
            etiqueta="Por correo"
            descripcion={
              <>
                Te escribimos a <strong className="alertas-config__correo">{usuario?.correo}</strong>. Los avisos nunca
                incluyen saldos.
              </>
            }
            activo={correo}
            onCambiar={(v) => {
              setCorreo(v)
              setGuardado(false)
            }}
          />
          <Interruptor
            etiqueta="Notificaciones en tu dispositivo"
            descripcion="Un aviso breve en tu celular o computadora, sin saldos. El navegador te pedirá permiso."
            activo={push && !pushBloqueado}
            disabled={pushBloqueado}
            nota={notaPush}
            onCambiar={(v) => void cambiarPush(v)}
          />
        </section>

        <div className="formulario__acciones">
          <Button type="submit" cargando={guardando} disabled={!enLinea}>
            Guardar cambios
          </Button>
        </div>
        <NotaSinConexion />
      </form>
    </div>
  )
}

export default AlertasConfigPage
