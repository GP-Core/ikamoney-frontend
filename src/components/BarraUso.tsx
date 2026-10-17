import { formatPorcentaje, NIVEL_TEXTO, nivelUtilizacion } from '../utils/finanzas'
import type { Nivel } from '../utils/finanzas'
import Icon from './Icon'
import type { NombreIcono } from './Icon'
import './BarraUso.css'

const ICONO: Record<Nivel, NombreIcono> = {
  sano: 'sano',
  precaucion: 'precaucion',
  riesgo: 'riesgo',
  critico: 'critico',
}

interface BarraUsoProps {
  /** Proporción del límite usada: 0.3 = 30 %. Null si no hay límite registrado. */
  proporcion: number | null
  etiqueta?: string
}

/**
 * Barra del porcentaje del límite de crédito que se usa (REQ-TD-10), con el semáforo
 * de la guía de estilo: color + ícono con forma + palabra, nunca solo color.
 */
function BarraUso({ proporcion, etiqueta = 'Uso del límite' }: BarraUsoProps) {
  if (proporcion === null) {
    return <p className="uso__sin-limite">{etiqueta}: sin límite registrado</p>
  }

  const nivel = nivelUtilizacion(proporcion)
  const ancho = Math.min(Math.max(proporcion, 0), 1) * 100

  return (
    <div className={`uso uso--${nivel}`}>
      <div className="uso__encabezado">
        <span>{etiqueta}</span>
        <span className="uso__estado">
          <Icon nombre={ICONO[nivel]} tamano={16} />
          {formatPorcentaje(proporcion)} · {NIVEL_TEXTO[nivel]}
        </span>
      </div>
      <div className="uso__barra" aria-hidden="true">
        <div className="uso__relleno" style={{ width: `${ancho}%` }} />
      </div>
    </div>
  )
}

export default BarraUso