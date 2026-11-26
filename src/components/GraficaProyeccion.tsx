import { useId, useState } from 'react'
import { Link } from 'react-router'
import type { KeyboardEvent } from 'react'
import { useEsEscritorio } from '../hooks/useEsEscritorio'
import type { MesBalance } from '../types/balance'
import {
  cambioEntreMeses,
  desgloseDelMes,
  fraseDeMeses,
  HORIZONTES,
  mesesEnNegativo,
  momentoDelMes,
} from '../utils/balanceVista'
import type { CambioMes, Horizonte } from '../utils/balanceVista'
import { mesCorto, mesLargo, mesNombre, pesosCompacto } from '../utils/formatMes'
import { pesos } from '../utils/pesos'
import AyudaTermino from './AyudaTermino'
import './GraficaProyeccion.css'

interface GraficaProyeccionProps {
  /** El mes consultado seguido de los meses proyectados. */
  meses: MesBalance[]
  /** Mes en curso (AAAA-MM): lo posterior es proyección. */
  mesDeHoy: string
  horizonte: Horizonte
  onHorizonte: (h: Horizonte) => void
  /** Dinero que hay hoy en las cuentas; sin él no se explica el dinero al cierre. */
  ahorroInicial?: number
  variablesEstimadas?: boolean
}

// Geometría del SVG (se escala con el ancho de la pantalla gracias al viewBox). En escritorio el
// lienzo es más ancho para que los textos no se agranden al ocupar toda la columna.
const ANCHO_CELULAR = 340
const ANCHO_ESCRITORIO = 560
const ANCHO_POR_MES = 40 // con 12 meses la gráfica crece y se desplaza, para que se lea el "Faltan" de cada mes
const ALTO = 232
const MARGEN = { izq: 42, der: 10, arriba: 24, abajo: 40 }

const egresos = (m: MesBalance) => m.gastos_fijos + m.gastos_variables + (m.tarjetas ?? 0) + m.msi

/** Techo del eje Y con 2 a 5 divisiones "redondas" (1, 2 o 5 por potencia de 10). */
function escalaEjeY(maximo: number): { techo: number; marcas: number[] } {
  const objetivo = Math.max(maximo * 1.08, 1)
  const potencia = Math.pow(10, Math.floor(Math.log10(objetivo / 5)))
  const paso = [1, 2, 5, 10].map((f) => f * potencia).find((p) => objetivo / p <= 5) ?? potencia * 10
  const divisiones = Math.ceil(objetivo / paso)
  return { techo: paso * divisiones, marcas: Array.from({ length: divisiones + 1 }, (_, i) => i * paso) }
}

/** "+$376.00 ↑", "−$1,200.00 ↓" o "Sin cambio": el signo y la flecha no dependen del color. */
function textoCambio({ libre }: CambioMes): string {
  if (Math.abs(libre) < 1) return 'Sin cambio'
  return libre > 0 ? `+${pesos(libre)} ↑` : `−${pesos(-libre)} ↓`
}

