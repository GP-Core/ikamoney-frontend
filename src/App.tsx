import { useState } from 'react'
import HomePage from './pages/HomePage'
import RevisionEstadoCuenta from './pages/RevisionEstadoCuenta'
import './App.css'

type Page = 'inicio' | 'movimientos' | 'estado-cuenta'

const PAGES: { id: Page; label: string }[] = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'movimientos', label: 'Movimientos' },
  { id: 'estado-cuenta', label: 'Estado de cuenta' },
]

// Navegación simple por estado. Cuando haya más pantallas conviene cambiar a un enrutador.
function App() {
  const [page, setPage] = useState<Page>('movimientos')

  return (
    <>
      <nav className="app-nav" aria-label="Principal">
        {PAGES.map((p) => (
          <button key={p.id} type="button" aria-current={page === p.id ? 'page' : undefined} onClick={() => setPage(p.id)}>
            {p.label}
          </button>
        ))}
      </nav>
      {page === 'inicio' && <HomePage />}
      {page === 'estado-cuenta' && <RevisionEstadoCuenta onGuardado={() => setPage('movimientos')} />}
    </>
  )
}

export default App