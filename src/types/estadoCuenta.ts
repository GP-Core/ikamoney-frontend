// Tipos del estado de cuenta (T31 y T32). La respuesta de /extraer está en camelCase y con null
// en lo que no vino en el PDF; ver docs/ESTADOS_CUENTA.md del backend.

export interface TarjetaExtraida {
  banco: string | null
  limiteCredito: number | null
  saldoActual: number | null
  tasaAnual: number | null
  pagoMinimo: number | null
  pagoNoIntereses: number | null
  diaCorte: number | null
  diaLimitePago: number | null
}

export interface MsiExtraido {
  descripcion: string
  montoTotal: number | null
  meses: number | null
  mensualidadesPagadas: number | null
}

export interface MovimientoExtraido {
  fecha: string // AAAA-MM-DD
  concepto: string
  monto: number
}

/** GET /api/v1/estados-cuenta/cupo: lecturas con IA gratis (H-04). snake_case, como el resto de la API. */
export interface CupoExtraccion {
  limite: number
  usados: number
  restantes: number
}

/** Respuesta de POST /api/v1/estados-cuenta/extraer: no guarda nada, solo lo que leyó la IA. */
export interface RespuestaExtraccion {
  tarjeta: TarjetaExtraida
  msi: MsiExtraido[]
  movimientos: MovimientoExtraido[]
}

/** Lo que el usuario revisó y confirmó en pantalla. */
export interface PayloadConfirmar {
  tarjeta: TarjetaExtraida | null
  movimientos: {
    fecha: string
    concepto: string
    monto: number | null
    origen: 'extraido' | 'manual'
    editadoPorUsuario: boolean
    /** Lo que leyó la IA antes de que el usuario lo corrigiera; null en las filas capturadas a mano. */
    original: { fecha: string; concepto: string; monto: number } | null
  }[]
  msi: {
    descripcion: string
    montoTotal: number | null
    meses: number | null
    mensualidadesPagadas: number
    fechaCompra: string | null
    origen: 'extraido' | 'manual'
    editadoPorUsuario: boolean
  }[]
}

/** A qué tarjeta se aplica lo revisado: una que ya existe o una nueva con el nombre que elija el usuario. */
export type DestinoTarjeta = { tipo: 'existente'; id: number } | { tipo: 'nueva'; nombre: string }

/** Lo que acompaña a la revisión al guardarla: la clave hace que reintentar no duplique (N1). */
export interface EnvioConfirmacion {
  claveConfirmacion: string
  /** AAAA-MM-DD: /extraer solo da el día de corte y el estado de cuenta necesita la fecha completa. */
  fechaCorte: string
}

export interface ResultadoGuardado {
  estadoCuentaId?: number
  tarjetaId: number
  tarjetaNueva: boolean
  planesCreados: number
  movimientosGuardados: number
}