/** Barras apiladas de lo que sale cada mes (gastos fijos, variables, tarjetas y cuotas, y MSI) y línea de lo que entra. */
function GraficaProyeccion({
  meses,
  mesDeHoy,
  horizonte,
  onHorizonte,
  ahorroInicial,
  variablesEstimadas = false,
}: GraficaProyeccionProps) {
  const idPatron = `msi-${useId().replace(/:/g, '')}`
  const [elegido, setElegido] = useState(0)
  const ANCHO_BASE = useEsEscritorio() ? ANCHO_ESCRITORIO : ANCHO_CELULAR
  const esProyeccion = (m: MesBalance) => momentoDelMes(m.mes, mesDeHoy) === 'proyeccion'
  const primeroProyectado = meses.findIndex(esProyeccion)

  const ANCHO = Math.max(ANCHO_BASE, MARGEN.izq + MARGEN.der + meses.length * ANCHO_POR_MES)
  const areaAncho = ANCHO - MARGEN.izq - MARGEN.der
  const areaAlto = ALTO - MARGEN.arriba - MARGEN.abajo
  const { techo, marcas } = escalaEjeY(Math.max(...meses.flatMap((m) => [m.ingresos, egresos(m)])))

  const y = (valor: number) => MARGEN.arriba + areaAlto * (1 - valor / techo)
  const alto = (valor: number) => (areaAlto * valor) / techo
  const columna = areaAncho / meses.length
  const centro = (i: number) => MARGEN.izq + columna * (i + 0.5)
  const anchoBarra = columna * 0.56

  const indiceDetalle = Math.min(elegido, meses.length - 1)
  const detalle = meses[indiceDetalle]
  const anterior = indiceDetalle > 0 ? meses[indiceDetalle - 1] : null
  const cambio = anterior ? cambioEntreMeses(anterior, detalle) : null
  const cuenta = desgloseDelMes(detalle, ahorroInicial)
  const falta = cuenta.sobra < 0
  const nombreDetalle = mesNombre(detalle.mes).toLowerCase()
  const hoyCorto = mesCorto(mesDeHoy)
  const rango = detalle.mes === mesDeHoy ? hoyCorto : `${hoyCorto} a ${mesCorto(detalle.mes)}`
  const hayNegativos = mesesEnNegativo(meses).length > 0
  const puntosIngreso = meses.map((m, i) => `${centro(i)},${y(m.ingresos)}`).join(' ')

  function alTeclear(evento: KeyboardEvent<SVGRectElement>, i: number) {
    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault()
      setElegido(i)
    }
  }

  return (
    <section className="grafica" aria-labelledby="grafica-titulo">
      <div className="grafica__cabecera">
        <h2 id="grafica-titulo" className="grafica__titulo">
          Tus próximos {meses.length} meses
        </h2>
        <fieldset className="balance__horizonte">
          <legend className="sr-only">Cuántos meses ver</legend>
          {HORIZONTES.map((h) => (
            <label key={h} className={h === horizonte ? 'balance__horizonte-opcion balance__horizonte-opcion--activa' : 'balance__horizonte-opcion'}>
              <input type="radio" name="horizonte" value={h} checked={h === horizonte} onChange={() => onHorizonte(h)} />
              {h} meses
            </label>
          ))}
        </fieldset>
      </div>

      <p className={`grafica__resumen ${hayNegativos ? 'grafica__resumen--falta' : ''}`} role="status">
        {hayNegativos && <span aria-hidden="true">⚠ </span>}
        {fraseDeMeses(meses)}
      </p>

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
          <span className="muestra muestra--msi" aria-hidden="true" /> Mensualidades MSI
        </li>
      </ul>

      <div className="grafica__scroll">
      <svg className="grafica__svg" style={{ minWidth: ANCHO > ANCHO_BASE ? ANCHO : undefined }} viewBox={`0 0 ${ANCHO} ${ALTO}`} role="group" aria-label="Gráfica de proyección por mes. Toca un mes para ver su detalle.">
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
                y={ALTO - 22}
                textAnchor="middle"
              >
                {mesCorto(m.mes)}
              </text>
              {m.libre < 0 && (
                <g className="grafica__falta">
                  <polygon points={`${centro(i) - 15},${ALTO - 6} ${centro(i) - 9},${ALTO - 6} ${centro(i) - 12},${ALTO - 13}`} />
                  <text x={centro(i) - 7} y={ALTO - 6}>Faltan</text>
                </g>
              )}
            </g>
          )
        })}

        <polyline className="grafica__linea" points={puntosIngreso} fill="none" />
        {meses.map((m, i) => (
          <circle key={m.mes} className="grafica__punto" cx={centro(i)} cy={y(m.ingresos)} r="3.5" />
        ))}

        {primeroProyectado >= 0 && (
          <g aria-hidden="true">
            {primeroProyectado > 0 && (
              <line
                className="grafica__corte"
                x1={MARGEN.izq + columna * primeroProyectado}
                x2={MARGEN.izq + columna * primeroProyectado}
                y1={4}
                y2={MARGEN.arriba + areaAlto}
              />
            )}
            <text className="grafica__corte-texto" x={MARGEN.izq + columna * primeroProyectado + 4} y={11}>
              Proyección →
            </text>
          </g>
        )}

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
            aria-label={`${mesLargo(m.mes)}${esProyeccion(m) ? ', proyección' : ''}: ingresos ${pesos(m.ingresos)}, egresos ${pesos(egresos(m))}, ${m.libre < 0 ? 'faltan' : 'libre'} ${pesos(Math.abs(m.libre))}${i > 0 ? `, ${textoCambio(cambioEntreMeses(meses[i - 1], m))} frente al mes anterior` : ''}`}
            onClick={() => setElegido(i)}
            onKeyDown={(e) => alTeclear(e, i)}
          />
        ))}
      </svg>
      </div>

      {primeroProyectado >= 0 && (
        <p className="grafica__nota">
          {primeroProyectado > 0 ? 'Los meses después de la línea' : 'Estos meses'} son estimaciones y pueden cambiar.
        </p>
      )}

      <div className="grafica__detalle" aria-live="polite">
        <h3 className="grafica__detalle-titulo">
          {mesLargo(detalle.mes)}
          <span className="grafica__momento">{esProyeccion(detalle) ? 'Proyección' : 'Este mes'}</span>
        </h3>
        <div className="grafica__columnas">
          {/* La cuenta del mes: entra, sale (y en qué) y lo que sobra. */}
          <dl className="grafica__filas">
            <div className="grafica__paso">
              <dt>
                <span className="muestra muestra--ingreso" aria-hidden="true" /> Entra
              </dt>
              <dd>{pesos(cuenta.entra)}</dd>
            </div>
            <div className="grafica__paso">
              <dt>Sale</dt>
              <dd>−{pesos(cuenta.sale)}</dd>
            </div>
            <div className="grafica__sub">
              <dt>
                <span className="muestra muestra--fijo" aria-hidden="true" /> Gastos fijos
              </dt>
              <dd>{pesos(detalle.gastos_fijos)}</dd>
            </div>
            <div className="grafica__sub">
              <dt>
                <span className="muestra muestra--variable" aria-hidden="true" /> Gastos variables
                {variablesEstimadas && esProyeccion(detalle) && <small>(promedio)</small>}
              </dt>
              <dd>{pesos(detalle.gastos_variables)}</dd>
            </div>
            <div className="grafica__sub">
              <dt>
                <span className="muestra muestra--tarjetas" aria-hidden="true" /> Tarjetas y cuotas
                <small>(pagos mínimos)</small>
              </dt>
              <dd>{pesos(detalle.tarjetas ?? 0)}</dd>
            </div>
            <div className="grafica__sub">
              <dt>
                <span className="muestra muestra--msi" aria-hidden="true" /> Mensualidades MSI
              </dt>
              <dd>{pesos(detalle.msi)}</dd>
            </div>
            <div className="grafica__total">
              <dt>
                <AyudaTermino termino="sobranteMes">
                  {falta ? 'Te falta' : 'Te sobra'} en {nombreDetalle}
                </AyudaTermino>
              </dt>
              <dd className={falta ? 'grafica__negativo' : 'grafica__positivo'}>{pesos(Math.abs(cuenta.sobra))}</dd>
            </div>
            {anterior && cambio && (
              <div className="grafica__sub">
                <dt>Frente a {mesNombre(anterior.mes).toLowerCase()}</dt>
                <dd className={cambio.libre >= 1 ? 'grafica__positivo' : cambio.libre <= -1 ? 'grafica__negativo' : undefined}>
                  {textoCambio(cambio)}
                </dd>
              </div>
            )}
            {cambio?.motivo && (
              <p className="grafica__motivo">
                {cambio.motivo === 'msi_termina'
                  ? 'Queda más libre porque termina una compra a MSI.'
                  : 'Queda menos libre porque suben tus mensualidades a MSI.'}
              </p>
            )}
          </dl>

          {cuenta.cierre !== null && cuenta.enCuentas !== null && (
            <dl className="grafica__filas grafica__filas--saldos">
              <div className="grafica__paso">
                <dt>
                  <AyudaTermino termino="dineroAlCierre">Tu dinero al cierre</AyudaTermino>
                </dt>
                <dd className={cuenta.cierre < 0 ? 'grafica__negativo' : undefined}>{pesos(cuenta.cierre)}</dd>
              </div>
              {cuenta.enCuentas > 0 ? (
                <>
                  <div className="grafica__sub">
                    <dt>En tus cuentas hoy</dt>
                    <dd>{pesos(cuenta.enCuentas)}</dd>
                  </div>
                  <div className="grafica__sub">
                    <dt>
                      {(cuenta.sobranteAcumulado ?? 0) < 0 ? '−' : '+'} lo que falta por entrar y salir ({rango})
                    </dt>
                    <dd>{pesos(Math.abs(cuenta.sobranteAcumulado ?? 0))}</dd>
                  </div>
                </>
              ) : (
                <p className="grafica__motivo">
                  Aún no registras cuentas de débito o ahorro. <Link to="/cuentas">Agrégalas</Link> para ver tu dinero
                  total.
                </p>
              )}
            </dl>
          )}
        </div>
      </div>

      <p className="grafica__nota">
        La proyección suma tus ingresos, tus gastos, los pagos mínimos de tus tarjetas y las mensualidades de MSI.
        Son estimaciones: los intereses se calculan sobre el saldo al corte.
      </p>
    </section>
  )
}

export default GraficaProyeccion
