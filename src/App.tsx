import BalancePage from './pages/BalancePage'
import HomePage from './pages/HomePage'
import ScorePage from './pages/ScorePage'

function App() {
  const params = new URLSearchParams(window.location.search)
  // La pantalla de estado del sistema sigue disponible en /?sistema
  if (params.has('sistema')) return <HomePage />
  // Desglose del score (T37) en /?score
  if (params.has('score')) return <ScorePage />
  return <BalancePage />
}

export default App