import { useId, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { MesBalance } from '../types/balance'
import { mesCorto, mesLargo, pesosCompacto } from '../utils/formatMes'
import { pesos } from '../utils/pesos'
import './GraficaProyeccion.css'

interface GraficaProyeccionProps {
  /** El mes consultado seguido de los meses proyectados. */
  meses: MesBalance[]
}

// Geometría del SVG (se escala con el ancho de la pantalla gracias al viewBox).
const ANCHO = 340
const ALTO = 220
const MARGEN = { izq: 42, der: 10, arriba: 14, abajo: 28 }

const egresos = (m: MesBalance) => m.gastos_fijos + m.gastos_variables + (m.tarjetas ?? 0) + m.msi

/** Techo del eje Y con 2 a 5 divisiones "redondas" (1, 2 o 5 por potencia de 10). */
function escalaEjeY(maximo: number): { techo: number; marcas: number[] } {
  const objetivo = Math.max(maximo * 1.08, 1)
  const potencia = Math.pow(10, Math.floor(Math.log10(objetivo / 5)))
  const paso = [1, 2, 5, 10].map((f) => f * potencia).find((p) => objetivo / p <= 5) ?? potencia * 10
  const divisiones = Math.ceil(objetivo / paso)
  return { techo: paso * divisiones, marcas: Array.from({ length: divisiones + 1 }, (_, i) => i * paso) }
}

/** Barras apiladas de lo que sale cada mes (gastos fijos, variables, tarjetas y cuotas, y MSI) y línea de lo que entra. */
function GraficaProyeccion({ meses }: GraficaProyeccionProps) {
  const idPatron = `msi-${useId().replace(/:/g, '')}`
  const [elegido, setElegido] = useState(0)

  const areaAncho = ANCHO - MARGEN.izq - MARGEN.der
  const areaAlto = ALTO - MARGEN.arriba - MARGEN.abajo
  const { techo, marcas } = escalaEjeY(Math.max(...meses.flatMap((m) => [m.ingresos, egresos(m)])))

  const y = (valor: number) => MARGEN.arriba + areaAlto * (1 - valor / techo)
  const alto = (valor: number) => (areaAlto * valor) / techo
  const columna = areaAncho / meses.length
  const centro = (i: number) => MARGEN.izq + columna * (i + 0.5)
  const anchoBarra = columna * 0.56

  const detalle = meses[Math.min(elegido, meses.length - 1)]
  const puntosIngreso = meses.map((m, i) => `${centro(i)},${y(m.ingresos)}`).join(' ')

  function alTeclear(evento: KeyboardEvent<SVGRectElement>, i: number) {
    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault()
      setElegido(i)
    }
  }

  return (
    <section className="grafica" aria-labelledby="grafica-titulo">
      <h2 id="grafica-titulo" className="grafica__titulo">
        Cómo se ven tus próximos {meses.length} meses
      </h2>

      <ul className="grafica__leyenda">
        <li>
          <span className="muestra muestra--ingreso" aria-hidden="true" /> Ingresos
        </li>
        <li>
          <span className="muestra muestra--fijo" aria-hidden="true" /> Gastos fijos
        </li>
        <li>
          <span className="muestra muestra--variable" aria-hidden="true" /> Gastos variables
        </li>
        <li>
          <span className="muestra muestra--tarjetas" aria-hidden="true" /> Tarjetas y cuotas
        </li>
        <li>
          <span className="muestra muestra--msi" aria-hidden="true" /> MSI comprometido
        </li>
      </ul>

      <svg className="grafica__svg" viewBox={`0 0 ${ANCHO} ${ALTO}`} role="group" aria-label="Gráfica de proyección por mes. Toca un mes para ver su detalle.">
        <defs>
          <pattern id={idPatron} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" className="grafica__msi-fondo" />
            <rect width="3" height="6" className="grafica__msi-raya" />
          </pattern>
        </defs>

        {marcas.map((marca) => (
          <g key={marca}>
            <line className="grafica__rejilla" x1={MARGEN.izq} x2={ANCHO - MARGEN.der} y1={y(marca)} y2={y(marca)} />
            <text className="grafica__eje" x={MARGEN.izq - 6} y={y(marca)} textAnchor="end" dominantBaseline="middle">
              {pesosCompacto(marca)}
            </text>
          </g>
        ))}

        {meses.map((m, i) => {
          const base = MARGEN.arriba + areaAlto
          const hFijo = alto(m.gastos_fijos)
          const hVar = alto(m.gastos_variables)
          const hTar = alto(m.tarjetas ?? 0)
          const hMsi = alto(m.msi)
          const total = hFijo + hVar + hTar + hMsi
          const x = centro(i) - anchoBarra / 2
          const recorte = `${idPatron}-barra-${i}`
          return (
            <g key={m.mes}>
              {i === elegido && (
                <rect className="grafica__seleccion" x={centro(i) - columna / 2 + 1} y={MARGEN.arriba} width={columna - 2} height={areaAlto} rx="8" />
              )}
              <clipPath id={recorte}>
                <rect x={x} y={base - total} width={anchoBarra} height={total} rx="5" />
              </clipPath>
              <g clipPath={`url(#${recorte})`}>
                <rect className="grafica__fijo" x={x} y={base - hFijo} width={anchoBarra} height={hFijo} />
                <rect className="grafica__variable" x={x} y={base - hFijo - hVar} width={anchoBarra} height={hVar} />
                <rect className="grafica__tarjetas" x={x} y={base - hFijo - hVar - hTar} width={anchoBarra} height={hTar} />
                <rect className="grafica__msi" x={x} y={base - total} width={anchoBarra} height={hMsi} fill={`url(#${idPatron})`} />
              </g>
              <text
                className={`grafica__mes ${i === elegido ? 'grafica__mes--elegido' : ''} ${m.libre < 0 ? 'grafica__mes--negativo' : ''}`}
                x={centro(i)}
                y={ALTO - 9}
                textAnchor="middle"
              >
                {mesCorto(m.mes)}
              </text>
            </g>
          )
        })}

        <polyline className="grafica__linea" points={puntosIngreso} fill="none" />
        {meses.map((m, i) => (
          <circle key={m.mes} className="grafica__punto" cx={centro(i)} cy={y(m.ingresos)} r="3.5" />
        ))}

        {/* Zonas táctiles: una por mes, accesibles con teclado. */}
        {meses.map((m, i) => (
          <rect
            key={`zona-${m.mes}`}
            className="grafica__zona"
            x={centro(i) - columna / 2}
            y={0}
            width={columna}
            height={ALTO}
            role="button"
            tabIndex={0}
            aria-pressed={i === elegido}
            aria-label={`${mesLargo(m.mes)}: ingresos ${pesos(m.ingresos)}, egresos ${pesos(egresos(m))}, ${m.libre < 0 ? 'faltan' : 'libre'} ${pesos(Math.abs(m.libre))}`}
            onClick={() => setElegido(i)}
            onKeyDown={(e) => alTeclear(e, i)}
          />
        ))}
      </svg>

      <div className="grafica__detalle" aria-live="polite">
        <h3 className="grafica__detalle-titulo">{mesLargo(detalle.mes)}</h3>
        <dl className="grafica__filas">
          <div>
            <dt>
              <span className="muestra muestra--ingreso" aria-hidden="true" /> Ingresos
            </dt>
            <dd>{pesos(detalle.ingresos)}</dd>
          </div>
          <div>
            <dt>
              <span className="muestra muestra--fijo" aria-hidden="true" /> Gastos fijos
            </dt>
            <dd>{pesos(detalle.gastos_fijos)}</dd>
          </div>
          {detalle.gastos_variables > 0 && (
            <div>
              <dt>
                <span className="muestra muestra--variable" aria-hidden="true" /> Gastos variables
              </dt>
              <dd>{pesos(detalle.gastos_variables)}</dd>
            </div>
          )}
          {(detalle.tarjetas ?? 0) > 0 && (
            <div>
              <dt>
                <span className="muestra muestra--tarjetas" aria-hidden="true" /> Tarjetas y cuotas
              </dt>
              <dd>{pesos(detalle.tarjetas ?? 0)}</dd>
            </div>
          )}
          <div>
            <dt>
              <span className="muestra muestra--msi" aria-hidden="true" /> MSI comprometido
            </dt>
            <dd>{pesos(detalle.msi)}</dd>
          </div>
          <div className="grafica__total">
            <dt>{detalle.libre < 0 ? 'Faltan' : 'Libre'}</dt>
            <dd className={detalle.libre < 0 ? 'grafica__negativo' : 'grafica__positivo'}>{pesos(Math.abs(detalle.libre))}</dd>
          </div>
        </dl>
      </div>

      <p className="grafica__nota">
        La proyección suma tus ingresos, tus gastos, los pagos mínimos de tus tarjetas y las mensualidades de MSI.
        Son estimaciones: los intereses se calculan sobre el saldo al corte.
      </p>
    </section>
  )
}

export default GraficaProyeccion
