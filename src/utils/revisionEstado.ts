// Lógica de la pantalla de revisión (T32), sin React.
// Una "fila" une los movimientos y los MSI que devuelve la IA en una sola lista editable.
import type {
  MovimientoExtraido, MsiExtraido, PayloadConfirmar, RespuestaExtraccion,
} from '../api/estadosCuenta'

// ---------- Tipos ----------
/** Lo que puede haber en un input: texto mientras se escribe, número si vino de la IA, null si no hay. */
export type Campo = string | number | null

export interface DatosFila {
  fecha: Campo
  concepto: string
  monto: Campo
  esMsi: boolean
  meses: Campo
  mensualidadesPagadas: Campo
}

export interface Fila extends DatosFila {
  id: string
  origen: 'ia' | 'manual'
  original: DatosFila | null // lo que dijo la IA; null si la fila es manual
}

export type CampoFila = keyof DatosFila
export type CampoFilaTexto = Exclude<CampoFila, 'esMsi'>
export type EstadoFila = 'ia' | 'editado' | 'agregado'

export type CampoTarjeta =
  | 'banco' | 'limiteCredito' | 'saldoActual' | 'tasaAnual'
  | 'pagoMinimo' | 'pagoNoIntereses' | 'diaCorte' | 'diaLimitePago'
export type DatosTarjeta = Record<CampoTarjeta, Campo>

export interface EstadoTarjeta {
  valores: DatosTarjeta
  original: DatosTarjeta | null
}

export interface EstadoDatos {
  tarjeta: EstadoTarjeta | null
  filas: Fila[]
  ultimaEliminada: { fila: Fila; indice: number } | null
}

export interface Errores {
  filas: Record<string, Partial<Record<CampoFila, string>>>
  tarjeta: Partial<Record<CampoTarjeta, string>>
  total: number
}

export const CAMPOS_FILA: CampoFila[] = [
  'fecha', 'concepto', 'monto', 'esMsi', 'meses', 'mensualidadesPagadas',
]

export const CAMPOS_TARJETA: { campo: CampoTarjeta; etiqueta: string; tipo: 'text' | 'number' | 'dia' }[] = [
  { campo: 'banco', etiqueta: 'Banco', tipo: 'text' },
  { campo: 'limiteCredito', etiqueta: 'Límite de crédito', tipo: 'number' },
  { campo: 'saldoActual', etiqueta: 'Saldo al corte', tipo: 'number' },
  { campo: 'tasaAnual', etiqueta: 'Tasa anual (%)', tipo: 'number' },
  { campo: 'pagoMinimo', etiqueta: 'Pago mínimo', tipo: 'number' },
  { campo: 'pagoNoIntereses', etiqueta: 'Pago para no generar intereses', tipo: 'number' },
  { campo: 'diaCorte', etiqueta: 'Día de corte', tipo: 'dia' },
  { campo: 'diaLimitePago', etiqueta: 'Día límite de pago', tipo: 'dia' },
]

const TARJETA_VACIA: DatosTarjeta = {
  banco: null, limiteCredito: null, saldoActual: null, tasaAnual: null,
  pagoMinimo: null, pagoNoIntereses: null, diaCorte: null, diaLimitePago: null,
}

let contador = 0
const nuevoId = () => `fila-${++contador}`

// ---------- Normalización para comparar ----------
const norm = (v: unknown): number | string | null => {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'number') return v
  const n = Number(v)
  return Number.isNaN(n) ? String(v) : n
}
export const igual = (a: unknown, b: unknown): boolean => norm(a) === norm(b)

// ---------- Construcción de filas ----------
export function filaDesdeMovimiento(m: MovimientoExtraido): Fila {
  const base: DatosFila = {
    fecha: m.fecha, concepto: m.concepto, monto: m.monto,
    esMsi: false, meses: null, mensualidadesPagadas: null,
  }
  return { id: nuevoId(), origen: 'ia', original: { ...base }, ...base }
}

