import { useHistorialScore } from '../hooks/useScore'
import type { NivelScore } from '../types/score'
import { mesLargo } from '../utils/formatMes'
import Icon from './Icon'
import type { NombreIcono } from './Icon'
import './HistorialScore.css'

/** Semáforo de T20: cada nivel lleva color, ícono con forma y su nombre escrito. */
const ESTILO: Record<NivelScore, { clase: string; icono: NombreIcono }> = {
  saludable: { clase: 'sano', icono: 'sano' },
  en_revision: { clase: 'precaucion', icono: 'precaucion' },
  en_riesgo: { clase: 'riesgo', icono: 'riesgo' },
  critico: { clase: 'critico', icono: 'critico' },
}

/** Cómo ha cambiado el score mes con mes (REQ-SF-06): el último valor de cada mes. */
function HistorialScore() {
  const { cargando, error, puntos } = useHistorialScore()

  if (error) return null
  if (cargando) return <div className="esqueleto esqueleto--grafica" aria-hidden="true" />

  return (
    <section className="historial-score" aria-labelledby="historial-score-titulo">
      <h2 id="historial-score-titulo" className="historial-score__titulo">
        Cómo ha cambiado tu score
      </h2>
      {puntos.length < 2 ? (
        <p className="historial-score__vacio">Aquí verás cómo cambia tu score mes con mes. Se guarda cada vez que actualizas tus datos.</p>
      ) : (
        <ul className="historial-score__lista">
          {puntos.map((p) => {
            const estilo = ESTILO[p.nivel]
            return (
              <li key={p.periodo} className={`historial-score__mes historial-score__mes--${estilo.clase}`}>
                <span className="historial-score__nombre">{mesLargo(p.periodo)}</span>
                <span className="historial-score__barra" aria-hidden="true">
                  <span className="historial-score__relleno" style={{ width: `${Math.min(Math.max(p.puntaje, 0), 100)}%` }} />
                </span>
                <span className="historial-score__valor">
                  <Icon nombre={estilo.icono} tamano={16} />
                  <strong>{p.puntaje}</strong> {p.nivel_texto}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default HistorialScore
