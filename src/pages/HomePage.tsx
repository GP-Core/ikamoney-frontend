import StatusBadge from '../components/StatusBadge'
import { useBackendStatus } from '../hooks/useBackendStatus'
import { API_URL } from '../services/api'
import { formatMoney } from '../utils/formatMoney'
import './HomePage.css'

/** Pantalla inicial: muestra si el frontend se conecta con el backend. */
function HomePage() {
  const { api, db } = useBackendStatus()

  return (
    <main className="home">
      <h1>IKAMoney</h1>
      <p className="home__subtitle">
        Ejemplo de formato de dinero: {formatMoney(1250000)}
      </p>

      <section className="home__status">
        <h2>Estado del sistema</h2>
        <p className="home__api-url">
          Backend: oki
        </p>
        <StatusBadge label="API" result={api} />
        <StatusBadge label="Base de datos" result={db} />
      </section>
    </main>
  )
}

export default HomePage
