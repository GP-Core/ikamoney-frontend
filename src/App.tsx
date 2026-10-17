import { Navigate, Route, Routes } from 'react-router'
import AppLayout from './components/AppLayout'
import { RutaProtegida, RutaPublica } from './components/RutaProtegida'
import DeudaFormPage from './pages/DeudaFormPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import HomePage from './pages/HomePage'
import LegalPage from './pages/LegalPage'
import LoginPage from './pages/LoginPage'
import PlanMsiFormPage from './pages/PlanMsiFormPage'
import RegisterPage from './pages/RegisterPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import TarjetaDetallePage from './pages/TarjetaDetallePage'
import TarjetaFormPage from './pages/TarjetaFormPage'
import TarjetasDeudasPage from './pages/TarjetasDeudasPage'

/** Rutas de la app. Las de cuenta son públicas; el resto requiere sesión y usa AppLayout. */
function App() {
  return (
    <Routes>
      <Route path="/iniciar-sesion" element={<RutaPublica><LoginPage /></RutaPublica>} />
      <Route path="/registro" element={<RutaPublica><RegisterPage /></RutaPublica>} />
      <Route path="/recuperar-contrasena" element={<RutaPublica><ForgotPasswordPage /></RutaPublica>} />
      <Route path="/restablecer-contrasena" element={<ResetPasswordPage />} />
      <Route path="/aviso-de-privacidad" element={<LegalPage titulo="Aviso de privacidad" />} />
      <Route path="/terminos-de-uso" element={<LegalPage titulo="Términos de uso" />} />

      <Route element={<RutaProtegida><AppLayout /></RutaProtegida>}>
        <Route path="/" element={<HomePage />} />
        <Route path="/tarjetas" element={<TarjetasDeudasPage />} />
        <Route path="/tarjetas/nueva" element={<TarjetaFormPage />} />
        <Route path="/tarjetas/:id" element={<TarjetaDetallePage />} />
        <Route path="/tarjetas/:id/editar" element={<TarjetaFormPage />} />
        <Route path="/tarjetas/:id/msi/nueva" element={<PlanMsiFormPage />} />
        <Route path="/tarjetas/:id/msi/:msiId/editar" element={<PlanMsiFormPage />} />
        <Route path="/deudas/nueva" element={<DeudaFormPage />} />
        <Route path="/deudas/:id/editar" element={<DeudaFormPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App