import { Link } from 'react-router'
import type { ScoreResponse } from '../types/score'
import './TarjetasInicio.css'

/** El score en una línea: número, nivel y entrada al desglose. */
function MosaicoScore({ score }: { score: ScoreResponse }) {
  const calculado = score.estado === 'calculado' && score.puntaje !== null

  return (
    <Link to="/score" className={`mosaico mosaico--${score.nivel ?? 'sin-nivel'}`}>
      <h2 className="mosaico__titulo">Tu score</h2>
      {calculado ? (
        <>
          <p className="mosaico__cifra">
            {score.puntaje}
            <span> de 100</span>
          </p>
          <p className={`mosaico__nivel mosaico__nivel--${score.nivel}`}>{score.nivel_texto}</p>
          <span className="mosaico__enlace">Ver detalle</span>
        </>
      ) : (
        <>
          <p className="mosaico__texto">Faltan datos para calcularlo.</p>
          <span className="mosaico__enlace">Ver qué falta</span>
        </>
      )}
    </Link>
  )
}

export default MosaicoScore
