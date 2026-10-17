import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import BarraUso from '../components/BarraUso'
import Button from '../components/Button'
import ConfirmDialog from '../components/ConfirmDialog'
import EncabezadoPagina from '../components/EncabezadoPagina'
import EstadoCarga from '../components/EstadoCarga'
import FormAlert from '../components/FormAlert'
import Icon from '../components/Icon'
import { useTarjetasYDeudas } from '../hooks/useFinanzas'
import { MODO_PRUEBA } from '../services/auth'
import { finanzasService } from '../services/finanzas'
import { cargarDatosDeEjemplo } from '../services/finanzasMock'
import type { Deuda, Tarjeta } from '../types/finanzas'
import { mensajeError } from '../utils/errores'
import {
  compromisosDelMes,
  deudaTarjeta,
  disponibleTarjeta,
  mensualidadesMsiTarjeta,
  planesActivos,
  proximaFecha,
  textoProximaFecha,
  TIPO_DEUDA_TEXTO,
  totalDeuda,
  utilizacion,
  utilizacionTotal,
} from '../utils/finanzas'
import { formatMoney } from '../utils/formatMoney'
import '../components/Button.css'
import './Finanzas.css'

/** Ordena por la próxima fecha de pago; las que no tienen fecha van al final. */
function porFechaDePago<T>(elementos: T[], dia: (e: T) => number | null): T[] {
  const clave = (e: T) => {
    const d = dia(e)
    return d === null ? Number.POSITIVE_INFINITY : proximaFecha(d).getTime()
  }
  return [...elementos].sort((a, b) => clave(a) - clave(b))
}

function TarjetaResumen({ tarjeta }: { tarjeta: Tarjeta }) {
  const msi = planesActivos(tarjeta)
  return (
    <Link to={`/tarjetas/${tarjeta.id}`} className="ficha ficha--enlace">
      <div className="ficha__titulo">
        <span className="ficha__nombre">{tarjeta.nombre}</span>
        <span className="ficha__detalle">
          {tarjeta.banco}
          {tarjeta.ultimos_4 && ` · terminación ${tarjeta.ultimos_4}`}
        </span>
      </div>
      <dl className="datos">
        <div className="datos__fila">
          <dt>Debes</dt>
          <dd>{formatMoney(deudaTarjeta(tarjeta))}</dd>
        </div>
        <div className="datos__fila">
          <dt>Disponible</dt>
          <dd>
            {formatMoney(disponibleTarjeta(tarjeta))}
            <span className="datos__nota">de {formatMoney(tarjeta.limite_credito)}</span>
          </dd>
        </div>
        <div className="datos__fila">
          <dt>Próximo pago</dt>
          <dd>{textoProximaFecha(tarjeta.dia_pago)}</dd>
        </div>
        {msi.length > 0 && (
          <div className="datos__fila">
            <dt>Compras a MSI</dt>
            <dd>
              {msi.length} {msi.length === 1 ? 'activa' : 'activas'}
              <span className="datos__nota">{formatMoney(mensualidadesMsiTarjeta(tarjeta))} al mes</span>
            </dd>
          </div>
        )}
      </dl>
      <BarraUso proporcion={utilizacion(tarjeta)} />
    </Link>
  )
}

function DeudaResumen({ deuda, onEliminar }: { deuda: Deuda; onEliminar: () => void }) {
  return (
    <div className="ficha">
      <div className="ficha__titulo">
        <span className="ficha__nombre">{deuda.nombre}</span>
        <span className="ficha__detalle">
          {TIPO_DEUDA_TEXTO[deuda.tipo]}
          {deuda.acreedor && ` · ${deuda.acreedor}`}
        </span>
      </div>
      {deuda.estatus === 'liquidada' && (
        <span className="etiqueta-estado">
          <Icon nombre="sano" tamano={16} />
          Liquidada
        </span>
      )}
      <dl className="datos">
        <div className="datos__fila">
          <dt>Saldo pendiente</dt>
          <dd>{formatMoney(deuda.saldo_actual)}</dd>
        </div>
        {deuda.pago_mensual !== null && (
          <div className="datos__fila">
            <dt>Pago mensual</dt>
            <dd>{formatMoney(deuda.pago_mensual)}</dd>
          </div>
        )}
        <div className="datos__fila">
          <dt>Tasa anual</dt>
          <dd>{deuda.tasa_anual === null ? 'Sin registrar' : `${deuda.tasa_anual} %`}</dd>
        </div>
        {deuda.dia_pago !== null && deuda.estatus === 'activa' && (
          <div className="datos__fila">
            <dt>Próximo pago</dt>
            <dd>{textoProximaFecha(deuda.dia_pago)}</dd>
          </div>
        )}
        {deuda.pagos_restantes !== null && (
          <div className="datos__fila">
            <dt>Pagos restantes</dt>
            <dd>{deuda.pagos_restantes}</dd>
          </div>
        )}
      </dl>
      <div className="ficha__acciones">
        <Link to={`/deudas/${deuda.id}/editar`} className="accion">
          <Icon nombre="editar" tamano={18} />
          Editar
        </Link>
        <button type="button" className="accion accion--peligro" onClick={onEliminar}>
          <Icon nombre="basura" tamano={18} />
          Eliminar
        </button>
      </div>
    </div>
  )
}

