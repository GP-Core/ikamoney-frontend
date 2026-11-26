import { Fragment, useId, useRef } from 'react'
import { ancla, CONTACTO, DOCUMENTOS_LEGALES } from '../content/legal'
import type { Bloque, ClaveDocumentoLegal } from '../content/legal'
import './DocumentoLegal.css'

/** El correo de contacto se puede tocar para escribir. */
function ConCorreo({ texto }: { texto: string }) {
  return texto.split(CONTACTO).map((parte, i) => (
    <Fragment key={i}>
      {i > 0 && <a href={`mailto:${CONTACTO}`}>{CONTACTO}</a>}
      {parte}
    </Fragment>
  ))
}

function BloqueLegal({ bloque }: { bloque: Bloque }) {
  if ('p' in bloque) {
    return (
      <p>
        <ConCorreo texto={bloque.p} />
      </p>
    )
  }
  const Lista = 'ol' in bloque ? 'ol' : 'ul'
  const items = 'ol' in bloque ? bloque.ol : bloque.ul
  return (
    <Lista>
      {items.map((texto) => (
        <li key={texto}>
          <ConCorreo texto={texto} />
        </li>
      ))}
    </Lista>
  )
}

const fechaLarga = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })

/** Aviso de privacidad o términos de uso (T55): fecha, índice y secciones. Sirve en la página y en la ventana. */
function DocumentoLegal({ documento }: { documento: ClaveDocumentoLegal }) {
  const { actualizado, secciones } = DOCUMENTOS_LEGALES[documento]
  const base = useId()
  const indice = useRef<HTMLDetailsElement>(null)

  function irA(id: string) {
    if (indice.current) indice.current.open = false
    const titulo = document.getElementById(id)
    titulo?.focus({ preventScroll: true })
    titulo?.scrollIntoView({ block: 'start' })
  }

  return (
    <div className="legal">
      <p className="legal__fecha">Última actualización: {fechaLarga(actualizado)}</p>

      <details className="legal__indice" ref={indice}>
        <summary>En este documento</summary>
        <ul>
          {secciones.map(
            (s) =>
              s.titulo && (
                <li key={s.titulo}>
                  <button type="button" onClick={() => irA(`${base}-${ancla(s.titulo!)}`)}>
                    {s.titulo}
                  </button>
                </li>
              ),
          )}
        </ul>
      </details>

      {secciones.map((s, i) => (
        <section key={s.titulo ?? i} className="legal__seccion">
          {s.titulo && (
            <h2 id={`${base}-${ancla(s.titulo)}`} tabIndex={-1}>
              {s.titulo}
            </h2>
          )}
          {s.bloques.map((b, j) => (
            <BloqueLegal key={j} bloque={b} />
          ))}
        </section>
      ))}
    </div>
  )
}

export default DocumentoLegal
