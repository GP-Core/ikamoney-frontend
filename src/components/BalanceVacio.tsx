import './BalanceVacio.css'

const PASOS = [
  { titulo: 'Registra tus ingresos', texto: 'Tu nómina u otros ingresos, con su frecuencia.' },
  { titulo: 'Agrega tus gastos fijos', texto: 'Renta, servicios y todo lo que pagas cada mes.' },
  { titulo: 'Suma tus compras a MSI', texto: 'Para ver cuánto ya tienes comprometido a futuro.' },
]

/** Estado del usuario nuevo: aún no hay datos con los que calcular el balance. */
function BalanceVacio() {
  return (
    <section className="vacio" aria-labelledby="vacio-titulo">
      {/* Vista previa decorativa de lo que aparecerá aquí. */}
      <svg className="vacio__vista" viewBox="0 0 200 70" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x={14 + i * 30} y={70 - (26 + (i % 3) * 10)} width="18" height={26 + (i % 3) * 10} rx="3" />
        ))}
        <polyline points="23,20 53,18 83,19 113,17 143,18 173,16" />
      </svg>

      <h2 id="vacio-titulo" className="vacio__titulo">
        Aquí verás cuánto te queda libre
      </h2>
      <p className="vacio__texto">
        Cuando captures tus datos, esta pantalla te mostrará el balance del mes y cómo se ven tus próximos meses,
        incluidas las mensualidades que ya tienes comprometidas.
      </p>

      <ol className="vacio__pasos">
        {PASOS.map((paso) => (
          <li key={paso.titulo}>
            <strong>{paso.titulo}</strong>
            <span>{paso.texto}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

export default BalanceVacio
