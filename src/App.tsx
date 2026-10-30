import AvisoActualizacion from './components/AvisoActualizacion'
import { useActualizacionPwa } from './hooks/useActualizacionPwa'
import BalancePage from './pages/BalancePage'
import HomePage from './pages/HomePage'

function App() {
  const pwa = useActualizacionPwa()
  // La pantalla de estado del sistema sigue disponible en /?sistema
  const pagina = new URLSearchParams(window.location.search).has('sistema') ? <HomePage /> : <BalancePage />

  return (
    <>
      {pagina}
      {pwa.hayVersionNueva ? (
        <AvisoActualizacion tipo="version-nueva" onActualizar={pwa.actualizar} onCerrar={pwa.cerrar} />
      ) : (
        pwa.listaSinConexion && <AvisoActualizacion tipo="sin-conexion" onCerrar={pwa.cerrar} />
      )}
    </>
  )
}

export default App
