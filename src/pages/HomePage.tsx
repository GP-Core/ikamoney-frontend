import { Link } from 'react-router'
import Icon from '../components/Icon'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../hooks/useAuth'
import { useBackendStatus } from '../hooks/useBackendStatus'
import { API_URL } from '../services/api'
import { formatMoney } from '../utils/formatMoney'
import './HomePage.css'

/** Pantalla inicial (protegida): saludo, acceso a tarjetas y deudas, y estado del backend. */
function HomePage() {
  const { usuario } = useAuth()
  const { api, db } = useBackendStatus()

  return (
    <div className="home">
      <header className="home__encabezado">
        <h1>Hola, {usuario?.nombre.split(' ')[0]}</h1>
        <p className="home__subtitle">{usuario?.correo}</p>
      </header>

      <Link to="/tarjetas" className="home__acceso">
        <Icon nombre="tarjeta" />
        <span>
          <strong>Tarjetas y deudas</strong>
          <span className="home__acceso-texto">Registra tus tarjetas, compras a MSI y préstamos.</span>
        </span>
      </Link>

      <p className="home__subtitle">Ejemplo de formato de dinero: {formatMoney(3838)}</p>

      <section className="home__status">
        <h2>Estado del sistema</h2>
        <p className="home__api-url">
          Backend: <code>{API_URL}</code>
        </p>
        <StatusBadge label="API" result={api} />
        <StatusBadge label="Base de datos" result={db} />
      </section>
    </div>
  )
}

export default HomePage