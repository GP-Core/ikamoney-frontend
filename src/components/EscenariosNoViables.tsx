import type { EscenarioSimulacion } from '../types/simulador'
import './Simulador.css'

interface NoViablesProps {
  /** Escenarios con aplica = false. */
  escenarios: EscenarioSimulacion[]
}

/** Agrupa los que fallan por el mismo motivo: "3, 6, 12 y 18 meses · Tarjeta A". */
function agrupar(escenarios: EscenarioSimulacion[]) {
  const grupos = new Map<string, { titulo: string; meses: number[]; motivo: string; contado: boolean }>()
  for (const e of escenarios) {
    const motivo = e.motivo?.mensaje ?? 'No se pudo evaluar.'
    const clave = `${e.tipo}|${e.tarjeta_nombre ?? ''}|${motivo}`
    const g = grupos.get(clave) ?? { titulo: e.tarjeta_nombre ?? 'MSI', meses: [], motivo, contado: e.tipo === 'contado' }
    if (e.meses !== null) g.meses.push(e.meses)
    grupos.set(clave, g)
  }
  return [...grupos.values()]
}

function listaDeMeses(meses: number[]): string {
  if (meses.length === 0) return 'MSI'
  const ultimo = meses[meses.length - 1]
  const texto = meses.length === 1 ? `${ultimo}` : `${meses.slice(0, -1).join(', ')} y ${ultimo}`
  return `MSI a ${texto} meses`
}

/** Lo que no se pudo comparar, a la vista y con su motivo. */
function EscenariosNoViables({ escenarios }: NoViablesProps) {
  if (escenarios.length === 0) return null
  return (
    <section className="sim-noviables" aria-labelledby="sim-noviables-titulo">
      <h2 id="sim-noviables-titulo" className="sim-titulo">
        Lo que no se pudo comparar
      </h2>
      <ul className="sim-noviables__lista">
        {agrupar(escenarios).map((g) => (
          <li key={`${g.titulo}-${g.motivo}`}>
            <strong>{g.contado ? 'De contado' : `${listaDeMeses(g.meses)} · ${g.titulo}`}</strong>
            <span>{g.motivo}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default EscenariosNoViables
