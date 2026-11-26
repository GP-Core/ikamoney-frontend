import type {
  Categoria,
  Frecuencia,
  ListaMes,
  Movimiento,
  MovimientoDelMes,
  MovimientoEdicion,
  MovimientoPayload,
} from '../types/movimiento'
import { ApiError } from './api'
import { idUsuarioMock } from './authMock'
import type { MovimientosService } from './movimientosApi'

/**
 * SOLO PARA DESARROLLO Y DEMOSTRACIONES.
 *
 * Simula /api/v1/movimientos y /api/v1/categorias dentro del navegador, con las mismas reglas del
 * backend (ocurrencias de los recurrentes, totales del mes, ids con prefijo). Los datos se guardan
 * por usuario en localStorage con el prefijo `ikamoney-mock:`.
 */

interface DatosMock {
  ultimoId: number
  movimientos: Movimiento[]
  /** Categorías propias del usuario (las base viven en CATEGORIAS). */
  categorias?: Categoria[]
}

/** Las mismas nueve categorías base que siembra el backend (app/crear_tablas.py). */
const CATEGORIAS: Categoria[] = [
  'Vivienda',
  'Alimentación',
  'Transporte',
  'Servicios',
  'Salud',
  'Educación',
  'Entretenimiento',
  'Compras',
  'Otros',
].map((nombre, i) => ({ id: i + 1, nombre, base: true }))

export const claveMovimientosMock = (idUsuario: number) => `ikamoney-mock:movimientos:${idUsuario}`

function leer(): DatosMock {
  try {
    const valor = localStorage.getItem(claveMovimientosMock(idUsuarioMock()))
    return valor ? (JSON.parse(valor) as DatosMock) : { ultimoId: 0, movimientos: [] }
  } catch {
    return { ultimoId: 0, movimientos: [] }
  }
}

function guardar(datos: DatosMock): void {
  localStorage.setItem(claveMovimientosMock(idUsuarioMock()), JSON.stringify(datos))
}

const esperar = () => new Promise((resolve) => setTimeout(resolve, 200))

const dosDigitos = (n: number) => String(n).padStart(2, '0')
const iso = (anio: number, mes: number, dia: number) => `${anio}-${dosDigitos(mes)}-${dosDigitos(dia)}`
const ultimoDiaDelMes = (anio: number, mes: number) => new Date(anio, mes, 0).getDate()
/** Si el mes tiene menos días, cae en el último (igual que fechas.ajustar_dia del backend). */
const ajustarDia = (anio: number, mes: number, dia: number) => Math.min(dia, ultimoDiaDelMes(anio, mes))

/** Fechas en que cae un movimiento dentro del mes. Misma regla que fechas.ocurrencias_en_mes del backend. */
function ocurrencias(frecuencia: Frecuencia, inicio: string, fin: string | null, anio: number, mes: number): string[] {
  const diaInicio = Number(inicio.slice(8, 10))
  const ultimo = ultimoDiaDelMes(anio, mes)
  let candidatas: string[]
  if (frecuencia === 'unico') candidatas = [inicio]
  else if (frecuencia === 'mensual') candidatas = [iso(anio, mes, ajustarDia(anio, mes, diaInicio))]
  else if (frecuencia === 'anual') {
    // Solo en el mes de la fecha de inicio; el 29 de febrero cae en 28 si el año no es bisiesto.
    const mesInicio = Number(inicio.slice(5, 7))
    candidatas = mes === mesInicio ? [iso(anio, mes, ajustarDia(anio, mes, diaInicio))] : []
  } else if (frecuencia === 'quincenal') {
    const d1 = ((diaInicio - 1) % 15) + 1
    candidatas = [iso(anio, mes, d1), iso(anio, mes, ajustarDia(anio, mes, d1 + 15))]
  } else {
    const [ai, mi, di] = inicio.split('-').map(Number)
    const base = Date.UTC(ai, mi - 1, di)
    candidatas = []
    for (let d = 1; d <= ultimo; d++) {
      if ((Date.UTC(anio, mes - 1, d) - base) / 86_400_000 % 7 === 0) candidatas.push(iso(anio, mes, d))
    }
  }
  const prefijo = `${anio}-${dosDigitos(mes)}`
  return candidatas.filter((c) => c.startsWith(prefijo) && c >= inicio && (fin === null || c <= fin))
}

const redondear2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

/** Las categorías propias arrancan en 100 para no chocar con los ids de las base. */
const PRIMER_ID_PROPIO = 100

const todasLasCategorias = (datos: DatosMock) => [...CATEGORIAS, ...(datos.categorias ?? [])]

function nombreCategoria(id: number | null): string | null {
  return todasLasCategorias(leer()).find((c) => c.id === id)?.nombre ?? null
}

