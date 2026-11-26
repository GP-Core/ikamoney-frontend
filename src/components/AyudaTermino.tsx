import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { GLOSARIO } from '../content/glosario'
import type { Termino } from '../content/glosario'
import './AyudaTermino.css'

/** Por debajo de este ancho la ayuda es una hoja inferior. Debe coincidir con el CSS. */
const HOJA = '(max-width: 599px)'
const MARGEN = 12
const SEPARACION = 10

const entre = (valor: number, minimo: number, maximo: number) => Math.min(Math.max(valor, minimo), maximo)

/** Coloca el globo bajo el término (o arriba si no cabe) sin salirse de la pantalla. */
function colocar(termino: HTMLElement, ventana: HTMLElement) {
  if (window.matchMedia(HOJA).matches) {
    ventana.style.left = ''
    ventana.style.top = ''
    ventana.dataset.lado = 'hoja'
    return
  }
  const t = termino.getBoundingClientRect()
  const ancho = ventana.offsetWidth
  const alto = ventana.offsetHeight
  const pantalla = document.documentElement.clientWidth
  const izquierda = entre(t.left, MARGEN, pantalla - ancho - MARGEN)
  const cabeAbajo = t.bottom + SEPARACION + alto <= window.innerHeight - MARGEN
  ventana.style.left = `${izquierda}px`
  ventana.style.top = `${cabeAbajo ? t.bottom + SEPARACION : Math.max(t.top - alto - SEPARACION, MARGEN)}px`
  ventana.style.setProperty('--flecha', `${entre(t.left + t.width / 2 - izquierda, 16, ancho - 16)}px`)
  ventana.dataset.lado = cabeAbajo ? 'abajo' : 'arriba'
}

interface AyudaTerminoProps {
  termino: Termino
  /** El texto que se toca para ver la explicación. */
  children: ReactNode
}

/**
 * Un término subrayado que, al tocarlo, explica en lenguaje sencillo qué significa (RNF-01): un globo
 * junto a él en pantallas grandes y una hoja desde abajo en celular. Usa la API Popover del navegador,
 * así que Esc o tocar fuera lo cierran y solo hay uno abierto.
 */
function AyudaTermino({ termino, children }: AyudaTerminoProps) {
  const id = useId()
  const boton = useRef<HTMLButtonElement>(null)
  const ventana = useRef<HTMLDivElement>(null)
  const [abierto, setAbierto] = useState(false)
  const { titulo, texto } = GLOSARIO[termino]

  // Mientras está abierto, el globo sigue al término al desplazar o cambiar el tamaño.
  useEffect(() => {
    const t = boton.current
    const v = ventana.current
    if (!abierto || !t || !v) return
    let cuadro = 0
    colocar(t, v)
    if (window.matchMedia(HOJA).matches) v.querySelector('button')?.focus()
    const seguir = () => {
      cancelAnimationFrame(cuadro)
      cuadro = requestAnimationFrame(() => colocar(t, v))
    }
    window.addEventListener('scroll', seguir, { passive: true, capture: true })
    window.addEventListener('resize', seguir)
    return () => {
      cancelAnimationFrame(cuadro)
      window.removeEventListener('scroll', seguir, { capture: true })
      window.removeEventListener('resize', seguir)
      delete v.dataset.lado
    }
  }, [abierto])

  return (
    <>
      <button ref={boton} type="button" className="ayuda__termino" popoverTarget={id} aria-haspopup="dialog" aria-expanded={abierto}>
        {children}
      </button>
      {/* En el <body>: así vale dentro de un párrafo y no hereda los estilos de donde está el término. */}
      {createPortal(
        <div
          ref={ventana}
          id={id}
          popover="auto"
          role="dialog"
          aria-labelledby={`${id}-titulo`}
          className="ayuda__ventana"
          onToggle={(e) => setAbierto(e.newState === 'open')}
        >
          <p className="ayuda__titulo" id={`${id}-titulo`}>
            {titulo}
          </p>
          <p>{texto}</p>
          <button type="button" className="ayuda__entendido" popoverTarget={id} popoverTargetAction="hide">
            Entendido
          </button>
        </div>,
        document.body,
      )}
    </>
  )
}

export default AyudaTermino
