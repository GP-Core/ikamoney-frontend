// Conexión con el backend de estados de cuenta (T31).
// Contrato: docs/ESTADOS_CUENTA.md del backend.

const API: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

// AJUSTAR: usa aquí la misma forma en que tu app ya guarda el JWT.
const obtenerToken = (): string | null => localStorage.getItem('token')

// ---------- Tipos de la respuesta de /extraer (camelCase, null = no vino en el PDF) ----------
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

export interface RespuestaExtraccion {
  tarjeta: TarjetaExtraida
  msi: MsiExtraido[]
  movimientos: MovimientoExtraido[]
}

// ---------- Errores ----------
export interface CampoError {
  campo: string
  mensaje: string
}

export class ErrorApi extends Error {
  status: number
  codigo: string
  campos: CampoError[]

  constructor(status: number, codigo: string, mensaje: string, campos: CampoError[] = []) {
    super(mensaje)
    this.status = status
    this.codigo = codigo
    this.campos = campos
  }

  // Errores donde tiene sentido volver a intentar con el mismo PDF.
  get reintentable(): boolean {
    return this.codigo === 'IA_NO_DISPONIBLE' || this.codigo === 'SIN_CONEXION'
  }
}

async function leerError(respuesta: Response): Promise<ErrorApi> {
  try {
    const j = await respuesta.json()
    return new ErrorApi(respuesta.status, j.codigo ?? 'ERROR', j.mensaje ?? 'Algo salió mal.', j.campos ?? [])
  } catch {
    return new ErrorApi(
      respuesta.status,
      'ERROR',
      'No pudimos completar la operación. Puedes capturar los datos a mano.',
    )
  }
}

async function peticion<T>(ruta: string, opciones: RequestInit): Promise<T> {
  let respuesta: Response
  try {
    respuesta = await fetch(`${API}/api/v1${ruta}`, {
      ...opciones,
      headers: { Authorization: `Bearer ${obtenerToken()}`, ...(opciones.headers ?? {}) },
    })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e
    throw new ErrorApi(
      0,
      'SIN_CONEXION',
      'No pudimos conectar con el servidor. Revisa tu conexión o captura los datos a mano.',
    )
  }
  if (!respuesta.ok) throw await leerError(respuesta)
  return respuesta.json() as Promise<T>
}

/** POST /estados-cuenta/extraer — no guarda nada, solo devuelve lo que leyó la IA. */
export function extraerEstadoCuenta(archivoPdf: File, opciones: { signal?: AbortSignal } = {}) {
  const datos = new FormData()
  datos.append('archivo', archivoPdf)
  // Sin Content-Type: el navegador pone el boundary del multipart.
  return peticion<RespuestaExtraccion>('/estados-cuenta/extraer', {
    method: 'POST',
    body: datos,
    signal: opciones.signal,
  })
}

// ---------- Confirmar ----------
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

/**
 * POST /estados-cuenta/confirmar — guarda todo como definitivo.
 * OJO: este endpoint NO existe todavía en el zip de T31 ("fuera de esta tarea" en la doc).
 * El payload es la propuesta de contrato; cuando backend lo defina, solo se ajusta aquí
 * y en aPayload() de utils/revisionEstado.ts.
 */
export function confirmarEstadoCuenta(payload: PayloadConfirmar) {
  return peticion<unknown>('/estados-cuenta/confirmar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}