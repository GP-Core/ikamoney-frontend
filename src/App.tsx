import BalancePage from './pages/BalancePage'
import HomePage from './pages/HomePage'

function App() {
  // La pantalla de estado del sistema sigue disponible en /?sistema
  if (new URLSearchParams(window.location.search).has('sistema')) return <HomePage />
  return <BalancePage />
}

export default App