/** Las reglas que el backend valida y responde con 422. */
function validar(datos: { tipo?: string; frecuencia: Frecuencia; categoria_id?: number; clase?: string }, tipo: string) {
  if (tipo === 'gasto') {
    if (!datos.categoria_id || !nombreCategoria(datos.categoria_id)) throw new ApiError(422, 'Elige una categoría.')
    if (!datos.clase) throw new ApiError(422, 'Indica si el gasto es fijo o variable.')
    if (datos.clase === 'variable' && datos.frecuencia !== 'unico') {
      throw new ApiError(422, 'Un gasto variable no se repite.')
    }
    if (datos.clase === 'fijo' && datos.frecuencia === 'unico') throw new ApiError(422, 'Un gasto fijo debe repetirse.')
  }
}

const noEncontrado = () => new ApiError(404, 'No encontrado')

export const movimientosMock: MovimientosService = {
  async listarMes(mes) {
    await esperar()
    const [anio, numero] = mes.split('-').map(Number)
    const delMes: MovimientoDelMes[] = []
    for (const m of leer().movimientos) {
      if (!m.activo) continue
      for (const fecha_ocurrencia of ocurrencias(m.frecuencia, m.fecha, m.fecha_fin, anio, numero)) {
        delMes.push({ ...m, fecha_ocurrencia })
      }
    }
    const suma = (filtro: (m: MovimientoDelMes) => boolean) =>
      redondear2(delMes.filter(filtro).reduce((total, m) => total + m.monto, 0))
    const ingresos = suma((m) => m.tipo === 'ingreso')
    const gastos = suma((m) => m.tipo === 'gasto')
    const respuesta: ListaMes = {
      mes,
      totales: {
        ingresos,
        gastos,
        gastos_fijos: suma((m) => m.clase === 'fijo'),
        gastos_variables: suma((m) => m.clase === 'variable'),
        balance: redondear2(ingresos - gastos),
      },
      movimientos: delMes,
    }
    return respuesta
  },

  async crear(payload: MovimientoPayload) {
    await esperar()
    validar(payload, payload.tipo)
    const datos = leer()
    const esGasto = payload.tipo === 'gasto'
    const movimiento: Movimiento = {
      id: `${payload.tipo}-${++datos.ultimoId}`,
      tipo: payload.tipo,
      concepto: payload.concepto,
      monto: payload.monto,
      frecuencia: payload.frecuencia,
      fecha: payload.fecha,
      fecha_fin: null,
      activo: true,
      categoria_id: esGasto ? (payload.categoria_id ?? null) : null,
      categoria: esGasto ? nombreCategoria(payload.categoria_id ?? null) : null,
      clase: esGasto ? (payload.clase ?? null) : null,
    }
    datos.movimientos.push(movimiento)
    guardar(datos)
    return movimiento
  },

  async actualizar(id, payload: MovimientoEdicion) {
    await esperar()
    const datos = leer()
    const indice = datos.movimientos.findIndex((m) => m.id === id)
    if (indice < 0) throw noEncontrado()
    const actual = datos.movimientos[indice]
    validar(payload, actual.tipo)
    const esGasto = actual.tipo === 'gasto'
    datos.movimientos[indice] = {
      ...actual,
      concepto: payload.concepto,
      monto: payload.monto,
      frecuencia: payload.frecuencia,
      fecha: payload.fecha,
      categoria_id: esGasto ? (payload.categoria_id ?? actual.categoria_id) : null,
      categoria: esGasto ? nombreCategoria(payload.categoria_id ?? actual.categoria_id) : null,
      clase: esGasto ? (payload.clase ?? actual.clase) : null,
    }
    guardar(datos)
    return datos.movimientos[indice]
  },

  async eliminar(id) {
    await esperar()
    const datos = leer()
    if (!datos.movimientos.some((m) => m.id === id)) throw noEncontrado()
    datos.movimientos = datos.movimientos.filter((m) => m.id !== id)
    guardar(datos)
  },

  async registrarOcurrencia() {
    throw new ApiError(422, 'Marcar pagos no está disponible en el modo de prueba.')
  },

  async quitarOcurrencia() {
    throw new ApiError(422, 'Marcar pagos no está disponible en el modo de prueba.')
  },

  async listarCategorias() {
    await esperar()
    return todasLasCategorias(leer())
  },

  async crearCategoria(nombre) {
    await esperar()
    const limpio = nombre.trim()
    if (limpio.length < 1 || limpio.length > 60) throw new ApiError(422, 'El nombre debe tener de 1 a 60 caracteres.')
    const datos = leer()
    const existentes = todasLasCategorias(datos)
    if (existentes.some((c) => c.nombre.toLowerCase() === limpio.toLowerCase())) {
      throw new ApiError(400, 'Ya existe una categoría con ese nombre.', 'CATEGORIA_DUPLICADA')
    }
    const id = Math.max(PRIMER_ID_PROPIO - 1, ...(datos.categorias ?? []).map((c) => c.id)) + 1
    const categoria: Categoria = { id, nombre: limpio, base: false }
    datos.categorias = [...(datos.categorias ?? []), categoria]
    guardar(datos)
    return categoria
  },
}
