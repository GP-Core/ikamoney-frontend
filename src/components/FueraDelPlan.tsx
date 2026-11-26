import type { SinRanking } from '../types/plan'
import { pesos } from '../utils/pesos'
import { separarFueraDelOrden } from '../utils/ranking'
import { sinCodigosInternos } from '../utils/texto'
import AyudaTermino from './AyudaTermino'

interface Props {
  items: SinRanking[]
  msiMesTotal: number
}

/** Lo que no entra al orden ni al plan y por qué, para que el usuario no lo dé por olvidado. */
function FueraDelPlan({ items, msiMesTotal }: Props) {
  if (items.length === 0) return null
  const { msi, otras } = separarFueraDelOrden(items)

  return (
    <section className="fuera" aria-labelledby="fuera-titulo">
      <h2 id="fuera-titulo" className="deudas-titulo">
        Lo que no entra al orden
      </h2>

      {/* Todas las compras a MSI se explican una sola vez. */}
      {msi.length > 0 && (
        <div className="fuera__bloque">
          <p className="fuera__cabeza">
            <AyudaTermino termino="msi">Compras a meses sin intereses</AyudaTermino>
            {msiMesTotal > 0 && <strong>{pesos(msiMesTotal)} al mes</strong>}
          </p>
          <ul className="fuera__msi">
            {msi.map((i) => (
              <li key={i.clave}>
                <span>{i.nombre}</span>
                <span>{pesos(i.pago_mensual ?? 0)}</span>
              </li>
            ))}
          </ul>
          <p className="fuera__nota">
            No te cobran intereses si pagas la mensualidad a tiempo. Se pagan aparte de tu abono extra.
          </p>
        </div>
      )}

      {otras.map((i) => (
        <div key={i.clave} className="fuera__bloque">
          <p className="fuera__cabeza">
            <strong>{i.nombre}</strong>
          </p>
          <p>
            Debes {pesos(i.saldo)}
            {i.pago_mensual !== null && <> · pagas {pesos(i.pago_mensual)} al mes</>}
          </p>
          <p className="fuera__nota">{sinCodigosInternos(i.mensaje)}</p>
        </div>
      ))}
    </section>
  )
}

export default FueraDelPlan
