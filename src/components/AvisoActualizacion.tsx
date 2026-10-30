import './AvisoActualizacion.css'

interface Props {
  tipo: 'version-nueva' | 'sin-conexion'
  onActualizar?: () => void
  onCerrar: () => void
}

/** Aviso flotante de la PWA: hay una versión nueva, o la app ya quedó lista para abrirse sin conexión. */
function AvisoActualizacion({ tipo, onActualizar, onCerrar }: Props) {
  const versionNueva = tipo === 'version-nueva'

  return (
    <div className="aviso-pwa" role="status" aria-live="polite">
      <p className="aviso-pwa__texto">
        {versionNueva ? 'Hay una versión nueva de IkaMoney.' : 'IkaMoney ya puede abrirse sin conexión.'}
      </p>
      <div className="aviso-pwa__acciones">
        {versionNueva && (
          <button type="button" className="aviso-pwa__boton aviso-pwa__boton--primario" onClick={onActualizar}>
            Actualizar
          </button>
        )}
        <button type="button" className="aviso-pwa__boton" onClick={onCerrar}>
          {versionNueva ? 'Después' : 'Entendido'}
        </button>
      </div>
    </div>
  )
}

export default AvisoActualizacion
