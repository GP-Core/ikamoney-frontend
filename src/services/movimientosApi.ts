import type { Categoria, ListaMes, Movimiento, MovimientoEdicion, MovimientoPayload } from '../types/movimiento'
import { apiFetch } from './api'

/**
 * Operaciones de ingresos, gastos y categorías. La implementación real habla con el backend;
 * la de prueba (movimientosMock.ts) simula el mismo contrato en el navegador.
 */
export interface MovimientosService {
  /** Movimientos del mes (AAAA-MM) con sus totales; los recurrentes salen una vez por ocurrencia. */
  listarMes(mes: string): Promise<ListaMes>
  crear(datos: MovimientoPayload): Promise<Movimiento>
  actualizar(id: string, datos: MovimientoEdicion): Promise<Movimiento>
  eliminar(id: string): Promise<void>
  listarCategorias(): Promise<Categoria[]>
  /** Crea una categoría propia (1 a 60 caracteres). Responde CATEGORIA_DUPLICADA si el nombre ya existe. */
  crearCategoria(nombre: string): Promise<Categoria>
}

const json = (metodo: 'POST' | 'PUT', datos: unknown): RequestInit => ({ method: metodo, body: JSON.stringify(datos) })

/** Implementación real sobre /api/v1/movimientos y /api/v1/categorias. */
export const movimientosApi: MovimientosService = {
  listarMes: (mes) => apiFetch<ListaMes>(`/v1/movimientos?mes=${encodeURIComponent(mes)}`),
  crear: (datos) => apiFetch<Movimiento>('/v1/movimientos', json('POST', datos)),
  actualizar: (id, datos) => apiFetch<Movimiento>(`/v1/movimientos/${encodeURIComponent(id)}`, json('PUT', datos)),
  eliminar: async (id) => {
    await apiFetch<unknown>(`/v1/movimientos/${encodeURIComponent(id)}`, { method: 'DELETE' })
  },
  listarCategorias: () => apiFetch<Categoria[]>('/v1/categorias'),
  crearCategoria: (nombre) => apiFetch<Categoria>('/v1/categorias', json('POST', { nombre })),
}
