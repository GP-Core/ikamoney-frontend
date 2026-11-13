import type { NivelSemaforo } from '../utils/ranking'

/** Forma del semáforo de T20: círculo, triángulo, rombo u octágono. Se distingue sin depender del color. */
function IconoSemaforo({ nivel }: { nivel: NivelSemaforo }) {
  const trazo = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      {nivel === 'sano' && (
        <>
          <circle cx="12" cy="12" r="9" {...trazo} />
          <path d="M8 12.5l3 3 5-6" {...trazo} />
        </>
      )}
      {nivel === 'precaucion' && (
        <>
          <path d="M12 3.5L21.5 20h-19z" {...trazo} />
          <path d="M12 10v4.5M12 17.2v.1" {...trazo} />
        </>
      )}
      {nivel === 'riesgo' && (
        <>
          <path d="M12 2.5L21.5 12 12 21.5 2.5 12z" {...trazo} />
          <path d="M12 8v5M12 15.7v.1" {...trazo} />
        </>
      )}
      {nivel === 'critico' && (
        <>
          <path d="M8.2 3h7.6L21 8.2v7.6L15.8 21H8.2L3 15.8V8.2z" {...trazo} />
          <path d="M9 9l6 6M15 9l-6 6" {...trazo} />
        </>
      )}
    </svg>
  )
}

export default IconoSemaforo
