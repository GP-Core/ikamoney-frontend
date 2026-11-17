import { alertasApi } from './alertasApi'
import type { AlertasService } from './alertasApi'
import { alertasMock } from './alertasMock'
import { MODO_PRUEBA } from './auth'
import { escribir } from './escribir'

/**
 * Servicio de alertas que usa toda la app. Usa el mismo interruptor que la autenticación
 * (VITE_AUTH_MOCK): con sesión de prueba no hay token real, así que los avisos también son de prueba.
 */
const servicio: AlertasService = MODO_PRUEBA ? alertasMock : alertasApi

export const alertasService: AlertasService = {
  ...servicio,
  marcarLeida: (id, leida) => escribir(() => servicio.marcarLeida(id, leida)),
  guardarConfiguracion: (cambios) => escribir(() => servicio.guardarConfiguracion(cambios)),
}
