import { useEffect, useState } from 'react'
import type { Movement } from '../types/movement'

const STORAGE_KEY = 'ikamoney.movimientos'

// Mientras no exista el endpoint de movimientos, los datos viven en el navegador.
// Cuando el backend esté listo, solo hay que cambiar este hook por llamadas a services/.
function load(): Movement[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Movement[]
  } catch {
    return []
  }
}

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

const SAMPLE: Movement[] = [
  { type: 'ingreso', concept: 'Sueldo quincenal', amount: 10000, date: '2026-10-01', category: '', kind: null },
  { type: 'ingreso', concept: 'Sueldo quincenal', amount: 10000, date: '2026-10-12', category: '', kind: null },
  { type: 'gasto', concept: 'Renta', amount: 6500, date: '2026-10-01', category: 'Vivienda', kind: 'fijo' },
  { type: 'gasto', concept: 'Internet', amount: 600, date: '2026-10-03', category: 'Servicios', kind: 'fijo' },
  { type: 'gasto', concept: 'Súper', amount: 2300, date: '2026-10-06', category: 'Alimentos', kind: 'variable' },
  { type: 'gasto', concept: 'Gasolina', amount: 1200, date: '2026-10-09', category: 'Transporte', kind: 'variable' },
  { type: 'gasto', concept: 'Salidas con amigos', amount: 1400, date: '2026-10-11', category: 'Entretenimiento', kind: 'variable' },
].map((m) => ({ ...m, id: newId() })) as Movement[]

/** Lista de movimientos con alta, edición y baja, guardada en localStorage. */
export function useMovements() {
  const [movements, setMovements] = useState<Movement[]>(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(movements))
    } catch {
      // Sin almacenamiento disponible: la app sigue funcionando en memoria.
    }
  }, [movements])

  return {
    movements,
    add: (data: Omit<Movement, 'id'>) => setMovements((list) => [...list, { ...data, id: newId() }]),
    update: (movement: Movement) =>
      setMovements((list) => list.map((m) => (m.id === movement.id ? movement : m))),
    remove: (id: string) => setMovements((list) => list.filter((m) => m.id !== id)),
    loadSample: () => setMovements(SAMPLE),
  }
}
