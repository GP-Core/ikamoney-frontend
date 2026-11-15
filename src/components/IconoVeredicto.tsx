import type { Veredicto } from '../types/simulador'

interface IconoVeredictoProps {
  veredicto: Veredicto
  /** Lado del icono en px. */
  tamano?: number
}

/**
 * Forma del semáforo de T20, distinta por estado para no depender del color:
 * círculo con palomita (sano), triángulo con "!" (precaución) y rombo con "!" (riesgo).
 * El relleno es el color de gráfica del estado y el signo va en tinta.
 */
function IconoVeredicto({ veredicto, tamano = 18 }: IconoVeredictoProps) {
  const signo = { fill: 'none', stroke: 'var(--marca-tinta)', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
  return (
    <svg className="sim-icono" width={tamano} height={tamano} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {veredicto === 'recomendable' && (
        <>
          <circle cx="12" cy="12" r="11" fill="var(--v-color)" />
          <path d="M7 12.5l3.2 3.2L17 8.8" {...signo} />
        </>
      )}
      {veredicto === 'con_precaucion' && (
        <>
          <path d="M12 2L23 21H1z" fill="var(--v-color)" stroke="var(--v-color)" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M12 9v5.5M12 17.6v.2" {...signo} />
        </>
      )}
      {veredicto === 'no_recomendable' && (
        <>
          <path d="M12 1L23 12L12 23L1 12z" fill="var(--v-color)" stroke="var(--v-color)" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M12 7.2v6M12 16.4v.2" {...signo} />
        </>
      )}
    </svg>
  )
}

export default IconoVeredicto
