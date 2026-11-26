import { Link } from 'react-router'
import { useRanking } from '../hooks/useRanking'
import { pesos } from '../utils/pesos'
import './ScoreDesglose.css'

/**
 * Lo que el score no mide: cuánto cuestan las deudas. La cifra es la del priorizador; si no se
 * puede cargar o no hay intereses, la nota no aparece.
 */
function NotaIntereses() {
  const { data } = useRanking()
  if (!data || data.intereses_mes_total <= 0) return null

  return (
    <section className="nota-intereses" aria-label="Lo que tu score no mide">
      <p>
        Tu score mide si tu ingreso alcanza para tus pagos. No mide cuánto pagas de intereses: hoy son{' '}
        <strong>{pesos(data.intereses_mes_total)} al mes</strong>.
      </p>
      <Link className="nota-intereses__enlace" to="/ranking">
        Ver tus deudas
      </Link>
    </section>
  )
}

export default NotaIntereses
