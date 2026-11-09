import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import BarraUso from '../components/BarraUso'
import Button from '../components/Button'
import ConfirmDialog from '../components/ConfirmDialog'
import EncabezadoPagina from '../components/EncabezadoPagina'
import EstadoCarga from '../components/EstadoCarga'
import FormAlert from '../components/FormAlert'
import Icon from '../components/Icon'
import { useTarjeta } from '../hooks/useFinanzas'
import { finanzasService } from '../services/finanzas'
import type { PlanMsi } from '../types/finanzas'
import { mensajeError } from '../utils/errores'
import {
  deudaTarjeta,
  disponibleTarjeta,
  formatFechaIso,
  interesMensual,
  mensualidadesRestantes,
  pagoMinimo,
  pagoNoIntereses,
  saldoMsiTarjeta,
  saldoPendienteMsi,
  textoProximaFecha,
  utilizacion,
} from '../utils/finanzas'
import { formatMoney } from '../utils/formatMoney'
import '../components/Button.css'
import './Finanzas.css'

type PorEliminar = { tipo: 'tarjeta' } | { tipo: 'msi'; plan: PlanMsi } | null

function PlanMsiItem({ plan, tarjetaId, onEliminar }: { plan: PlanMsi; tarjetaId: number; onEliminar: () => void }) {
  const restantes = mensualidadesRestantes(plan)
  const avance = (plan.mensualidades_pagadas / plan.num_mensualidades) * 100
  const liquidado = plan.estatus !== 'activo' || restantes === 0

  return (
    <div className="ficha">
      <div className="ficha__titulo">
        <span className="ficha__nombre">{plan.descripcion}</span>
        <span className="ficha__detalle">Compra del {formatFechaIso(plan.fecha_compra)}</span>
      </div>
      {liquidado && (
        <span className="etiqueta-estado">
          <Icon nombre="sano" tamano={16} />
          Liquidada
        </span>
      )}
      <dl className="datos">
        <div className="datos__fila">
          <dt>Mensualidad</dt>
          <dd>
            {formatMoney(plan.monto_mensualidad)}
            <span className="datos__nota">de un total de {formatMoney(plan.monto_original)}</span>
          </dd>
        </div>
        <div className="datos__fila">
          <dt>Pagadas</dt>
          <dd>
            {plan.mensualidades_pagadas} de {plan.num_mensualidades}
          </dd>
        </div>
        {!liquidado && (
          <div className="datos__fila">
            <dt>Te falta pagar</dt>
            <dd>
              {formatMoney(saldoPendienteMsi(plan))}
              <span className="datos__nota">
                {restantes} {restantes === 1 ? 'mensualidad' : 'mensualidades'}
              </span>
            </dd>
          </div>
        )}
      </dl>
      <div className="avance" aria-hidden="true">
        <div className="avance__relleno" style={{ width: `${avance}%` }} />
      </div>
      <div className="ficha__acciones">
        <Link to={`/tarjetas/${tarjetaId}/msi/${plan.id}/editar`} className="accion">
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

/** Detalle de una tarjeta: saldos, fechas, pagos y sus compras a MSI (REQ-TD-01, REQ-TD-02). */
function TarjetaDetallePage() {
  const id = Number(useParams().id)
  const navegar = useNavigate()
  const aviso = (useLocation().state as { aviso?: string } | null)?.aviso
  const { datos: tarjeta, error, cargando, recargar } = useTarjeta(id)
  const [porEliminar, setPorEliminar] = useState<PorEliminar>(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)

  if (cargando || !tarjeta) return <EstadoCarga error={error} />

  const minimo = pagoMinimo(tarjeta)
  const interes = interesMensual(tarjeta.saldo_actual, tarjeta.tasa_anual)
  const planes = [...tarjeta.planes_msi].sort((a, b) => mensualidadesRestantes(b) - mensualidadesRestantes(a))

  async function confirmarEliminacion() {
    if (!porEliminar || !tarjeta) return
    setEliminando(true)
    setErrorAccion(null)
    try {
      if (porEliminar.tipo === 'tarjeta') {
        await finanzasService.eliminarTarjeta(tarjeta.id)
        navegar('/tarjetas', { replace: true, state: { aviso: `Se eliminó la tarjeta "${tarjeta.nombre}".` } })
        return
      }
      await finanzasService.eliminarPlanMsi(porEliminar.plan.id)
      setMensaje(`Se eliminó la compra "${porEliminar.plan.descripcion}".`)
      setPorEliminar(null)
      recargar()
    } catch (err) {
      setErrorAccion(mensajeError(err))
      setPorEliminar(null)
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo={tarjeta.nombre}
        subtitulo={`${tarjeta.banco}${tarjeta.ultimos_4 ? ` · terminación ${tarjeta.ultimos_4}` : ''}`}
        regresar={{ a: '/tarjetas', texto: 'Tarjetas y deudas' }}
      />

      {(mensaje ?? aviso) && <FormAlert tipo="sano">{mensaje ?? aviso}</FormAlert>}
      {errorAccion && <FormAlert tipo="critico">{errorAccion}</FormAlert>}

      <section className="ficha" aria-labelledby="saldo-titulo">
        <h2 id="saldo-titulo">Saldo</h2>
        <div>
          <p className="ficha__detalle">Debes en esta tarjeta</p>
          <p className="monto-grande">{formatMoney(deudaTarjeta(tarjeta))}</p>
        </div>
        <dl className="datos">
          <div className="datos__fila">
            <dt>Saldo sin MSI</dt>
            <dd>{formatMoney(tarjeta.saldo_actual)}</dd>
          </div>
          <div className="datos__fila">
            <dt>Pendiente de compras a MSI</dt>
            <dd>{formatMoney(saldoMsiTarjeta(tarjeta))}</dd>
          </div>
          <div className="datos__fila">
            <dt>Límite de crédito</dt>
            <dd>{formatMoney(tarjeta.limite_credito)}</dd>
          </div>
          <div className="datos__fila">
            <dt>Disponible</dt>
            <dd>{formatMoney(disponibleTarjeta(tarjeta))}</dd>
          </div>
        </dl>
        <BarraUso proporcion={utilizacion(tarjeta)} etiqueta="Uso del límite (incluye MSI)" />
      </section>

      <section className="ficha" aria-labelledby="pagos-titulo">
        <h2 id="pagos-titulo">Fechas y pagos</h2>
        <dl className="datos">
          <div className="datos__fila">
            <dt>Fecha límite de pago</dt>
            <dd>
              {textoProximaFecha(tarjeta.dia_pago)}
              <span className="datos__nota">Día {tarjeta.dia_pago} de cada mes</span>
            </dd>
          </div>
          <div className="datos__fila">
            <dt>Fecha de corte</dt>
            <dd>
              {textoProximaFecha(tarjeta.dia_corte)}
              <span className="datos__nota">Día {tarjeta.dia_corte} de cada mes</span>
            </dd>
          </div>
          <div className="datos__fila">
            <dt>Pago para no generar intereses</dt>
            <dd>
              {formatMoney(pagoNoIntereses(tarjeta))}
              <span className="datos__nota">Saldo + mensualidades MSI del mes</span>
            </dd>
          </div>
          <div className="datos__fila">
            <dt>Pago mínimo</dt>
            <dd>
              {minimo.monto === null ? 'Sin calcular' : formatMoney(minimo.monto)}
              {minimo.estimado && (
                <span className="datos__nota">
                  {minimo.monto === null ? 'Registra la tasa para estimarlo' : 'Estimado con la regla de Banxico'}
                </span>
              )}
            </dd>
          </div>
          <div className="datos__fila">
            <dt>Tasa de interés anual</dt>
            <dd>{tarjeta.tasa_anual === null ? 'Sin registrar' : `${tarjeta.tasa_anual} %`}</dd>
          </div>
          {interes !== null && interes > 0 && (
            <div className="datos__fila">
              <dt>Intereses si no pagas el total</dt>
              <dd>
                {formatMoney(interes)} al mes
                <span className="datos__nota">Aproximado, con IVA</span>
              </dd>
            </div>
          )}
        </dl>
      </section>

      <section className="seccion" aria-labelledby="msi-titulo">
        <div className="seccion__encabezado">
          <h2 id="msi-titulo">Compras a meses sin intereses</h2>
          <Link to={`/tarjetas/${tarjeta.id}/msi/nueva`} className="boton boton--primario">
            <Icon nombre="mas" tamano={20} />
            Agregar compra a MSI
          </Link>
        </div>
        {planes.length === 0 ? (
          <p className="pagina__nota">No tienes compras a MSI en esta tarjeta.</p>
        ) : (
          <ul className="lista">
            {planes.map((p) => (
              <li key={p.id}>
                <PlanMsiItem plan={p} tarjetaId={tarjeta.id} onEliminar={() => setPorEliminar({ tipo: 'msi', plan: p })} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="pagina__acciones">
        <Link to={`/tarjetas/${tarjeta.id}/editar`} className="boton boton--secundario">
          <Icon nombre="editar" tamano={20} />
          Editar tarjeta
        </Link>
        <Button variante="destructivo" onClick={() => setPorEliminar({ tipo: 'tarjeta' })}>
          <Icon nombre="basura" tamano={20} />
          Eliminar tarjeta
        </Button>
      </div>

      <ConfirmDialog
        abierto={porEliminar !== null}
        titulo={porEliminar?.tipo === 'tarjeta' ? '¿Eliminar esta tarjeta?' : '¿Eliminar esta compra a MSI?'}
        textoConfirmar={porEliminar?.tipo === 'tarjeta' ? 'Eliminar tarjeta' : 'Eliminar compra'}
        procesando={eliminando}
        onConfirmar={confirmarEliminacion}
        onCancelar={() => setPorEliminar(null)}
      >
        {porEliminar?.tipo === 'tarjeta' ? (
          <>
            <p>
              Se eliminará <strong>{tarjeta.nombre}</strong>
              {tarjeta.planes_msi.length > 0 &&
                ` junto con sus ${tarjeta.planes_msi.length} ${tarjeta.planes_msi.length === 1 ? 'compra' : 'compras'} a MSI`}
              .
            </p>
            <p>Esta acción no se puede deshacer.</p>
          </>
        ) : (
          <p>
            Se eliminará <strong>{porEliminar?.tipo === 'msi' ? porEliminar.plan.descripcion : ''}</strong> y sus
            mensualidades dejarán de contar en tu balance. Esta acción no se puede deshacer.
          </p>
        )}
      </ConfirmDialog>
    </div>
  )
}

export default TarjetaDetallePage