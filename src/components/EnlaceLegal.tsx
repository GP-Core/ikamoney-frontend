import { useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { ClaveDocumentoLegal } from '../content/legal'
import VentanaLegal from './VentanaLegal'
import './DocumentoLegal.css'

/** Se ve como enlace y abre el documento en una ventana. */
function EnlaceLegal({ documento, children }: { documento: ClaveDocumentoLegal; children: ReactNode }) {
  const [abierta, setAbierta] = useState(false)

  return (
    <>
      <button
        type="button"
        className="enlace-legal"
        aria-haspopup="dialog"
        onClick={(e) => {
          e.preventDefault()
          setAbierta(true)
        }}
      >
        {children}
      </button>
      {/* Fuera de donde está el enlace: dentro de la etiqueta de "Acepto", tocar el texto marcaría la casilla. */}
      {createPortal(
        <VentanaLegal inicial={documento} abierta={abierta} onCerrar={() => setAbierta(false)} />,
        document.body,
      )}
    </>
  )
}

export default EnlaceLegal
