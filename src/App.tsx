import { useState } from 'react'
import HomePage from './pages/HomePage'
import MovementsPage from './pages/MovementsPage'
import './App.css'

type Page = 'inicio' | 'movimientos'

// Navegación simple por estado. Cuando haya más pantallas conviene cambiar a un enrutador.
function App() {
  const [page, setPage] = useState<Page>('movimientos')

  return (
    <>
      <nav className="app-nav" aria-label="Principal">
        {(['inicio', 'movimientos'] as const).map((p) => (
          <button key={p} type="button" aria-current={page === p ? 'page' : undefined} onClick={() => setPage(p)}>
            {p === 'inicio' ? 'Inicio' : 'Movimientos'}
          </button>
        ))}
      </nav>
      {page === 'inicio' ? <HomePage /> : <MovementsPage />}
    </>
  )
}

export default App
