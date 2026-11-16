import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import './Modal.css'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

/** Ventana modal con <dialog>: en celular sube desde abajo. Esc y "Cerrar" llaman a onClose. */
function Modal({ open, title, onClose, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog ref={ref} className="modal" aria-labelledby={titleId} onClose={onClose}>
      <div className="modal__head">
        <h2 id={titleId}>{title}</h2>
        <button type="button" className="modal__close" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>
      </div>
      {/* Se monta solo al abrir, así el formulario siempre empieza limpio. */}
      {open && children}
    </dialog>
  )
}

export default Modal
