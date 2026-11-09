import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import Button from './Button'
import './ConfirmDialog.css'

interface ConfirmDialogProps {
  abierto: boolean
  titulo: string
  children: ReactNode
  textoConfirmar: string
  /** Muestra "Cargando…" en el botón mientras se elimina. */
  procesando?: boolean
  onConfirmar: () => void
  onCancelar: () => void
}

/** Ventana para confirmar acciones que no se pueden deshacer, como eliminar. */
function ConfirmDialog({
  abierto,
  titulo,
  children,
  textoConfirmar,
  procesando = false,
  onConfirmar,
  onCancelar,
}: ConfirmDialogProps) {
  const dialogo = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = dialogo.current
    if (!d) return
    if (abierto && !d.open) d.showModal()
    if (!abierto && d.open) d.close()
  }, [abierto])

  return (
    <dialog
      ref={dialogo}
      className="dialogo"
      aria-labelledby="dialogo-titulo"
      onCancel={(evento) => {
        // La tecla Esc cierra la ventana como "Cancelar".
        evento.preventDefault()
        if (!procesando) onCancelar()
      }}
    >
      <h2 id="dialogo-titulo">{titulo}</h2>
      <div className="dialogo__texto">{children}</div>
      <div className="dialogo__acciones">
        <Button variante="secundario" onClick={onCancelar} disabled={procesando}>
          Cancelar
        </Button>
        <Button variante="destructivo" onClick={onConfirmar} cargando={procesando}>
          {textoConfirmar}
        </Button>
      </div>
    </dialog>
  )
}

export default ConfirmDialog