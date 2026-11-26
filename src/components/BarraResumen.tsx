import { useEffect, useId, useRef, useState } from 'react'
import type { ClaveParte, ParteMes } from '../utils/balanceVista'
import { pesos } from '../utils/pesos'
import './BarraResumen.css'

const EXPLICACION: Record<ClaveParte, string> = {
  comprometido: 'Gastos fijos, pagos de tarjetas y mensualidades a MSI: ya está apartado.',
  variable: 'Gastos que cambian mes con mes, como súper, transporte o salidas.',
  libre: 'Lo que te queda después de todo lo anterior.',
}

/** La barra del mes. Al pasar el mouse, enfocar o tocar un tramo se explica qué es. */
function BarraResumen({ partes }: { partes: ParteMes[] }) {
  const [activa, setActiva] = useState<ClaveParte | null>(null)
  const contenedor = useRef<HTMLDivElement>(null)
  const idGlobo = useId()
  const visibles = partes.filter((p) => p.valor > 0)
  const parte = visibles.find((p) => p.clave === activa)

  // Con el globo abierto, tocar fuera o pulsar Esc lo cierra.
  useEffect(() => {
    if (!activa) return
    const alTocar = (e: PointerEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) setActiva(null)
    }
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && setActiva(null)
    document.addEventListener('pointerdown', alTocar)
    document.addEventListener('keydown', alTeclear)
    return () => {
      document.removeEventListener('pointerdown', alTocar)
      document.removeEventListener('keydown', alTeclear)
    }
  }, [activa])

  const acciones = (clave: ClaveParte) => ({
    onPointerEnter: (e: React.PointerEvent) => e.pointerType === 'mouse' && setActiva(clave),
    onFocus: () => setActiva(clave),
    onClick: () => setActiva(clave),
    'aria-describedby': activa === clave ? idGlobo : undefined,
  })

  // El globo se ancla al centro del tramo sin salirse: a la izquierda crece a la derecha y viceversa.
  const centro = parte ? Math.min(Math.max(parte.inicio + parte.ancho / 2, 6), 94) : 0

  return (
    <div
      ref={contenedor}
      className="barra-mes"
      onPointerLeave={(e) => e.pointerType === 'mouse' && setActiva(null)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setActiva(null)}
    >
      {parte && (
        <div className="barra-mes__ancla">
          <div
            id={idGlobo}
            role="tooltip"
            className="barra-mes__globo"
            style={{ left: `${centro}%`, transform: `translateX(-${centro}%)` }}
          >
            <p className="barra-mes__globo-titulo">
              {parte.nombre}: {pesos(parte.valor)}
              {parte.delIngreso !== null && <span> ({parte.delIngreso} % de tu ingreso)</span>}
            </p>
            <p>{EXPLICACION[parte.clave]}</p>
            <span className="barra-mes__flecha" style={{ left: `${centro}%` }} aria-hidden="true" />
          </div>
        </div>
      )}

      <div className="barra-mes__pista">
        {visibles.map((p) => (
          <button
            key={p.clave}
            type="button"
            className={`barra-mes__tramo${activa && activa !== p.clave ? ' barra-mes__tramo--apagado' : ''}`}
            style={{ width: `${p.ancho}%` }}
            aria-label={`${p.nombre}: ${pesos(p.valor)}`}
            {...acciones(p.clave)}
          >
            <span className={`barra-mes__color barra-mes__color--${p.clave}`} />
          </button>
        ))}
      </div>

      {/* La leyenda hace lo mismo con un área más fácil de tocar; con teclado ya están los tramos. */}
      <div className="barra-mes__leyenda">
        {visibles.map((p) => (
          <button key={p.clave} type="button" tabIndex={-1} {...acciones(p.clave)}>
            <span className={`barra-mes__punto barra-mes__color--${p.clave}`} aria-hidden="true" />
            {p.nombre}
          </button>
        ))}
      </div>
    </div>
  )
}

export default BarraResumen
