import { useState } from 'react'
import { Link } from 'react-router'
import { DOCUMENTOS_LEGALES, RUTAS_LEGALES } from '../content/legal'
import type { ClaveDocumentoLegal } from '../content/legal'
import DocumentoLegal from './DocumentoLegal'
import Modal from './Modal'

interface VentanaLegalProps {
  inicial: ClaveDocumentoLegal
  abierta: boolean
  onCerrar: () => void
}

/** El documento en una ventana, para leerlo sin salir de donde se está. */
function VentanaLegal({ inicial, abierta, onCerrar }: VentanaLegalProps) {
  const [documento, setDocumento] = useState(inicial)
  const otro: ClaveDocumentoLegal = documento === 'privacidad' ? 'terminos' : 'privacidad'

  return (
    <Modal
      open={abierta}
      title={DOCUMENTOS_LEGALES[documento].titulo}
      variante="documento"
      onClose={() => {
        setDocumento(inicial)
        onCerrar()
      }}
    >
      {/* La key reinicia el índice al cambiar de documento. */}
      <DocumentoLegal key={documento} documento={documento} />
      <p className="legal__pie">
        <button
          type="button"
          onClick={(e) => {
            // El otro documento se empieza a leer desde arriba.
            e.currentTarget.closest('.modal__cuerpo')?.scrollTo({ top: 0 })
            setDocumento(otro)
          }}
        >
          Ver también: {DOCUMENTOS_LEGALES[otro].titulo}
        </button>
        <Link to={RUTAS_LEGALES[documento]}>Abrir en página completa</Link>
      </p>
    </Modal>
  )
}

export default VentanaLegal
