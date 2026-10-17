import { Navigate, Route, Routes } from 'react-router'
import { RutaProtegida, RutaPublica } from './components/RutaProtegida'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import HomePage from './pages/HomePage'
import LegalPage from './pages/LegalPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ResetPasswordPage from './pages/ResetPasswordPage'

/** Rutas de la app. Las de cuenta son públicas; el resto requiere sesión. */
function App() {
  return (
    <Routes>
      <Route path="/iniciar-sesion" element={<RutaPublica><LoginPage /></RutaPublica>} />
      <Route path="/registro" element={<RutaPublica><RegisterPage /></RutaPublica>} />
      <Route path="/recuperar-contrasena" element={<RutaPublica><ForgotPasswordPage /></RutaPublica>} />
      <Route path="/restablecer-contrasena" element={<ResetPasswordPage />} />
      <Route path="/aviso-de-privacidad" element={<LegalPage titulo="Aviso de privacidad" />} />
      <Route path="/terminos-de-uso" element={<LegalPage titulo="Términos de uso" />} />

      <Route path="/" element={<RutaProtegida><HomePage /></RutaProtegida>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App