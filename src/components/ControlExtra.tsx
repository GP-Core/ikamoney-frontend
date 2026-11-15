import type { AvisoPlan } from '../types/plan'
import { pesos } from '../utils/pesos'

const MAX_SLIDER = 10000
const MAX_INPUT = 1000000

interface Props {
  valor: number
  paso: number
  onCambio: (valor: number) => void
  /** Extra con el que se calculó el plan que se está viendo. */
  calculadoCon: number
  actualizando: boolean
  /** Lo que le sobra al usuario en su peor mes; se ofrece como punto de partida. */
  sugerido: number
  avisos: AvisoPlan[]
  errorAlActualizar: string | null
  onReintentar: () => void
}

/** Captura `extraMensual`. Cada cambio pide el plan de nuevo; mientras llega se conserva el anterior. */
function ControlExtra({ valor, paso, onCambio, calculadoCon, actualizando, sugerido, avisos, errorAlActualizar, onReintentar }: Props) {
  const fijar = (texto: string) => {
    const n = Number(texto)
    onCambio(Number.isFinite(n) ? Math.min(Math.max(0, Math.round(n)), MAX_INPUT) : 0)
  }
  // El sugerido va redondeado hacia abajo al paso del control, para no proponer más de lo que sobra.
  const aplicable = Math.floor(sugerido / paso) * paso

  return (
    <section className="extra" aria-labelledby="extra-titulo">
      <h2 id="extra-titulo" className="plan__titulo">
        ¿Cuánto extra puedes abonar al mes?
      </h2>
      <p className="extra__ayuda">Además de los pagos mínimos. Mueve el número y mira cómo se adelanta tu fecha.</p>

      <label className="extra__campo">
        <span className="extra__signo" aria-hidden="true">
          $
        </span>
        <input
          className="extra__input"
          type="number"
          inputMode="numeric"
          min={0}
          max={MAX_INPUT}
          step={paso}
          value={valor}
          onChange={(e) => fijar(e.target.value)}
          aria-label="Abono extra mensual en pesos"
        />
        <span className="extra__sufijo">al mes</span>
      </label>

      <input
        className="extra__slider"
        type="range"
        min={0}
        max={MAX_SLIDER}
        step={paso}
        value={Math.min(valor, MAX_SLIDER)}
        onChange={(e) => fijar(e.target.value)}
        aria-label="Abono extra mensual"
        aria-valuetext={pesos(valor)}
      />
      <div className="extra__marcas" aria-hidden="true">
        <span>$0</span>
        <span>{pesos(MAX_SLIDER)}</span>
      </div>

      <p className="extra__estado" aria-live="polite">
        {actualizando
          ? 'Actualizando…'
          : calculadoCon !== valor && `Datos de ejemplo: se muestra el escenario más cercano (${pesos(calculadoCon)} al mes).`}
      </p>

      {aplicable > 0 && aplicable !== valor && (
        <button type="button" className="extra__sugerido" onClick={() => onCambio(aplicable)}>
          Usar {pesos(aplicable)}, lo que te sobra en tu peor mes
        </button>
      )}

      {avisos.map((a) => (
        <p key={a.codigo} className="plan__aviso" role="status">
          {a.mensaje}
        </p>
      ))}

      {errorAlActualizar && (
        <p className="plan__aviso plan__aviso--error" role="alert">
          No pudimos actualizar el plan: {errorAlActualizar}{' '}
          <button type="button" className="plan__enlace" onClick={onReintentar}>
            Reintentar
          </button>
        </p>
      )}
    </section>
  )
}

export default ControlExtra
