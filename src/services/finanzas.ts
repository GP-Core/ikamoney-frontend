import { MODO_PRUEBA } from './auth'
import { finanzasApi } from './finanzasApi'
import type { FinanzasService } from './finanzasApi'
import { finanzasMock } from './finanzasMock'

/**
 * Servicio de tarjetas y deudas que usa toda la app.
 * Usa el mismo interruptor que la autenticación (VITE_AUTH_MOCK): con sesión de prueba
 * no hay token real, así que los datos también tienen que ser de prueba.
 */
export const finanzasService: FinanzasService = MODO_PRUEBA ? finanzasMock : finanzasApi