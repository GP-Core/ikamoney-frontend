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

export interface ResultadoGuardado {
  tarjetaId: number
  tarjetaNueva: boolean
  planesCreados: number
  /** Movimientos sueltos que no se guardaron: todavía no hay dónde (falta POST /estados-cuenta/confirmar). */
  movimientosSinGuardar: number
}
