import { useState } from 'react'
import { Link } from 'react-router'
import AhorroPlan from '../components/AhorroPlan'
import ControlExtra from '../components/ControlExtra'
import FechaLibre from '../components/FechaLibre'
import FueraDelPlan from '../components/FueraDelPlan'
import PlanPorDeuda from '../components/PlanPorDeuda'
import SupuestosPlan from '../components/SupuestosPlan'
import { usePlan } from '../hooks/usePlan'
import { PASO_EXTRA, PLAN_USANDO_EJEMPLO } from '../services/plan'
import './BalancePage.css'
import './PlanPage.css'

/** Pantalla del plan de pago: cuánto abonar a cada deuda, cuándo quedas libre y cuánto ahorras. */
function PlanPage() {
  const [extra, setExtra] = useState(0)
  const { estado, data, error, errorAlActualizar, actualizando, reintentar } = usePlan(extra)
  const plan = data?.plan ?? null
  // Con extra 0 solo se pagarían los mínimos: no es un plan, y el criterio pide avisarlo en lugar de generarlo.
  const sinExtra = extra <= 0

  return (
    <main className="balance">
      <div className="balance__ancho">
        <header className="balance__encabezado">
          <Link className="balance__mes-boton plan-volver" to="/ranking" aria-label="Volver a tus deudas">
            ‹
          </Link>
          <div className="balance__mes">
            <h1 className="balance__titulo">Tu plan de pago</h1>
            {PLAN_USANDO_EJEMPLO && <span className="balance__ejemplo">Datos de ejemplo</span>}
          </div>
          <span className="plan-volver plan-volver--vacio" aria-hidden="true" />
        </header>

        {estado === 'cargando' && (
          <div className="plan__contenido" aria-busy="true" aria-live="polite">
            <span className="balance__sr">Cargando tu plan…</span>
            <div className="esqueleto plan__esqueleto--fecha" />
            <div className="esqueleto plan__esqueleto--bloque" />
          </div>
        )}

        {estado === 'error' && (
          <section className="balance__error" role="alert">
            <h2>No pudimos cargar tu plan</h2>
            <p>{error}</p>
            <button type="button" className="balance__reintentar" onClick={reintentar}>
              Reintentar
            </button>
          </section>
        )}

        {estado === 'ok' && data && !plan && (
          <div className="plan__contenido">
            <section className="plan__vacio">
              <h2>{data.estado === 'sin_deudas' ? 'No tienes deudas con intereses' : 'Aún no se puede armar tu plan'}</h2>
              <p>
                {data.estado === 'sin_deudas'
                  ? 'Cuando captures tarjetas o préstamos con intereses, aquí verás cuánto abonar y cuándo quedas libre.'
                  : 'Para calcular el plan hace falta el pago mensual de tus deudas. Captúralo y vuelve a entrar.'}
              </p>
            </section>
            <FueraDelPlan items={data.sin_ranking} msiMesTotal={data.msi_mes_total} />
          </div>
        )}

        {estado === 'ok' && data && plan && (
          <div className="plan__contenido">
            {!sinExtra && (
              <FechaLibre total={plan.total} avisoSinFecha={plan.avisos.find((a) => a.codigo === 'PLAN_NO_SE_LIQUIDA')} />
            )}
            <ControlExtra
              valor={extra}
              paso={PASO_EXTRA}
              onCambio={setExtra}
              calculadoCon={plan.extra_mensual}
              actualizando={actualizando}
              sugerido={plan.extra_sugerido}
              avisos={plan.avisos.filter((a) => a.codigo === 'EXCEDENTE_NO_SOSTENIBLE' || a.codigo === 'SIN_DINERO_EXTRA')}
              errorAlActualizar={errorAlActualizar}
              onReintentar={reintentar}
            />
            {sinExtra ? (
              <section className="plan__vacio" role="status">
                <h2>Escribe cuánto extra puedes abonar</h2>
                <p>
                  Con $0 extra solo pagarías los mínimos, y eso no es un plan. Elige un monto arriba para ver cuánto
                  abonar a cada deuda, cuándo quedas libre y cuánto ahorras.
                </p>
              </section>
            ) : (
              <>
                <AhorroPlan plan={plan} />
                <PlanPorDeuda plan={plan} ranking={data.ranking} />
              </>
            )}
            <FueraDelPlan items={data.sin_ranking} msiMesTotal={data.msi_mes_total} />
            {!sinExtra &&
              plan.avisos
                .filter((a) => a.codigo === 'DEUDA_SIN_PAGO_MENSUAL')
                .map((a) => (
                  <p key={a.mensaje} className="plan__aviso" role="status">
                    {a.mensaje}
                  </p>
                ))}
            {!sinExtra && <SupuestosPlan supuestos={plan.supuestos} />}
          </div>
        )}
      </div>
    </main>
  )
}

export default PlanPage
