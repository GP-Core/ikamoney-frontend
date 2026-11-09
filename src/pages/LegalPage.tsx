import { Link } from 'react-router'
import AuthLayout from '../components/AuthLayout'

interface LegalPageProps {
  titulo: string
}

/** Lugar temporal para el aviso de privacidad y los términos de uso (se redactan en T55). */
function LegalPage({ titulo }: LegalPageProps) {
  return (
    <AuthLayout
      titulo={titulo}
      pie={
        <Link to="/registro" className="auth-enlace">
          Volver al registro
        </Link>
      }
    >
      <p>
        Este documento está en elaboración (tarea T55). Aquí se explicará qué datos se recaban, para qué se usan, cómo
        se protegen y cómo eliminarlos.
      </p>
    </AuthLayout>
  )
}

export default LegalPage