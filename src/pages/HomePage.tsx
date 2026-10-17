import Button from '../components/Button'
import Icon from '../components/Icon'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../hooks/useAuth'
import { useBackendStatus } from '../hooks/useBackendStatus'
import { API_URL } from '../services/api'
import { formatMoney } from '../utils/formatMoney'
import './HomePage.css'

/** Pantalla inicial (protegida): saludo, cierre de sesión y estado del backend. */
function HomePage() {
  const { usuario, cerrarSesion } = useAuth()
  const { api, db } = useBackendStatus()

  return (
    <main className="home">
      <header className="home__encabezado">
        <div>
          <h1>Hola, {usuario?.nombre.split(' ')[0]}</h1>
          <p className="home__subtitle">{usuario?.correo}</p>
        </div>
        <Button variante="secundario" onClick={() => cerrarSesion('manual')}>
          <Icon nombre="salir" tamano={20} />
          Cerrar sesión
        </Button>
      </header>

      <p className="home__subtitle">Ejemplo de formato de dinero: {formatMoney(3838)}</p>

      <section className="home__status">
        <h2>Estado del sistema</h2>
        <p className="home__api-url">
          Backend: <code>{API_URL}</code>
        </p>
        <StatusBadge label="API" result={api} />
        <StatusBadge label="Base de datos" result={db} />
      </section>
    </main>
  )
}

export default HomePage