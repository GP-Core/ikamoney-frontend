import { useState } from 'react'
import { Link } from 'react-router'
import AlertaItem from '../components/AlertaItem'
import AlertasVacio from '../components/AlertasVacio'
import EncabezadoPagina from '../components/EncabezadoPagina'
import EstadoCarga from '../components/EstadoCarga'
import FechaCopia from '../components/FechaCopia'
import FormAlert from '../components/FormAlert'
import Icon from '../components/Icon'
import NotaSinConexion from '../components/NotaSinConexion'
import { useAlertas } from '../hooks/useAlertas'
import { useConexion } from '../hooks/useConexion'
import { mensajeError } from '../utils/errores'
import { ordenarAlertas } from '../utils/alertas'
import './Finanzas.css'
import './AlertasPage.css'

/** Centro de notificaciones (T48): qué pasó, cuándo y qué hacer al respecto. */
function AlertasPage() {
  const { alertas, sinLeer, cargando, error, copiaDe, marcarLeida } = useAlertas()
  const enLinea = useConexion()
  const [errorAccion, setErrorAccion] = useState<string | null>(null)

  async function marcar(id: number, leida: boolean) {
    setErrorAccion(null)
    try {
      await marcarLeida(id, leida)
    } catch (e) {
      setErrorAccion(mensajeError(e))
    }
  }

  if (!alertas) {
    return <EstadoCarga error={cargando ? null : error} regresar={{ a: '/', texto: 'Volver al inicio' }} />
  }

  const lista = ordenarAlertas(alertas)

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo="Avisos"
        subtitulo={sinLeer > 0 ? `Tienes ${sinLeer} ${sinLeer === 1 ? 'aviso nuevo' : 'avisos nuevos'}.` : 'Estás al día.'}
      />

      <Link to="/alertas/configuracion" className="alertas-pagina__ajustes">
        <Icon nombre="ajustes" tamano={20} />
        Elegir cuándo avisarme
      </Link>

      <FechaCopia fecha={copiaDe} />
      {error && <FormAlert tipo="precaucion">{error}</FormAlert>}
      {errorAccion && <FormAlert tipo="critico">{errorAccion}</FormAlert>}

      {lista.length === 0 ? (
        <AlertasVacio />
      ) : (
        <ul className="alertas-pagina__lista" aria-label="Lista de avisos">
          {lista.map((alerta) => (
            <AlertaItem
              key={alerta.id}
              alerta={alerta}
              sinConexion={!enLinea}
              onMarcar={(leida) => void marcar(alerta.id, leida)}
              onAbrirAccion={() => {
                if (!alerta.leida && enLinea) void marcarLeida(alerta.id, true).catch(() => {})
              }}
            />
          ))}
        </ul>
      )}
      <NotaSinConexion />
    </div>
  )
}

export default AlertasPage
