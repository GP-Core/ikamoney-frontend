import { Link } from 'react-router'
import type { Alerta } from '../types/alerta'
import { destinoDeAlerta, tipoDeSeveridad } from '../utils/alertas'
import Button from './Button'
import Icon from './Icon'
import './AlertaItem.css'

const FORMATO = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' })

/** creada_en llega en hora de México sin zona: se lee como hora local, no como UTC. */
const fechaDe = (texto: string) => {
  const fecha = new Date(texto)
  return Number.isNaN(fecha.getTime()) ? '' : FORMATO.format(fecha)
}

const PALABRA = { precaucion: 'Atención', critico: 'Importante' } as const

interface AlertaItemProps {
  alerta: Alerta
  /** Sin conexión no se puede guardar el cambio de estado. */
  sinConexion?: boolean
  onMarcar: (leida: boolean) => void
  /** Se llama al seguir el enlace de acción: abrirla cuenta como leída. */
  onAbrirAccion: () => void
}

/**
 * Un aviso (T48): qué pasó, cuándo y qué hacer. Ícono, palabra y borde del color del estado (T20),
 * así que nunca depende solo del color. Las no leídas llevan la etiqueta "Nuevo" y letra más gruesa.
 */
function AlertaItem({ alerta, sinConexion = false, onMarcar, onAbrirAccion }: AlertaItemProps) {
  const tipo = tipoDeSeveridad(alerta.severidad)
  const destino = destinoDeAlerta(alerta)

  return (
    <li className={`aviso aviso--${tipo} ${alerta.leida ? 'aviso--leida' : 'aviso--nueva'}`}>
      <span className="aviso__icono">
        <Icon nombre={tipo} tamano={22} />
      </span>
      <div className="aviso__cuerpo">
        <p className="aviso__estado">
          <strong>{PALABRA[tipo]}</strong>
          {!alerta.leida && <span className="aviso__nuevo">Nuevo</span>}
        </p>
        <h2 className="aviso__titulo">{alerta.titulo}</h2>
        <p className="aviso__mensaje">{alerta.mensaje}</p>
        <p className="aviso__accion">{alerta.accion}</p>
        <p className="aviso__fecha">{fechaDe(alerta.creada_en)}</p>
        <div className="aviso__acciones">
          <Link to={destino.a} className="aviso__enlace" onClick={onAbrirAccion}>
            {destino.texto}
          </Link>
          <Button
            variante="secundario"
            onClick={() => onMarcar(!alerta.leida)}
            disabled={sinConexion}
            title={sinConexion ? 'Sin conexión' : undefined}
          >
            {alerta.leida ? 'Marcar como no leída' : 'Marcar como leída'}
          </Button>
        </div>
      </div>
    </li>
  )
}

export default AlertaItem
