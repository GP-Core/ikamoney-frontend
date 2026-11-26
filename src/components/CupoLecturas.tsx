import type { CupoExtraccion } from '../types/estadoCuenta'
import { textoCupo, textoCupoCorto } from '../utils/revisionEstado'
import AyudaTermino from './AyudaTermino'
import './CupoLecturas.css'

/** Cuántas lecturas con IA gratis quedan: un segmento por lectura, llenos los que aún se pueden usar. */
function CupoLecturas({ cupo }: { cupo: CupoExtraccion }) {
  const { limite, restantes } = cupo
  return (
    <section className={`cupo ${restantes <= 1 ? 'cupo--poco' : ''}`} aria-label="Lecturas gratis con IA">
      <p className="cupo__cuenta" role="status">
        <strong>{restantes}</strong> de {limite}{' '}
        <AyudaTermino termino="lecturaGratis">lecturas gratis</AyudaTermino>
      </p>
      <div className="cupo__medidor" aria-hidden="true">
        {Array.from({ length: limite }, (_, i) => (
          <span key={i} className={i < restantes ? 'cupo__segmento cupo__segmento--libre' : 'cupo__segmento'} />
        ))}
      </div>
      <p className="cupo__texto">{textoCupo(cupo)}</p>
    </section>
  )
}

/** Etiqueta corta junto a los accesos a "Subir estado de cuenta". No muestra nada si no se conoce. */
export function EtiquetaCupo({ cupo }: { cupo: CupoExtraccion | null }) {
  const texto = textoCupoCorto(cupo)
  return texto ? <span className="cupo-etiqueta">{texto}</span> : null
}

export default CupoLecturas
