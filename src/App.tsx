import BalancePage from './pages/BalancePage'
import HomePage from './pages/HomePage'
import ScorePage from './pages/ScorePage'
import RankingPage from './pages/RankingPage'

function App() {
  const params = new URLSearchParams(window.location.search)
  // La pantalla de estado del sistema sigue disponible en /?sistema
  if (params.has('sistema')) return <HomePage />
  // Desglose del score (T37) en /?score
  if (params.has('score')) return <ScorePage />
  // Ranking de usuarios en /?ranking
  if (params.has('ranking')) return <RankingPage />
  return <BalancePage />
}

export default App
