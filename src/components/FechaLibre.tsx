import type { AvisoPlan, TotalPlan } from '../types/plan'
import { duracion, mesEnFrase } from '../utils/formatPlan'

interface Props {
  total: TotalPlan
  /** Aviso PLAN_NO_SE_LIQUIDA, si el backend lo manda. */
  avisoSinFecha?: AvisoPlan
}

/** La fecha de liquidación, grande: es el dato que más motiva de toda la pantalla. */
function FechaLibre({ total, avisoSinFecha }: Props) {
  if (total.liquidacion_plan === null || total.meses_plan === null) {
    return (
      <section className="fecha fecha--sin" aria-live="polite">
        <p className="fecha__etiqueta">Fecha de liquidación estimada</p>
        <p className="fecha__valor fecha__valor--sin">Aún no hay fecha</p>
        <p className="fecha__detalle">
          {avisoSinFecha?.mensaje ?? 'Con este presupuesto tus deudas no se terminan de pagar. Aumenta tu abono extra.'}
        </p>
      </section>
    )
  }

  const antes = total.meses_menos ?? 0

  return (
    <section className="fecha" aria-live="polite">
      <p className="fecha__etiqueta">Libre de deudas en</p>
      <p className="fecha__valor">{mesEnFrase(total.liquidacion_plan)}</p>
      <p className="fecha__detalle">
        Fecha estimada, dentro de {duracion(total.meses_plan)}.
        {antes > 0 && total.liquidacion_base && (
          <>
            {' '}
            Pagando solo el mínimo sería en {mesEnFrase(total.liquidacion_base)}: <strong>{duracion(antes)} antes</strong>.
          </>
        )}
      </p>
    </section>
  )
}

export default FechaLibre
