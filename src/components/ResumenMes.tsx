import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as PunteroEvento } from 'react'
import { useContador } from '../hooks/useContador'
import type { MesBalance } from '../types/balance'
import { estadoDelMes, EXPLICACION_ARCO, partesDelAnillo } from '../utils/balanceVista'
import type { ClaveArco, MomentoMes } from '../utils/balanceVista'
import { mesNombre } from '../utils/formatMes'
import { pesos } from '../utils/pesos'
import Icon from './Icon'
import './ResumenMes.css'

interface ResumenMesProps {
  datos: MesBalance
  momento: MomentoMes
  /** Los gastos variables son el promedio de los últimos 3 meses. */
  variablesEstimadas?: boolean
}

const ICONO_TONO = { bien: 'sano', justo: 'precaucion', mal: 'critico' } as const

// Geometría del anillo (viewBox 200 × 200).
const RADIO = 82
const CIRCUNFERENCIA = 2 * Math.PI * RADIO
const SEPARACION = 2.5

/**
 * Resumen del mes: el anillo reparte el ingreso entre gastos fijos, variables, MSI, tarjetas y lo que
 * queda libre. Al tocar una parte (o su ficha) el centro dice cuánto es y abajo se explica.
 */
function ResumenMes({ datos, momento, variablesEstimadas = false }: ResumenMesProps) {
  const { ingresos, gastos_fijos, gastos_variables, msi, libre, tarjetas = 0 } = datos
  const negativo = libre < 0
  const estado = estadoDelMes(libre, ingresos, momento)
  const futuro = momento === 'proyeccion'
  const mesEnTexto = mesNombre(datos.mes).toLowerCase()
  const etiqueta = negativo
    ? `${futuro ? 'Te faltarían' : 'Te faltan'} en ${mesEnTexto}`
    : futuro
      ? 'Te quedaría libre'
      : 'Te queda libre'
  const cifra = useContador(Math.abs(libre))

  const partes = partesDelAnillo(datos)
  // Base del anillo: lo mayor entre lo que entra y lo que sale, para que nunca pase de una vuelta.
  const base = Math.max(ingresos, gastos_fijos + gastos_variables + tarjetas + msi, 1)

  // `fijada` es la que se tocó; `vista`, la que está bajo el mouse (tiene preferencia mientras dura).
  const [fijada, setFijada] = useState<ClaveArco | null>(null)
  const [vista, setVista] = useState<ClaveArco | null>(null)
  const elegida = partes.find((p) => p.clave === (vista ?? fijada))
  const contenedor = useRef<HTMLElement>(null)

  const soltar = () => {
    setFijada(null)
    setVista(null)
  }
  const alternar = (clave: ClaveArco) => {
    if (fijada === clave) soltar()
    else setFijada(clave)
  }
  const alEntrar = (clave: ClaveArco) => (e: PunteroEvento) => {
    if (e.pointerType === 'mouse') setVista(clave)
  }

  // Con una parte elegida, tocar fuera del resumen o pulsar Esc vuelve al total.
  useEffect(() => {
    if (!fijada) return
    const alTocar = (e: PointerEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) setFijada(null)
    }
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && setFijada(null)
    document.addEventListener('pointerdown', alTocar)
    document.addEventListener('keydown', alTeclear)
    return () => {
      document.removeEventListener('pointerdown', alTocar)
      document.removeEventListener('keydown', alTeclear)
    }
  }, [fijada])

  const visibles = partes.filter((p) => p.valor > 0)
  const arcos = visibles.map((p, i) => {
    // Cada arco empieza donde terminan los anteriores.
    const antes = (visibles.slice(0, i).reduce((suma, x) => suma + x.valor, 0) / base) * CIRCUNFERENCIA
    const largo = Math.max((p.valor / base) * CIRCUNFERENCIA - SEPARACION, 0.5)
    return { ...p, largo, desfase: -(antes + SEPARACION / 2), retraso: i * 90 }
  })

  const descripcion =
    `Del ingreso de ${pesos(ingresos)}: ${pesos(gastos_fijos)} en gastos fijos, ` +
    `${pesos(gastos_variables)} en gastos variables, ${pesos(tarjetas)} en tarjetas y cuotas, ` +
    `${pesos(msi)} en MSI` +
    (negativo ? `; faltan ${pesos(-libre)}.` : ` y ${pesos(libre)} libres.`)

  return (
    <section ref={contenedor} className={`resumen resumen--${estado.tono}`} aria-labelledby="resumen-titulo">
      <p className="resumen__estado">
        <Icon nombre={ICONO_TONO[estado.tono]} tamano={16} />
        {estado.texto}
      </p>
      {futuro && (
        <p className="resumen__nota">
          <Icon nombre="info" tamano={18} />
          Es una estimación con lo que tienes registrado hoy. Puede cambiar con tus ingresos y gastos reales.
        </p>
      )}

      <div className="resumen__anillo">
        <svg viewBox="0 0 200 200" role="img" aria-label={descripcion}>
          <circle className="resumen__pista" cx="100" cy="100" r={RADIO} />
          <g transform="rotate(-90 100 100)">
            {arcos.map((a) => (
              <circle
                key={a.clave}
                className={`resumen__arco resumen__arco--${a.clave}${
                  elegida ? (elegida.clave === a.clave ? ' resumen__arco--elegido' : ' resumen__arco--apagado') : ''
                }`}
                cx="100"
                cy="100"
                r={RADIO}
                strokeDasharray={`${a.largo} ${CIRCUNFERENCIA - a.largo}`}
                strokeDashoffset={a.desfase}
                style={{ '--circunferencia': CIRCUNFERENCIA, animationDelay: `${a.retraso}ms` } as CSSProperties}
                // Con teclado se usan las fichas de abajo; el arco es el atajo con dedo o mouse.
                onClick={() => alternar(a.clave)}
                onPointerEnter={alEntrar(a.clave)}
                onPointerLeave={() => setVista(null)}
              />
            ))}
          </g>
        </svg>

        <div className="resumen__centro">
          <h2 id="resumen-titulo" className="resumen__etiqueta">
            {elegida ? elegida.nombre : etiqueta}
          </h2>
          <p className="resumen__cifra">{pesos(elegida ? elegida.valor : cifra)}</p>
          <p className="resumen__de">
            {elegida
              ? elegida.delIngreso !== null && `${elegida.delIngreso} % de tu ingreso`
              : `de ${pesos(ingresos)} ${futuro ? 'que esperas recibir' : 'que ganas'}`}
          </p>
          {fijada && (
            <button type="button" className="resumen__total" onClick={soltar}>
              Ver total
            </button>
          )}
        </div>
      </div>

      <div aria-live="polite">
        {elegida && (
          <p className="resumen__explicacion">
            {EXPLICACION_ARCO[elegida.clave]}
            {elegida.clave === 'variable' && futuro && variablesEstimadas && ' Es el promedio de tus últimos 3 meses.'}
          </p>
        )}
      </div>

      <ul className="resumen__desglose">
        {partes.map((p) => (
          <li key={p.clave}>
            <button
              type="button"
              className={elegida?.clave === p.clave ? 'resumen__parte resumen__parte--elegida' : 'resumen__parte'}
              aria-pressed={fijada === p.clave}
              onClick={() => alternar(p.clave)}
            >
              <span className={`resumen__punto resumen__punto--${p.clave}`} aria-hidden="true" />
              <span className="resumen__nombre">{p.nombre}</span>
              <span className="resumen__monto">{pesos(p.valor)}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="resumen__pista-toque">Toca una parte del anillo para saber qué es.</p>
    </section>
  )
}

export default ResumenMes
