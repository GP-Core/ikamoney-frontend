import './Ranking.css'

/** Sin deudas con saldo: se celebra en lugar de mostrar una pantalla vacía. */
function RankingVacio() {
  return (
    <section className="ranking-vacio" aria-labelledby="ranking-vacio-titulo">
      <svg viewBox="0 0 24 24" width="48" height="48" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.75" />
        <path d="M8 12.5l3 3 5-6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <h2 id="ranking-vacio-titulo" className="ranking-vacio__titulo">
        No tienes deudas con saldo
      </h2>
      <p className="ranking-vacio__texto">
        Hoy no pagas intereses por tarjetas ni por otras deudas. Si más adelante registras una, aquí verás en qué
        orden conviene pagarla y por qué.
      </p>
    </section>
  )
}

export default RankingVacio
