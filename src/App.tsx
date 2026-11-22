import { Navigate, Route, Routes } from 'react-router'
import AppLayout from './components/AppLayout'
import AvisoActualizacion from './components/AvisoActualizacion'
import { RutaProtegida, RutaPublica } from './components/RutaProtegida'
import SoloConConexion from './components/SoloConConexion'
import { AlertasProvider } from './context/alertasProvider'
import { useActualizacionPwa } from './hooks/useActualizacionPwa'
import AlertasConfigPage from './pages/AlertasConfigPage'
import AlertasPage from './pages/AlertasPage'
import BalancePage from './pages/BalancePage'
import CuentaPage from './pages/CuentaPage'
import CuentasPage from './pages/CuentasPage'
import DeudaFormPage from './pages/DeudaFormPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import HomePage from './pages/HomePage'
import LegalPage from './pages/LegalPage'
import LoginPage from './pages/LoginPage'
import MovimientosPage from './pages/MovimientosPage'
import PlanMsiFormPage from './pages/PlanMsiFormPage'
import PlanPage from './pages/PlanPage'
import RegisterPage from './pages/RegisterPage'
import RevisionEstadoCuenta from './pages/RevisionEstadoCuenta'
import ResetPasswordPage from './pages/ResetPasswordPage'
import ScorePage from './pages/ScorePage'
import TarjetaDetallePage from './pages/TarjetaDetallePage'
import TarjetaFormPage from './pages/TarjetaFormPage'
import TarjetasDeudasPage from './pages/TarjetasDeudasPage'
import RankingPage from './pages/RankingPage'
import SimuladorPage from './pages/SimuladorPage'

/** Rutas de la app. Las de cuenta son públicas; el resto requiere sesión y usa AppLayout. */
function App() {
  const pwa = useActualizacionPwa()

  return (
    <>
      <Routes>
        <Route path="/iniciar-sesion" element={<RutaPublica><LoginPage /></RutaPublica>} />
        <Route path="/registro" element={<RutaPublica><RegisterPage /></RutaPublica>} />
        <Route path="/recuperar-contrasena" element={<RutaPublica><ForgotPasswordPage /></RutaPublica>} />
        <Route path="/restablecer-contrasena" element={<ResetPasswordPage />} />
        <Route path="/aviso-de-privacidad" element={<LegalPage documento="privacidad" />} />
        <Route path="/terminos-de-uso" element={<LegalPage documento="terminos" />} />

        <Route
          element={
            <RutaProtegida>
              <AlertasProvider>
                <AppLayout />
              </AlertasProvider>
            </RutaProtegida>
          }
        >
          <Route path="/" element={<HomePage />} />
          <Route path="/balance" element={<BalancePage />} />
          <Route path="/score" element={<ScorePage />} />
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/simulador" element={<SimuladorPage />} />
          <Route path="/tarjetas" element={<TarjetasDeudasPage />} />
          {/* Los formularios escriben datos: sin conexión no se muestran (T60, solo lectura). */}
          <Route path="/tarjetas/nueva" element={<SoloConConexion><TarjetaFormPage /></SoloConConexion>} />
          <Route path="/tarjetas/:id" element={<TarjetaDetallePage />} />
          <Route path="/tarjetas/:id/editar" element={<SoloConConexion><TarjetaFormPage /></SoloConConexion>} />
          <Route path="/tarjetas/:id/msi/nueva" element={<SoloConConexion><PlanMsiFormPage /></SoloConConexion>} />
          <Route path="/tarjetas/:id/msi/:msiId/editar" element={<SoloConConexion><PlanMsiFormPage /></SoloConConexion>} />
          <Route path="/deudas/nueva" element={<SoloConConexion><DeudaFormPage /></SoloConConexion>} />
          <Route path="/deudas/:id/editar" element={<SoloConConexion><DeudaFormPage /></SoloConConexion>} />
          <Route path="/movimientos" element={<MovimientosPage />} />
          <Route path="/cuentas" element={<CuentasPage />} />
          <Route path="/estado-cuenta" element={<SoloConConexion><RevisionEstadoCuenta /></SoloConConexion>} />
          <Route path="/alertas" element={<AlertasPage />} />
          <Route path="/alertas/configuracion" element={<SoloConConexion regresar={{ a: '/alertas', texto: 'Volver a los avisos' }}><AlertasConfigPage /></SoloConConexion>} />
          <Route path="/cuenta" element={<CuentaPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {pwa.hayVersionNueva ? (
        <AvisoActualizacion tipo="version-nueva" onActualizar={pwa.actualizar} onCerrar={pwa.cerrar} />
      ) : (
        pwa.listaSinConexion && <AvisoActualizacion tipo="sin-conexion" onCerrar={pwa.cerrar} />
      )}
    </>
  )
}

export default App
