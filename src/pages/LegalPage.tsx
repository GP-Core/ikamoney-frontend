import { Link } from 'react-router'
import AuthLayout from '../components/AuthLayout'
import { DOCUMENTOS_LEGALES } from '../content/legal'
import type { Bloque, ClaveDocumentoLegal } from '../content/legal'

interface LegalPageProps {
  documento: ClaveDocumentoLegal
}

function BloqueLegal({ bloque }: { bloque: Bloque }) {
  if ('p' in bloque) return <p>{bloque.p}</p>
  const Lista = 'ol' in bloque ? 'ol' : 'ul'
  const items = 'ol' in bloque ? bloque.ol : bloque.ul
  return (
    <Lista>
      {items.map((texto) => (
        <li key={texto}>{texto}</li>
      ))}
    </Lista>
  )
}

/** Aviso de privacidad o términos de uso (T55). El texto vive en content/legal.ts. */
function LegalPage({ documento }: LegalPageProps) {
  const { titulo, secciones } = DOCUMENTOS_LEGALES[documento]

  return (
    <AuthLayout
      titulo={titulo}
      pie={
        <Link to="/registro" className="auth-enlace">
          Volver al registro
        </Link>
      }
    >
      {secciones.map((s, i) => (
        <section key={s.titulo ?? i}>
          {s.titulo && <h2>{s.titulo}</h2>}
          {s.bloques.map((b, j) => (
            <BloqueLegal key={j} bloque={b} />
          ))}
        </section>
      ))}
    </AuthLayout>
  )
}

export default LegalPage