export function filaDesdeMsi(m: MsiExtraido): Fila {
  // La extracción no trae fecha para los MSI.
  const base: DatosFila = {
    fecha: null, concepto: m.descripcion, monto: m.montoTotal,
    esMsi: true, meses: m.meses, mensualidadesPagadas: m.mensualidadesPagadas,
  }
  return { id: nuevoId(), origen: 'ia', original: { ...base }, ...base }
}

export function filaManual(): Fila {
  return {
    id: nuevoId(), origen: 'manual', original: null,
    fecha: '', concepto: '', monto: '', esMsi: false, meses: '', mensualidadesPagadas: '',
  }
}

// ---------- Marcas visuales ----------
/** "ia" = sin tocar · "editado" = vino de la IA y el usuario la cambió · "agregado" = capturada a mano */
export function estadoDeFila(fila: Fila): EstadoFila {
  if (fila.origen === 'manual' || !fila.original) return 'agregado'
  const original = fila.original
  return CAMPOS_FILA.every((c) => igual(fila[c], original[c])) ? 'ia' : 'editado'
}

export const campoCambiado = (fila: Fila, campo: CampoFila): boolean =>
  fila.original ? !igual(fila[campo], fila.original[campo]) : false

export const campoTarjetaCambiado = (tarjeta: EstadoTarjeta, campo: CampoTarjeta): boolean =>
  tarjeta.original ? !igual(tarjeta.valores[campo], tarjeta.original[campo]) : false

export const tarjetaEditada = (tarjeta: EstadoTarjeta): boolean =>
  tarjeta.original ? CAMPOS_TARJETA.some((c) => campoTarjetaCambiado(tarjeta, c.campo)) : false

// ---------- Validación ----------
const esEntero = (v: number) => Number.isInteger(v)

export function validar({ filas, tarjeta }: Pick<EstadoDatos, 'filas' | 'tarjeta'>): Errores {
  const errores: Errores = { filas: {}, tarjeta: {}, total: 0 }
  const errorFila = (id: string, campo: CampoFila, msg: string) => {
    ;(errores.filas[id] ??= {})[campo] = msg
    errores.total++
  }

  for (const f of filas) {
    if (!f.concepto.trim()) errorFila(f.id, 'concepto', 'Escribe el concepto.')
    const monto = norm(f.monto)
    if (typeof monto !== 'number' || monto <= 0) errorFila(f.id, 'monto', 'Debe ser mayor a 0.')
    if (!f.esMsi && !f.fecha) errorFila(f.id, 'fecha', 'Elige la fecha.')
    if (f.esMsi) {
      const meses = norm(f.meses)
      if (typeof meses !== 'number' || !esEntero(meses) || meses < 2)
        errorFila(f.id, 'meses', 'Mínimo 2 meses.')
      const pagadas = norm(f.mensualidadesPagadas) ?? 0
      if (typeof pagadas !== 'number' || !esEntero(pagadas) || pagadas < 0 ||
          (typeof meses === 'number' && pagadas > meses))
        errorFila(f.id, 'mensualidadesPagadas', 'Entre 0 y el total de meses.')
    }
  }

  if (tarjeta) {
    for (const { campo, etiqueta, tipo } of CAMPOS_TARJETA) {
      const v = norm(tarjeta.valores[campo])
      if (v === null || tipo === 'text') continue
      if (typeof v !== 'number' || v < 0) {
        errores.tarjeta[campo] = `${etiqueta}: número válido.`
        errores.total++
      } else if (tipo === 'dia' && (!esEntero(v) || v < 1 || v > 31)) {
        errores.tarjeta[campo] = 'Día entre 1 y 31.'
        errores.total++
      }
    }
  }
  return errores
}

// ---------- Payload para confirmar ----------
const num = (v: unknown): number | null => {
  const n = norm(v)
  return typeof n === 'number' ? Math.round(n * 100) / 100 : null
}

