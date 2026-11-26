// Lógica de la pantalla de revisión (T32), sin React.
// Una "fila" une los movimientos y los MSI que devuelve la IA en una sola lista editable.
import type {
  CupoExtraccion, MovimientoExtraido, MsiExtraido, PayloadConfirmar, RespuestaExtraccion,
} from '../types/estadoCuenta'

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
  // Se acepta "12,500" o "$ 12,500.50", como se lee en el estado de cuenta.
  const limpio = /^\$?\s*\d[\d,]*(\.\d+)?$/.test(String(v).trim()) ? String(v).replace(/[$,\s]/g, '') : v
  const n = Number(limpio)
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

export function validar({ filas, tarjeta }: Pick<EstadoDatos, 'filas' | 'tarjeta'>, hoy?: string): Errores {
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
    else if (hoy && String(f.fecha ?? '') > hoy) errorFila(f.id, 'fecha', 'No puede ser futura.')
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

function originalDeMovimiento(o: DatosFila): { fecha: string; concepto: string; monto: number } | null {
  const monto = num(o.monto)
  return o.fecha && monto !== null && monto > 0 ? { fecha: String(o.fecha), concepto: o.concepto.trim(), monto } : null
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
      original: origen(f) === 'extraido' && f.original ? originalDeMovimiento(f.original) : null,
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
        filas: [], // los movimientos son opcionales: se puede registrar solo la tarjeta
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

// ---------- Cupo de lecturas con IA (H-04) ----------
/** ¿Se puede pedir una lectura con IA? Sin dato del cupo (aún cargando o sin red) se deja intentar: el backend decide. */
export function puedeLeerConIa(cupo: CupoExtraccion | null): boolean {
  return cupo === null || cupo.restantes > 0
}

/** Explicación bajo el medidor; null mientras no se conoce. */
export function textoCupo(cupo: CupoExtraccion | null): string | null {
  if (cupo === null) return null
  if (cupo.restantes <= 0) {
    return `Ya usaste tus ${cupo.limite} lecturas gratis. Puedes capturar los datos a mano; toma unos minutos.`
  }
  if (cupo.restantes === 1) return 'Te queda 1. Úsala con el estado de cuenta más reciente.'
  return `Son ${cupo.limite} en total. Solo se descuenta cuando la lectura sale bien. Capturar a mano no gasta lecturas.`
}

/** Para la etiqueta de los accesos a "Subir estado de cuenta". */
export function textoCupoCorto(cupo: CupoExtraccion | null): string | null {
  if (cupo === null) return null
  return cupo.restantes <= 0 ? 'Sin lecturas gratis' : `${cupo.restantes} gratis`
}

/** Se muestra al revisar y al guardar lo que leyó la IA. */
export function textoLecturaUsada(cupo: CupoExtraccion | null): string {
  const base = 'Esta lectura usó 1 de tus lecturas gratis.'
  if (cupo === null) return base
  if (cupo.restantes <= 0) return `${base} Ya no te quedan.`
  return `${base} Te ${cupo.restantes === 1 ? 'queda' : 'quedan'} ${cupo.restantes}.`
}

/** Cupo después de una lectura exitosa, sin volver a pedirlo. */
export function cupoTrasLectura(cupo: CupoExtraccion | null): CupoExtraccion | null {
  if (cupo === null) return null
  const usados = Math.min(cupo.usados + 1, cupo.limite)
  return { ...cupo, usados, restantes: cupo.limite - usados }
}

// ---------- Fecha de corte ----------
const dos = (n: number) => String(n).padStart(2, '0')
export const aTextoFecha = (f: Date): string => `${f.getFullYear()}-${dos(f.getMonth() + 1)}-${dos(f.getDate())}`

/**
 * Fecha de corte que se propone: el último corte que ya pasó (hoy cuenta). /extraer solo trae el día de corte
 * y el backend necesita la fecha completa; el usuario puede cambiarla. En meses cortos el día baja al último.
 */
export function fechaCortePropuesta(diaCorte: number | null, hoy: Date): string {
  if (diaCorte === null || !Number.isInteger(diaCorte) || diaCorte < 1 || diaCorte > 31) return ''
  const enMes = (anio: number, mes: number) => new Date(anio, mes, Math.min(diaCorte, new Date(anio, mes + 1, 0).getDate()))
  const esteMes = enMes(hoy.getFullYear(), hoy.getMonth())
  const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  return aTextoFecha(esteMes <= hoySinHora ? esteMes : enMes(hoy.getFullYear(), hoy.getMonth() - 1))
}

// ---------- Ayudas de la pantalla ----------
export type CampoObligatorio = 'nombre' | 'banco' | 'limiteCredito' | 'diaCorte' | 'diaLimitePago'

/** Lo que falta para crear una tarjeta nueva, para marcarlo en su campo. El banco sirve de nombre. */
export function faltantesNueva(
  tarjeta: PayloadConfirmar['tarjeta'], nombre: string,
): Partial<Record<CampoObligatorio, string>> {
  const faltan: Partial<Record<CampoObligatorio, string>> = {}
  if (!nombre.trim() && !tarjeta?.banco) faltan.nombre = 'Escribe un nombre para reconocerla.'
  if (!tarjeta?.banco) faltan.banco = 'Escribe el banco.'
  if (!tarjeta?.limiteCredito || tarjeta.limiteCredito <= 0) faltan.limiteCredito = 'Escribe el límite de crédito.'
  if (!tarjeta?.diaCorte) faltan.diaCorte = 'Escribe el día de corte.'
  if (!tarjeta?.diaLimitePago) faltan.diaLimitePago = 'Escribe el día límite de pago.'
  return faltan
}

const sinAcentos = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase()

/** La tarjeta guardada del banco que leyó la IA, solo si hay exactamente una. */
export function tarjetaSugerida(
  banco: Campo | undefined, tarjetas: readonly { id: number; banco: string }[],
): number | null {
  const buscado = sinAcentos(String(banco ?? ''))
  if (!buscado) return null
  const iguales = tarjetas.filter((t) => sinAcentos(t.banco) === buscado)
  return iguales.length === 1 ? iguales[0].id : null
}

/** ¿Hay algo que se perdería al salir? Con lectura de la IA siempre: ya se gastó. */
export function hayCambios({ filas, tarjeta }: Pick<EstadoDatos, 'filas' | 'tarjeta'>): boolean {
  if (!tarjeta) return false
  if (tarjeta.original || filas.length > 0) return true
  return Object.values(tarjeta.valores).some((v) => norm(v) !== null)
}

export function textoPeso(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** "3 movimientos · 1 compra a MSI". */
export function resumenFilas(filas: Pick<Fila, 'esMsi'>[]): string {
  const msi = filas.filter((f) => f.esMsi).length
  const movs = filas.length - msi
  return `${movs} ${movs === 1 ? 'movimiento' : 'movimientos'} · ${msi} ${msi === 1 ? 'compra' : 'compras'} a MSI`
}

export const totalFilas = (filas: Pick<Fila, 'monto'>[]): number =>
  filas.reduce((total, f) => total + Math.max(num(f.monto) ?? 0, 0), 0)
