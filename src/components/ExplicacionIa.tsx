import './Simulador.css'

interface ExplicacionIaProps {
  /** Texto redactado por la IA (SC-06). Mientras ese endpoint no exista, no se manda y no se pinta nada. */
  texto?: string | null
}

/**
 * Espacio reservado para la explicación de la IA. Es un acompañamiento, nunca el veredicto:
 * va en un bloque aparte, sin color de semáforo, y dice de dónde viene.
 */
function ExplicacionIa({ texto }: ExplicacionIaProps) {
  if (!texto) return null
  return (
    <aside className="sim-ia" aria-labelledby="sim-ia-titulo">
      <h2 id="sim-ia-titulo" className="sim-ia__titulo">
        Explicación
      </h2>
      <p className="sim-ia__texto">{texto}</p>
      <p className="sim-ia__nota">Redactada con IA para acompañar el resultado. El veredicto lo calculan reglas fijas.</p>
    </aside>
  )
}

export default ExplicacionIa
