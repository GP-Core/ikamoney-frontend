import { Link } from 'react-router'
import AuthLayout from '../components/AuthLayout'
import DocumentoLegal from '../components/DocumentoLegal'
import { DOCUMENTOS_LEGALES, RUTAS_LEGALES } from '../content/legal'
import type { ClaveDocumentoLegal } from '../content/legal'
import { useAuth } from '../hooks/useAuth'

/** Página pública del aviso de privacidad o los términos (T55): sirve para un enlace directo y para imprimir. */
function LegalPage({ documento }: { documento: ClaveDocumentoLegal }) {
  const { usuario } = useAuth()
  const otro: ClaveDocumentoLegal = documento === 'privacidad' ? 'terminos' : 'privacidad'

  return (
    <AuthLayout
      titulo={DOCUMENTOS_LEGALES[documento].titulo}
      ancho="lectura"
      pie={
        <>
          <button type="button" className="legal__subir" onClick={() => window.scrollTo({ top: 0 })}>
            Volver arriba
          </button>
          <Link to={RUTAS_LEGALES[otro]} className="auth-enlace" onClick={() => window.scrollTo({ top: 0 })}>
            Ver también: {DOCUMENTOS_LEGALES[otro].titulo}
          </Link>
          {usuario ? (
            <Link to="/" className="auth-enlace">
              Volver a IKAMONEY
            </Link>
          ) : (
            <>
              <Link to="/registro" className="auth-enlace">
                Crear cuenta
              </Link>
              <Link to="/iniciar-sesion" className="auth-enlace">
                Iniciar sesión
              </Link>
            </>
          )}
        </>
      }
    >
      <DocumentoLegal key={documento} documento={documento} />
    </AuthLayout>
  )
}

export default LegalPage
