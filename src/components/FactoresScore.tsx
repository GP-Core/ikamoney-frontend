import { Link } from 'react-router'
import type { Termino } from '../content/glosario'
import type { ClaveFactor, FactorScore } from '../types/score'
import type { NivelSemaforo } from '../utils/ranking'
import {
  calificacionDe,
  consejoDe,
  ETIQUETA_CALIFICACION,
  numero,
  ordenarFactores,
  TEXTO_SUPUESTO_PAGO,
  type Calificacion,
} from '../utils/score'
import { sinCodigosInternos } from '../utils/texto'
import AyudaTermino from './AyudaTermino'
import IconoSemaforo from './IconoSemaforo'
import './Desplegable.css'
import './ScoreDesglose.css'
import './Semaforo.css'

interface FactoresScoreProps {
  factores: FactorScore[]
  ordenMejora: ClaveFactor[]
  /** Factor cuya sugerencia ya se muestra arriba, para no repetirla. */
  claveDestacada?: ClaveFactor | null
  /** true si el comportamiento de pago no se pudo medir. */
  pagoSupuesto: boolean
}

const TERMINO: Record<ClaveFactor, Termino> = {
  relacion_deuda_ingreso: 'relacionDeudaIngreso',
  utilizacion_credito: 'usoLimite',
  flujo_libre: 'flujoLibre',
  carga_msi: 'cargaMsi',
  comportamiento_pago: 'comportamientoPago',
}

/** Supuesto y "no aplica" van sin semáforo: no se están midiendo. */
const SEMAFORO: Record<Calificacion, NivelSemaforo | null> = {
  bien: 'sano',
  mejorar: 'precaucion',
  baja: 'riesgo',
  supuesto: null,
  omitido: null,
}

/**
 * Lista de factores. Cada uno dice cómo va (color, forma y texto) y cuántos puntos aporta de los
 * que podría aportar.
 */
function FactoresScore({ factores, ordenMejora, claveDestacada, pagoSupuesto }: FactoresScoreProps) {
  const ordenados = ordenarFactores(factores, ordenMejora, pagoSupuesto)
  const pesoMaximo = Math.max(...factores.map((f) => f.peso_efectivo), 1)

  return (
    <section className="factores" aria-labelledby="factores-titulo">
      <h2 id="factores-titulo" className="factores__titulo">
        Qué pesa en tu score
      </h2>
      <p className="factores__ayuda">
        Ordenados por los puntos que puedes ganar. La barra completa es lo máximo que aporta cada factor.
      </p>

      <ol className="factores__lista">
        {ordenados.map((f) => {
          const calificacion = calificacionDe(f, pagoSupuesto)
          const semaforo = SEMAFORO[calificacion]
          const omitido = calificacion === 'omitido'
          const supuesto = calificacion === 'supuesto'
          const ancho = (f.peso_efectivo / pesoMaximo) * 100
          const llenado = f.peso_efectivo > 0 ? (f.aporte / f.peso_efectivo) * 100 : 0
          return (
            <li key={f.clave} className={`factor factor--${calificacion}`}>
              <div className="factor__cabeza">
                <h3 className="factor__nombre">
                  <AyudaTermino termino={TERMINO[f.clave]}>{f.nombre}</AyudaTermino>
                </h3>
                <span className={semaforo ? `semaforo semaforo--${semaforo}` : 'semaforo semaforo--neutro'}>
                  {semaforo && <IconoSemaforo nivel={semaforo} />}
                  {ETIQUETA_CALIFICACION[calificacion]}
                </span>
              </div>

              <p className="factor__texto">{supuesto ? TEXTO_SUPUESTO_PAGO : sinCodigosInternos(f.explicacion)}</p>
              {supuesto && (
                <Link className="factor__enlace" to="/cuentas">
                  Registra tus pagos para que cuente
                </Link>
              )}

              {!omitido && (
                <p className="factor__puntos">
                  <strong>{numero(f.aporte)}</strong> de {numero(f.peso_efectivo)} puntos
                </p>
              )}

              {!omitido && !supuesto && (
                <div
                  className="factor__barra"
                  role="img"
                  aria-label={`${f.nombre}: aporta ${numero(f.aporte)} de ${numero(f.peso_efectivo)} puntos posibles`}
                >
                  <span className="factor__peso" style={{ width: `${ancho}%` }}>
                    <span className="factor__relleno" style={{ width: `${llenado}%` }} />
                  </span>
                </div>
              )}

              {!omitido && !supuesto && f.puntos_perdidos >= 1 && f.clave !== claveDestacada && (
                <p className="factor__sugerencia">
                  <strong>Qué puede ayudar:</strong> {consejoDe(f)}
                </p>
              )}

              <details className="desplegable">
                <summary>Cómo se calcula</summary>
                <p>
                  <strong>Fórmula:</strong> {sinCodigosInternos(f.formula)}
                </p>
                <p>
                  <strong>Peso en tu score:</strong> {numero(f.peso)} %
                  {!omitido && f.peso_efectivo !== f.peso && ` (hoy cuenta como ${numero(f.peso_efectivo)} %)`}
                </p>
                <p>
                  <strong>Por qué pesa eso:</strong> {sinCodigosInternos(f.justificacion_peso)}
                </p>
              </details>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export default FactoresScore
