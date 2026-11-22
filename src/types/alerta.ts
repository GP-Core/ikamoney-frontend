/** Contrato de /api/v1/alertas (T47). Fechas sin zona horaria, en hora de México. */

export type Severidad = 'atencion' | 'critica'

export type ReglaAlerta = 'AL-01' | 'AL-02' | 'AL-03' | 'AL-04'

export interface Alerta {
  id: number
  regla: ReglaAlerta
  severidad: Severidad
  titulo: string
  mensaje: string
  /** Qué puede hacer la persona. */
  accion: string
  /** 'proyeccion', 'tarjeta:7' o 'tarjeta:7:2026-04-30'. */
  referencia: string
  estado: 'activa' | 'resuelta'
  leida: boolean
  creada_en: string
  resuelta_en: string | null
}

export interface ListaAlertas {
  total: number
  /** Siempre cuenta las activas sin leer, sin importar el filtro. Es el número de la campana. */
  sin_leer: number
  alertas: Alerta[]
}

export interface CanalesAlertas {
  correo: boolean
  push: boolean
}

export interface ConfiguracionAlertas {
  umbral_utilizacion: number
  dias_anticipacion: number
  canales: CanalesAlertas
}

/** PUT parcial: solo lo que cambió. */
export interface ConfiguracionEdicion {
  umbral_utilizacion?: number
  dias_anticipacion?: number
  canales?: Partial<CanalesAlertas>
}

/** Suscripción push de este dispositivo, con el formato de PushSubscription.toJSON() que espera el backend. */
export interface SuscripcionPush {
  endpoint: string
  keys: { p256dh: string; auth: string }
}
