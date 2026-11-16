import type { SinRanking } from '../types/plan'
import { pesos } from '../utils/pesos'

interface Props {
  items: SinRanking[]
  msiMesTotal: number
}

/** Lo que no entra al plan (MSI, deudas sin tasa…) y por qué, para que el usuario no lo dé por olvidado. */
function FueraDelPlan({ items, msiMesTotal }: Props) {
  if (items.length === 0) return null
  const hayMsi = items.some((i) => i.motivo === 'MSI')

  return (
    <section className="fuera" aria-labelledby="fuera-titulo">
      <h2 id="fuera-titulo" className="plan__titulo">
        Fuera del plan
      </h2>
      {hayMsi && msiMesTotal > 0 && (
        <p className="fuera__msi">
          Además de este plan sigues pagando <strong>{pesos(msiMesTotal)}</strong> al mes de tus MSI.
        </p>
      )}
      <ul className="fuera__lista">
        {items.map((i) => (
          <li key={i.clave}>
            <strong>{i.nombre}</strong> · {pesos(i.saldo)}
            <br />
            <span>{i.mensaje}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default FueraDelPlan