export function aPayload({ filas, tarjeta }: Pick<EstadoDatos, 'filas' | 'tarjeta'>): PayloadConfirmar {
  const origen = (f: Fila): 'extraido' | 'manual' => (f.origen === 'manual' ? 'manual' : 'extraido')
  return {
    tarjeta: tarjeta && {
      banco: String(tarjeta.valores.banco ?? '').trim() || null,
      limiteCredito: num(tarjeta.valores.limiteCredito),
      saldoActual: num(tarjeta.valores.saldoActual),
      tasaAnual: num(tarjeta.valores.tasaAnual),
      pagoMinimo: num(tarjeta.valores.pagoMinimo),
      pagoNoIntereses: num(tarjeta.valores.pagoNoIntereses),
      diaCorte: num(tarjeta.valores.diaCorte),
      diaLimitePago: num(tarjeta.valores.diaLimitePago),
    },
    movimientos: filas.filter((f) => !f.esMsi).map((f) => ({
      fecha: String(f.fecha ?? ''), concepto: f.concepto.trim(), monto: num(f.monto),
      origen: origen(f), editadoPorUsuario: estadoDeFila(f) !== 'ia',
    })),
    msi: filas.filter((f) => f.esMsi).map((f) => ({
      descripcion: f.concepto.trim(), montoTotal: num(f.monto), meses: num(f.meses),
      mensualidadesPagadas: num(f.mensualidadesPagadas) ?? 0,
      fechaCompra: f.fecha ? String(f.fecha) : null,
      origen: origen(f), editadoPorUsuario: estadoDeFila(f) !== 'ia',
    })),
  }
}

// ---------- Reducer ----------
export type Accion =
  | { type: 'CARGAR'; respuesta: RespuestaExtraccion }
  | { type: 'MANUAL' }
  | { type: 'EDITAR_FILA'; id: string; campo: CampoFila; valor: Campo | boolean }
  | { type: 'AGREGAR' }
  | { type: 'ELIMINAR'; id: string }
  | { type: 'DESHACER' }
  | { type: 'EDITAR_TARJETA'; campo: CampoTarjeta; valor: Campo }

export const estadoInicial: EstadoDatos = { tarjeta: null, filas: [], ultimaEliminada: null }

export function reducer(s: EstadoDatos, a: Accion): EstadoDatos {
  switch (a.type) {
    case 'CARGAR': // respuesta de /extraer
      return {
        tarjeta: { valores: { ...a.respuesta.tarjeta }, original: { ...a.respuesta.tarjeta } },
        filas: [
          ...a.respuesta.movimientos.map(filaDesdeMovimiento),
          ...a.respuesta.msi.map(filaDesdeMsi),
        ],
        ultimaEliminada: null,
      }
    case 'MANUAL': // captura a mano desde cero
      return {
        tarjeta: { valores: { ...TARJETA_VACIA }, original: null },
        filas: [filaManual()],
        ultimaEliminada: null,
      }
    case 'EDITAR_FILA':
      return {
        ...s,
        filas: s.filas.map((f) => (f.id === a.id ? ({ ...f, [a.campo]: a.valor } as Fila) : f)),
      }
    case 'AGREGAR':
      return { ...s, filas: [...s.filas, filaManual()] }
    case 'ELIMINAR': {
      const i = s.filas.findIndex((f) => f.id === a.id)
      if (i < 0) return s
      return {
        ...s,
        filas: s.filas.filter((f) => f.id !== a.id),
        ultimaEliminada: { fila: s.filas[i], indice: i },
      }
    }
    case 'DESHACER': {
      if (!s.ultimaEliminada) return s
      const filas = [...s.filas]
      filas.splice(s.ultimaEliminada.indice, 0, s.ultimaEliminada.fila)
      return { ...s, filas, ultimaEliminada: null }
    }
    case 'EDITAR_TARJETA':
      if (!s.tarjeta) return s
      return {
        ...s,
        tarjeta: { ...s.tarjeta, valores: { ...s.tarjeta.valores, [a.campo]: a.valor } },
      }
    default:
      return s
  }
}