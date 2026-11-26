import type { InputHTMLAttributes } from 'react'
import { campoCambiado, estadoDeFila } from '../utils/revisionEstado'
import type { Accion, CampoFilaTexto, Errores, EstadoFila, Fila } from '../utils/revisionEstado'
import Button from './Button'
import Icon from './Icon'
import TextField from './TextField'

const ETIQUETA: Record<EstadoFila, string> = { ia: 'IA', editado: 'Editado por ti', agregado: 'Agregado por ti' }

interface RevisionMovimientosProps {
  filas: Fila[]
  errores: Errores['filas']
  /** Los datos vienen de la IA: solo entonces tiene sentido marcar qué se cambió. */
  conIa: boolean
  hayEliminada: boolean
  hoy: string
  despachar: (accion: Accion) => void
}

/** Movimientos y compras a MSI del estado de cuenta, uno por tarjeta. */
function RevisionMovimientos({ filas, errores, conIa, hayEliminada, hoy, despachar }: RevisionMovimientosProps) {
  return (
    <section className="estado-ficha" aria-labelledby="estado-movimientos">
      <h2 id="estado-movimientos">Movimientos y compras a MSI ({filas.length})</h2>

      {conIa && (
        <ul className="estado-leyenda" aria-label="Significado de las marcas">
          <li><span className="estado-marca estado-marca--ia">IA</span> Como lo leyó la IA</li>
          <li><span className="estado-marca estado-marca--editado">Editado por ti</span> Lo cambiaste</li>
          <li><span className="estado-marca estado-marca--agregado">Agregado por ti</span> Lo capturaste tú</li>
        </ul>
      )}

      {filas.length === 0 && (
        <p className="estado-nota" role="status">
          {conIa
            ? 'No encontramos movimientos en este estado de cuenta. Puedes agregarlos a mano.'
            : 'Todavía no hay movimientos (opcional). Puedes guardar solo la tarjeta.'}
        </p>
      )}

      <ul className="estado-lista">
        {filas.map((f) => {
          const estado = estadoDeFila(f)
          const e = errores[f.id] ?? {}
          const campo = (
            nombre: CampoFilaTexto,
            etiqueta: string,
            props: InputHTMLAttributes<HTMLInputElement> & { prefijo?: string },
          ) => (
            <div className={`estado-lista__${nombre} ${campoCambiado(f, nombre) ? 'estado-cambiado' : ''}`}>
              <TextField
                {...props}
                etiqueta={etiqueta}
                value={f[nombre] ?? ''}
                error={e[nombre]}
                onChange={(ev) => despachar({ type: 'EDITAR_FILA', id: f.id, campo: nombre, valor: ev.target.value })}
              />
            </div>
          )
          return (
            <li key={f.id} className={`estado-fila estado-fila--${conIa ? estado : 'simple'}`}>
              <div className="estado-fila__cabecera">
                {conIa ? <span className={`estado-marca estado-marca--${estado}`}>{ETIQUETA[estado]}</span> : <span />}
                <button
                  type="button"
                  className="estado-enlace"
                  onClick={() => despachar({ type: 'ELIMINAR', id: f.id })}
                  aria-label={`Eliminar ${f.concepto || 'movimiento'}`}
                >
                  <Icon nombre="basura" tamano={16} />
                  Eliminar
                </button>
              </div>
              <div className="estado-grupo">
                {campo('concepto', 'Concepto', { maxLength: 120 })}
                {campo('monto', f.esMsi ? 'Monto total' : 'Monto', { inputMode: 'decimal', prefijo: '$' })}
                {campo('fecha', f.esMsi ? 'Fecha de compra (opcional)' : 'Fecha', { type: 'date', max: hoy })}
                {f.esMsi && campo('meses', 'Meses', { inputMode: 'numeric' })}
                {f.esMsi && campo('mensualidadesPagadas', 'Mensualidades pagadas', { inputMode: 'numeric' })}
              </div>
              <label className={`estado-msi ${campoCambiado(f, 'esMsi') ? 'estado-cambiado' : ''}`}>
                <input
                  type="checkbox"
                  checked={f.esMsi}
                  onChange={(ev) => despachar({ type: 'EDITAR_FILA', id: f.id, campo: 'esMsi', valor: ev.target.checked })}
                />
                <span>Es a meses sin intereses</span>
              </label>
            </li>
          )
        })}
      </ul>

      <div className="estado-botones estado-botones--fila">
        <Button variante="secundario" onClick={() => despachar({ type: 'AGREGAR' })}>
          <Icon nombre="mas" tamano={20} />
          Agregar movimiento
        </Button>
        {hayEliminada && (
          <button type="button" className="estado-enlace" onClick={() => despachar({ type: 'DESHACER' })}>
            Deshacer eliminación
          </button>
        )}
      </div>
    </section>
  )
}

export default RevisionMovimientos
