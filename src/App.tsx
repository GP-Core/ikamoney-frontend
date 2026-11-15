import AvisoActualizacion from './components/AvisoActualizacion'
import { useActualizacionPwa } from './hooks/useActualizacionPwa'
import BalancePage from './pages/BalancePage'
import HomePage from './pages/HomePage'
import PlanPage from './pages/PlanPage'
import ScorePage from './pages/ScorePage'

function App() {
  const params = new URLSearchParams(window.location.search)
  const pwa = useActualizacionPwa()

  // /?sistema -> estado del sistema; /?score -> desglose del score (T37); /?plan -> plan de pago; resto -> balance
  let pagina = <BalancePage />
  if (params.has('sistema')) pagina = <HomePage />
  else if (params.has('score')) pagina = <ScorePage />
  else if (params.has('plan')) pagina = <PlanPage />

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
