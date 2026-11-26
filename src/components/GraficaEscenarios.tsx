import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { EscenarioSimulacion } from '../types/simulador'
import { mesCorto, mesLargo, pesosCompacto } from '../utils/formatMes'
import { pesos } from '../utils/pesos'
import { mesMasJusto, nombreCorto, TONO_VEREDICTO } from '../utils/simulador'
import { coloresPorFormaDePago } from '../utils/simuladorVista'
import './GraficaEscenarios.css'

interface GraficaEscenariosProps {
  /** Solo los que aplican. */
  escenarios: EscenarioSimulacion[]
  menorImpacto: string | null
  /** La forma de pago que el usuario eligió; sin elegir, se resalta la de menor impacto. */
  elegido: string | null
}

const ANCHO = 360
const ALTO = 210
const MARGEN = { izq: 30, der: 96, arriba: 12, abajo: 26 }
const MESES_CORTOS = 6
const SEPARACION_ETIQUETAS = 13

/** Separa las etiquetas del extremo derecho para que no se encimen, conservando su orden. */
function separar(posiciones: { id: string; y: number }[], minimo: number, maximo: number) {
  const orden = [...posiciones].sort((a, b) => a.y - b.y)
  orden.forEach((p, i) => {
    p.y = Math.max(p.y, i === 0 ? minimo : orden[i - 1].y + SEPARACION_ETIQUETAS)
  })
  for (let i = orden.length - 1; i >= 0; i--) {
    const tope = i === orden.length - 1 ? maximo : orden[i + 1].y - SEPARACION_ETIQUETAS
    orden[i].y = Math.min(orden[i].y, tope)
  }
  return new Map(orden.map((p) => [p.id, p.y]))
}

/**
 * Una línea por forma de pago con el dinero disponible mes a mes. La línea de $0 es la referencia:
 * lo que cae debajo no alcanza. Sin ejes ni leyenda: cada línea lleva su nombre y su cifra al final.
 */
