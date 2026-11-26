import type { Cuenta } from '../types/cuenta'
import type { Categoria } from '../types/movimiento'
import '../pages/SimuladorPage.css'

export interface CamposContado {
  cuentas: Cuenta[] | null
  cuentaId: string
  onCuenta: (id: string) => void
  categorias: Categoria[] | null
  categoriaId: string
  onCategoria: (id: string) => void
  /** Qué pasará con el saldo al guardar. */
  nota: string
}

interface RegistrarCompraProps {
  /** null mientras no se elija una forma de pago. */
  resumen: string | null
  /** Por qué no se recomienda la elegida. */
  advertencia: string | null
  /** Solo cuando la elegida es de contado. */
  contado: CamposContado | null
  textoBoton: string
  listo: boolean
  onRegistrar: () => void
}

/** RF-50: la forma de pago elegida, lo que falta para guardarla y el botón que pide confirmación. */
function RegistrarCompra({ resumen, advertencia, contado, textoBoton, listo, onRegistrar }: RegistrarCompraProps) {
  return (
    <section className="sim-registrar" aria-labelledby="sim-registrar-titulo">
      <h2 id="sim-registrar-titulo" className="sim-registrar__titulo">
        ¿Vas a hacer esta compra?
      </h2>
      <p className="sim-nota" aria-live="polite">
        {resumen ?? 'Elige una forma de pago arriba para registrar la compra.'}
      </p>

      {advertencia && (
        <p className="sim-aviso" role="status">
          No te lo recomendamos: {advertencia} Puedes registrarla de todas formas.
        </p>
      )}

      {contado && (
        <>
          <div className="sim-fila">
            <label className="sim-campo">
              <span>¿Con qué lo pagas?</span>
              <select value={contado.cuentaId} disabled={!contado.cuentas} onChange={(e) => contado.onCuenta(e.target.value)}>
                <option value="">{contado.cuentas ? 'Sin cuenta' : 'Cargando cuentas…'}</option>
                {contado.cuentas?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="sim-campo">
              <span>Categoría</span>
              <select
                value={contado.categoriaId}
                disabled={!contado.categorias}
                onChange={(e) => contado.onCategoria(e.target.value)}
              >
                {!contado.categorias && <option value="">Cargando categorías…</option>}
                {contado.categorias?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="sim-nota">{contado.nota}</p>
        </>
      )}

      <button type="button" className="sim-boton sim-registrar__boton" disabled={!listo} onClick={onRegistrar}>
        {textoBoton}
      </button>
    </section>
  )
}

export default RegistrarCompra