/** Lista de tarjetas y deudas con su saldo, uso del límite y próxima fecha de pago (REQ-TD-10). */
function TarjetasDeudasPage() {
  const { datos, error, cargando, recargar } = useTarjetasYDeudas()
  const aviso = (useLocation().state as { aviso?: string } | null)?.aviso
  const [porEliminar, setPorEliminar] = useState<Deuda | null>(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)

  if (cargando || !datos) return <EstadoCarga error={error} regresar={{ a: '/', texto: 'Volver al inicio' }} />

  const tarjetas = porFechaDePago(datos.tarjetas, (t) => t.dia_pago)
  const deudas = porFechaDePago(datos.deudas, (d) => (d.estatus === 'activa' ? d.dia_pago : null))
  const sinDatos = tarjetas.length === 0 && deudas.length === 0

  async function eliminarDeuda() {
    if (!porEliminar) return
    setEliminando(true)
    setErrorAccion(null)
    try {
      await finanzasService.eliminarDeuda(porEliminar.id)
      setMensaje(`Se eliminó "${porEliminar.nombre}".`)
      setPorEliminar(null)
      recargar()
    } catch (err) {
      setErrorAccion(mensajeError(err))
      setPorEliminar(null)
    } finally {
      setEliminando(false)
    }
  }

  async function usarEjemplo() {
    setErrorAccion(null)
    try {
      await cargarDatosDeEjemplo()
      recargar()
    } catch (err) {
      setErrorAccion(mensajeError(err))
    }
  }

  return (
    <div className="pagina">
      <EncabezadoPagina titulo="Tarjetas y deudas" subtitulo="Todo lo que debes, en un solo lugar." />

      {(mensaje ?? aviso) && <FormAlert tipo="sano">{mensaje ?? aviso}</FormAlert>}
      {errorAccion && <FormAlert tipo="critico">{errorAccion}</FormAlert>}

      <div className="pagina__acciones">
        <Link to="/tarjetas/nueva" className="boton boton--primario">
          <Icon nombre="mas" tamano={20} />
          Agregar tarjeta
        </Link>
        <Link to="/deudas/nueva" className="boton boton--secundario">
          <Icon nombre="mas" tamano={20} />
          Agregar otra deuda
        </Link>
        <Button variante="secundario" disabled title="Disponible en una próxima versión (T31)">
          <Icon nombre="subir" tamano={20} />
          Subir estado de cuenta
        </Button>
      </div>
      <p className="pagina__nota">Subir el estado de cuenta en PDF estará disponible pronto. Por ahora captura tus datos a mano.</p>

      {sinDatos ? (
        <section className="ficha vacio" aria-labelledby="vacio-titulo">
          <Icon nombre="tarjeta" />
          <h2 id="vacio-titulo">Aún no registras tarjetas ni deudas</h2>
          <p>
            Agrega tus tarjetas de crédito, tus compras a meses sin intereses y tus préstamos para saber cuánto debes y
            cuándo pagar.
          </p>
          {MODO_PRUEBA && (
            <Button variante="secundario" onClick={usarEjemplo}>
              Cargar datos de ejemplo
            </Button>
          )}
        </section>
      ) : (
        <section className="ficha" aria-labelledby="resumen-titulo">
          <h2 id="resumen-titulo">Resumen</h2>
          <div>
            <p className="ficha__detalle">Debes en total</p>
            <p className="monto-grande">{formatMoney(totalDeuda(tarjetas, deudas))}</p>
          </div>
          <dl className="datos">
            <div className="datos__fila">
              <dt>Pagos de este mes</dt>
              <dd>
                {formatMoney(compromisosDelMes(tarjetas, deudas))}
                <span className="datos__nota">Mínimos + mensualidades MSI + otras deudas</span>
              </dd>
            </div>
          </dl>
          {tarjetas.length > 0 && (
            <BarraUso proporcion={utilizacionTotal(tarjetas)} etiqueta="Uso de todas tus tarjetas" />
          )}
        </section>
      )}

      {!sinDatos && (
        <>
          <section className="seccion" aria-labelledby="tarjetas-titulo">
            <div className="seccion__encabezado">
              <h2 id="tarjetas-titulo">Tarjetas de crédito ({tarjetas.length})</h2>
            </div>
            {tarjetas.length === 0 ? (
              <p className="pagina__nota">No tienes tarjetas registradas.</p>
            ) : (
              <ul className="lista">
                {tarjetas.map((t) => (
                  <li key={t.id}>
                    <TarjetaResumen tarjeta={t} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="seccion" aria-labelledby="deudas-titulo">
            <div className="seccion__encabezado">
              <h2 id="deudas-titulo">Otras deudas ({deudas.length})</h2>
            </div>
            {deudas.length === 0 ? (
              <p className="pagina__nota">No tienes préstamos ni otras deudas registradas.</p>
            ) : (
              <ul className="lista">
                {deudas.map((d) => (
                  <li key={d.id}>
                    <DeudaResumen deuda={d} onEliminar={() => setPorEliminar(d)} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <ConfirmDialog
        abierto={porEliminar !== null}
        titulo="¿Eliminar esta deuda?"
        textoConfirmar="Eliminar deuda"
        procesando={eliminando}
        onConfirmar={eliminarDeuda}
        onCancelar={() => setPorEliminar(null)}
      >
        <p>
          Se eliminará <strong>{porEliminar?.nombre}</strong> y dejará de contar en tu balance y en tu score. Esta acción
          no se puede deshacer.
        </p>
      </ConfirmDialog>
    </div>
  )
}

export default TarjetasDeudasPage