function GraficaEscenarios({ escenarios, menorImpacto, elegido }: GraficaEscenariosProps) {
  const resaltado = elegido ?? menorImpacto
  const horizonte = Math.max(...escenarios.map((e) => e.balance.length))
  const [verTodo, setVerTodo] = useState(false)
  const hayVentana = horizonte > MESES_CORTOS
  const meses = hayVentana && !verTodo ? MESES_CORTOS : horizonte

  const colores = coloresPorFormaDePago(escenarios)
  const series = escenarios.map((e) => ({ e, puntos: e.balance.slice(0, meses) }))
  const valores = series.flatMap((s) => s.puntos.map((p) => p.acumulado))
  const maximo = Math.max(...valores, 0)
  const minimo = Math.min(...valores, 0)
  const rango = Math.max(maximo - minimo, 1)
  // Siempre queda una franja bajo $0, aunque nada caiga ahí: es la referencia.
  const piso = minimo - rango * 0.12
  const techo = maximo + rango * 0.04

  const areaAncho = ANCHO - MARGEN.izq - MARGEN.der
  const areaAlto = ALTO - MARGEN.arriba - MARGEN.abajo
  const x = (i: number) => MARGEN.izq + (meses === 1 ? areaAncho / 2 : (areaAncho * i) / (meses - 1))
  const y = (v: number) => MARGEN.arriba + areaAlto * (1 - (v - piso) / (techo - piso))

  const etiquetas = separar(
    series.map(({ e, puntos }) => ({ id: e.id, y: y(puntos[puntos.length - 1].acumulado) })),
    MARGEN.arriba + 5,
    MARGEN.arriba + areaAlto,
  )
  // La resaltada se dibuja al final, para que quede encima.
  const orden = [...series].sort((a, b) => Number(a.e.id === resaltado) - Number(b.e.id === resaltado))
  const paso = meses > 8 ? 3 : 1
  const periodos = escenarios[0].balance.slice(0, meses).map((m) => m.periodo)

  return (
    <section className="ge" aria-labelledby="ge-titulo">
      <div className="ge__encabezado">
        <h2 id="ge-titulo" className="sim-titulo">
          Cuánto te queda disponible
        </h2>
        {hayVentana && (
          <div className="ge__ventana" role="group" aria-label="Meses a mostrar">
            <button type="button" aria-pressed={!verTodo} onClick={() => setVerTodo(false)}>
              {MESES_CORTOS} meses
            </button>
            <button type="button" aria-pressed={verTodo} onClick={() => setVerTodo(true)}>
              {horizonte} meses
            </button>
          </div>
        )}
      </div>
      <p className="ge__ayuda">Azul es contado y violeta, meses sin intereses. Por debajo de $0 el dinero no alcanza.</p>

      <svg className="ge__svg" viewBox={`0 0 ${ANCHO} ${ALTO}`} role="img" aria-labelledby="ge-resumen">
        <title id="ge-resumen">
          {`Dinero disponible mes a mes con cada forma de pago, de ${mesLargo(periodos[0])} a ${mesLargo(periodos[periodos.length - 1])}. ${series
            .map(({ e, puntos }) => `${nombreCorto(e)}: ${pesos(puntos[puntos.length - 1].acumulado)} al final`)
            .join('. ')}.`}
        </title>

        <rect className="ge__bajo-cero" x={MARGEN.izq} y={y(0)} width={areaAncho} height={Math.max(y(piso) - y(0), 0)} />
        <line className="ge__cero" x1={MARGEN.izq} x2={MARGEN.izq + areaAncho} y1={y(0)} y2={y(0)} />
        <text className="ge__texto ge__texto--cero" x={MARGEN.izq - 5} y={y(0)} textAnchor="end" dominantBaseline="middle">
          $0
        </text>

        {periodos.map((p, i) =>
          i % paso === 0 || i === meses - 1 ? (
            <text key={p} className="ge__texto" x={x(i)} y={ALTO - 8} textAnchor="middle">
              {mesCorto(p)}
            </text>
          ) : null,
        )}

        {orden.map(({ e, puntos }) => {
          const tono = TONO_VEREDICTO[e.veredicto ?? 'con_precaucion']
          const sugerida = e.id === resaltado
          const justo = mesMasJusto({ ...e, balance: puntos })
          const iJusto = puntos.findIndex((p) => p.periodo === justo?.periodo)
          const ultimo = puntos.length - 1
          const yEtiqueta = etiquetas.get(e.id) ?? y(puntos[ultimo].acumulado)
          return (
            <g
              key={e.id}
              className={`ge__serie ge__serie--${tono} ${sugerida ? 'ge__serie--sugerida' : ''}`}
              style={{ '--serie': colores.get(e.id) } as CSSProperties}
            >
              <polyline points={puntos.map((p, i) => `${x(i)},${y(p.acumulado)}`).join(' ')} fill="none" />
              {justo && iJusto >= 0 && <circle cx={x(iJusto)} cy={y(justo.acumulado)} r={justo.acumulado < 0 ? 4.5 : 3} />}
              <line className="ge__guia" x1={x(ultimo)} y1={y(puntos[ultimo].acumulado)} x2={ANCHO - MARGEN.der + 4} y2={yEtiqueta} />
              <text className="ge__etiqueta" x={ANCHO - MARGEN.der + 7} y={yEtiqueta} dominantBaseline="middle">
                {nombreCorto(e)} <tspan className="ge__cifra">{pesosCompacto(puntos[ultimo].acumulado)}</tspan>
              </text>
            </g>
          )
        })}
      </svg>

      <p className="ge__nota">El punto marca el mes más justo; su color dice qué tan bien queda.</p>

      {/* Lo mismo que la gráfica, en tabla, para lectores de pantalla. */}
      <div className="ge__tabla">
        <table>
        <caption>Dinero disponible por mes</caption>
        <thead>
          <tr>
            <th scope="col">Mes</th>
            {series.map(({ e }) => (
              <th key={e.id} scope="col">
                {nombreCorto(e)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periodos.map((p, i) => (
            <tr key={p}>
              <th scope="row">{mesLargo(p)}</th>
              {series.map(({ e, puntos }) => (
                <td key={e.id}>{pesos(puntos[i].acumulado)}</td>
              ))}
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </section>
  )
}

export default GraficaEscenarios
