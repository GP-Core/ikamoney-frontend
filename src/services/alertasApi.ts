import type { Alerta, ConfiguracionAlertas, ConfiguracionEdicion, ListaAlertas, SuscripcionPush } from '../types/alerta'
import { apiFetch } from './api'

/**
 * Operaciones del centro de notificaciones y de la configuración de alertas (T48, T49).
 * La implementación real habla con el backend; la de prueba (alertasMock.ts) simula el mismo contrato.
 */
export interface AlertasService {
  /** Alertas activas, más recientes primero, con el total sin leer. */
  listar(): Promise<ListaAlertas>
  marcarLeida(id: number, leida: boolean): Promise<Alerta>
  obtenerConfiguracion(): Promise<ConfiguracionAlertas>
  guardarConfiguracion(cambios: ConfiguracionEdicion): Promise<ConfiguracionAlertas>
  /** Registra este dispositivo para recibir notificaciones push (T50). */
  registrarPush(suscripcion: SuscripcionPush): Promise<void>
  /** Quita este dispositivo de las notificaciones push. No falla si ya no existía. */
  quitarPush(endpoint: string): Promise<void>
}

const json = (metodo: 'PUT' | 'PATCH' | 'POST' | 'DELETE', datos: unknown): RequestInit => ({ method: metodo, body: JSON.stringify(datos) })

/** Implementación real sobre /api/v1/alertas. */
export const alertasApi: AlertasService = {
  listar: () => apiFetch<ListaAlertas>('/v1/alertas?estado=activa'),
  marcarLeida: (id, leida) => apiFetch<Alerta>(`/v1/alertas/${encodeURIComponent(String(id))}`, json('PATCH', { leida })),
  obtenerConfiguracion: () => apiFetch<ConfiguracionAlertas>('/v1/alertas/configuracion'),
  guardarConfiguracion: (cambios) => apiFetch<ConfiguracionAlertas>('/v1/alertas/configuracion', json('PUT', cambios)),
  registrarPush: (suscripcion) => apiFetch<void>('/v1/notificaciones/suscripcion', json('POST', suscripcion)),
  quitarPush: (endpoint) => apiFetch<void>('/v1/notificaciones/suscripcion', json('DELETE', { endpoint })),
}
