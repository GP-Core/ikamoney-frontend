import { Link } from 'react-router'
import Icon from './Icon'
import './AlertasVacio.css'

/** Sin avisos: se explica qué aparecerá aquí en lugar de dejar una pantalla en blanco (T48). */
function AlertasVacio() {
  return (
    <section className="alertas-vacio" aria-labelledby="alertas-vacio-titulo">
      <Icon nombre="sano" tamano={48} />
      <h2 id="alertas-vacio-titulo" className="alertas-vacio__titulo">
        No tienes avisos
      </h2>
      <p className="alertas-vacio__texto">
        Aquí te avisaremos cuando una tarjeta use buena parte de su límite, cuando se acerque una fecha de pago o cuando
        tus compromisos de un mes superen tus ingresos.
      </p>
      <Link to="/alertas/configuracion" className="alertas-vacio__enlace">
        Elegir cuándo avisarme
      </Link>
    </section>
  )
}

export default AlertasVacio
