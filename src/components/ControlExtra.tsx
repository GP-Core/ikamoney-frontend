import type { AvisoPlan } from '../types/plan'
import { pesos } from '../utils/pesos'
import { extraAplicable, maximoDeslizador } from '../utils/planVista'
import AyudaTermino from './AyudaTermino'

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
  /** true mientras el monto es el que se puso solo, sin que el usuario lo haya cambiado. */
  esSugerido: boolean
  avisos: AvisoPlan[]
  errorAlActualizar: string | null
  onReintentar: () => void
}

/** Captura `extraMensual`. Cada cambio pide el plan de nuevo; mientras llega se conserva el anterior. */
function ControlExtra({ valor, paso, onCambio, calculadoCon, actualizando, sugerido, esSugerido, avisos, errorAlActualizar, onReintentar }: Props) {
  const fijar = (texto: string) => {
    const n = Number(texto)
    onCambio(Number.isFinite(n) ? Math.min(Math.max(0, Math.round(n)), MAX_INPUT) : 0)
  }
  const aplicable = extraAplicable(sugerido, paso)
  const maximo = maximoDeslizador(aplicable)

  return (
    <section className="extra" aria-labelledby="extra-titulo">
      <h2 id="extra-titulo" className="deudas-titulo">
        ¿Cuánto <AyudaTermino termino="abonoExtra">abono extra</AyudaTermino> puedes hacer al mes?
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
        max={maximo}
        step={paso}
        value={Math.min(valor, maximo)}
        onChange={(e) => fijar(e.target.value)}
        aria-label="Abono extra mensual"
        aria-valuetext={pesos(valor)}
      />
      <div className="extra__marcas" aria-hidden="true">
        <span>$0</span>
        <span>{pesos(maximo)}</span>
      </div>

      {esSugerido && (
        <p className="extra__nota">
          Usamos {pesos(valor)}, lo que te sobra en tu peor mes. Cámbialo si no puedes abonar todo eso.
        </p>
      )}

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
