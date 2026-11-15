/** Los supuestos del cálculo, a la vista: el plan es una estimación, no una promesa. */
function SupuestosPlan({ supuestos }: { supuestos: string[] }) {
  if (supuestos.length === 0) return null

  return (
    <section className="supuestos" aria-labelledby="supuestos-plan-titulo">
      <h2 id="supuestos-plan-titulo" className="plan__titulo">
        Qué supusimos para calcularlo
      </h2>
      <ul className="supuestos__lista">
        {supuestos.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
    </section>
  )
}

export default SupuestosPlan
