import { useId, useState } from 'react'
import { GLOSARIO } from '../content/glosario'
import type { Termino } from '../content/glosario'
import './AyudaTermino.css'

/** Botón "?" que despliega, debajo del término, una explicación corta en lenguaje sencillo (RNF-01). */
function AyudaTermino({ termino }: { termino: Termino }) {
  const [abierto, setAbierto] = useState(false)
  const id = useId()
  const { titulo, texto } = GLOSARIO[termino]

  return (
    <span className="ayuda">
      <button
        type="button"
        className="ayuda__boton"
        aria-expanded={abierto}
        aria-controls={id}
        aria-label={`¿Qué es ${titulo}?`}
        onClick={() => setAbierto((a) => !a)}
      >
        ?
      </button>
      {abierto && (
        <span className="ayuda__texto" id={id} role="note">
          {texto}
        </span>
      )}
    </span>
  )
}

export default AyudaTermino
