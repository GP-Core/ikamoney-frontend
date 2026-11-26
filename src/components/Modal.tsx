import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import './Modal.css'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  /** Para textos largos: más ancha, con el título fijo y el contenido con scroll. */
  variante?: 'documento'
}

/** Ventana modal con <dialog>: en celular sube desde abajo. Esc y "Cerrar" llaman a onClose. */
function Modal({ open, title, onClose, children, variante }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={`modal ${variante ? `modal--${variante}` : ''}`}
      aria-labelledby={titleId}
      onClose={onClose}
    >
      <div className="modal__head">
        <h2 id={titleId}>{title}</h2>
        <button type="button" className="modal__close" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>
      </div>
      {/* Se monta solo al abrir, así el formulario siempre empieza limpio. */}
      {open && (variante ? <div className="modal__cuerpo">{children}</div> : children)}
    </dialog>
  )
}

export default Modal
