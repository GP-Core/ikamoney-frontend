import { Link } from 'react-router'
import type { ProximoPagoDato } from '../utils/finanzas'
import { pesos } from '../utils/pesos'
import BotonPagar from './BotonPagar'
import Icon from './Icon'
import './ProximoPago.css'

const FECHA = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'short' })

function urgencia(dias: number) {
  const texto = dias === 0 ? 'Vence hoy' : dias === 1 ? 'Vence mañana' : dias <= 7 ? `Vence en ${dias} días` : `Faltan ${dias} días`
  if (dias <= 2) return { nivel: 'critico', icono: 'critico', texto } as const
  if (dias <= 7) return { nivel: 'precaucion', icono: 'precaucion', texto } as const
  return { nivel: 'normal', icono: 'info', texto } as const
}

/** Lo que se muestra en grande: el mínimo, o lo de no generar intereses si no hay mínimo estimado. */
function montoPrincipal(pago: ProximoPagoDato) {
  if (pago.pagado) return { etiqueta: 'Pagaste', monto: pago.pagadoMes }
  if (pago.minimo) return { etiqueta: pago.tarjetaId === null ? 'Pago' : 'Mínimo', monto: pago.minimo }
  return { etiqueta: 'Para no pagar intereses', monto: pago.sinIntereses ?? 0 }
}

interface ProximoPagoProps {
  /** Ya ordenados del más cercano al más lejano. */
  pagos: ProximoPagoDato[]
  /** Cuántos se muestran: 1 en celular, 3 en escritorio. */
  maximo: number
  /** Se registró un pago: hay que volver a pedir saldos. */
  onPagado: () => void
}

/** Cuándo toca pagar y cuánto. Sin pagos pendientes no ocupa espacio. */
function ProximoPago({ pagos, maximo, onPagado }: ProximoPagoProps) {
  if (pagos.length === 0) return null
  const visibles = pagos.slice(0, maximo)
  const restantes = pagos.length - visibles.length

  return (
    <section className={`pago pago--${pagos[0].pagado ? 'normal' : urgencia(pagos[0].dias).nivel}`} aria-labelledby="pago-titulo">
      <h2 id="pago-titulo">{visibles.length > 1 ? 'Próximos pagos' : 'Próximo pago'}</h2>

      <ul>
        {visibles.map((pago) => {
          const estado = pago.pagado
            ? ({ nivel: 'pagado', icono: 'sano', texto: 'Pagado este mes' } as const)
            : urgencia(pago.dias)
          const principal = montoPrincipal(pago)
          return (
            <li key={pago.clave}>
              <Link to={pago.ruta} className="pago__fila">
                <span className="pago__datos">
                  <strong>{pago.nombre}</strong>
                  <span className="pago__fecha">{FECHA.format(pago.fecha)}</span>
                  <span className={`pago__estado pago__estado--${estado.nivel}`}>
                    <Icon nombre={estado.icono} tamano={15} />
                    {estado.texto}
                  </span>
                </span>
                <span className="pago__montos">
                  <span>{principal.etiqueta}</span>
                  <strong>{pesos(principal.monto)}</strong>
                  {!pago.pagado && !!pago.minimo && pago.sinIntereses !== null && (
                    <span>Sin intereses: {pesos(pago.sinIntereses)}</span>
                  )}
                </span>
              </Link>
              {!pago.pagado && (
                <div className="pago__accion">
                  <BotonPagar
                    destino={{
                      ...pago.destino,
                      nombre: pago.nombre,
                      minimo: pago.minimo,
                      sinIntereses: pago.sinIntereses,
                    }}
                    onPagado={onPagado}
                  />
                </div>
              )}
            </li>
          )
        })}
      </ul>

      <Link to="/tarjetas" className="pago__todos">
        {restantes > 0 ? `Ver tarjetas y ${restantes === 1 ? '1 pago más' : `${restantes} pagos más`}` : 'Ver tarjetas y deudas'}
      </Link>
    </section>
  )
}

export default ProximoPago
