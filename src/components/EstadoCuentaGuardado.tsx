import { Link } from 'react-router'
import type { CupoExtraccion, ResultadoGuardado } from '../types/estadoCuenta'
import { pesos } from '../utils/pesos'
import { textoLecturaUsada } from '../utils/revisionEstado'
import Button from './Button'
import Icon from './Icon'

interface EstadoCuentaGuardadoProps {
  resultado: ResultadoGuardado
  /** Se leyó con IA: se dice cuántas lecturas quedan. */
  conIa: boolean
  cupo: CupoExtraccion | null
  onOtro: () => void
}

/** Tercer paso: qué cambió al guardar. */
function EstadoCuentaGuardado({ resultado, conIa, cupo, onOtro }: EstadoCuentaGuardadoProps) {
  const { tarjetaId, tarjetaNueva, planesCreados, movimientosGuardados, saldoTarjeta, pagosDespuesDelCorte } = resultado
  return (
    <section className="estado-ficha estado-listo" role="status">
      <h2>
        <Icon nombre="sano" />
        {tarjetaNueva ? 'Tarjeta creada' : 'Tarjeta actualizada'}
      </h2>
      <dl className="estado-resumen">
        {saldoTarjeta !== undefined && (
          <div>
            <dt>Saldo que quedó</dt>
            <dd>{pesos(saldoTarjeta)}</dd>
          </div>
        )}
        <div>
          <dt>Compras a MSI guardadas</dt>
          <dd>{planesCreados}</dd>
        </div>
        <div>
          <dt>Movimientos guardados</dt>
          <dd>{movimientosGuardados}</dd>
        </div>
      </dl>
      {!!pagosDespuesDelCorte && (
        <p className="estado-nota">Descontamos tus pagos registrados después del corte ({pesos(pagosDespuesDelCorte)}).</p>
      )}
      {conIa && <p className="estado-nota">{textoLecturaUsada(cupo)}</p>}
      <div className="estado-botones">
        <Link className="boton boton--primario" to={`/tarjetas/${tarjetaId}`}>
          Ver la tarjeta
        </Link>
        <Button variante="secundario" onClick={onOtro}>
          Subir otro estado de cuenta
        </Button>
      </div>
    </section>
  )
}

export default EstadoCuentaGuardado
