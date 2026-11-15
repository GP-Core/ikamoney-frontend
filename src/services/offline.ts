import { ApiError } from './api'
import { leerToken } from './tokenStorage'

/**
 * Copias de las últimas respuestas para consultar sin conexión, en solo lectura (T60).
 *
 * Viven en IndexedDB con la hora en que se obtuvieron. Son datos financieros del usuario:
 * `limpiarDispositivo()` (services/dispositivo.ts) borra toda la base al cerrar sesión y al
 * eliminar la cuenta. Sin sesión, aquí no se lee ni se escribe nada.
 */

/** Nombre de la base. dispositivo.ts la borra por este nombre. */
export const NOMBRE_BASE = 'ikamoney-offline'
const ALMACEN = 'copias'

export interface Copia<T> {
  datos: T
  /** Momento en que se obtuvo la respuesta (Date.now()). */
  guardadoEn: number
}

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const peticion = indexedDB.open(NOMBRE_BASE, 1)
    peticion.onupgradeneeded = () => peticion.result.createObjectStore(ALMACEN)
    peticion.onsuccess = () => {
      const db = peticion.result
      // Si otra pestaña quiere borrar la base (cerrar sesión), no se lo impide.
      db.onversionchange = () => db.close()
      resolve(db)
    }
    peticion.onerror = () => reject(peticion.error)
  })
}

/** Una operación sobre el almacén. La conexión se cierra siempre para no bloquear el borrado. */
async function transaccion<T>(modo: IDBTransactionMode, accion: (almacen: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await abrir()
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(ALMACEN, modo)
      const peticion = accion(tx.objectStore(ALMACEN))
      tx.oncomplete = () => resolve(peticion.result)
      tx.onerror = tx.onabort = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

/** Guarda la respuesta con la hora actual. Sin sesión o sin IndexedDB no hace nada ni falla. */
export async function guardarCopia<T>(clave: string, datos: T): Promise<void> {
  if (!leerToken() || !('indexedDB' in globalThis)) return
  try {
    const copia: Copia<T> = { datos, guardadoEn: Date.now() }
    await transaccion('readwrite', (almacen) => almacen.put(copia, clave))
  } catch {
    // Almacenamiento bloqueado o lleno: la app funciona igual, solo sin copia.
  }
}

export async function leerCopia<T>(clave: string): Promise<Copia<T> | null> {
  if (!leerToken() || !('indexedDB' in globalThis)) return null
  try {
    return ((await transaccion('readonly', (almacen) => almacen.get(clave))) as Copia<T> | undefined) ?? null
  } catch {
    return null
  }
}

export interface ConCopia<T> {
  datos: T
  /** Fecha y hora de la copia mostrada; null cuando los datos son los de ahora. */
  copiaDe: Date | null
}

/**
 * Lectura con respaldo (T60).
 * - Con conexión: pide los datos, guarda la copia y los devuelve como actuales.
 * - Sin conexión, o si la petición falla por red: devuelve la última copia con su fecha.
 * Los errores del servidor (400, 500...) no se tapan con la copia: se muestran como siempre.
 */
export async function conCopia<T>(clave: string, enLinea: boolean, pedir: () => Promise<T>): Promise<ConCopia<T>> {
  if (enLinea) {
    try {
      const datos = await pedir()
      void guardarCopia(clave, datos)
      return { datos, copiaDe: null }
    } catch (error) {
      // fetch lanza TypeError cuando no hay red (servidor apagado, señal perdida, CORS).
      if (!(error instanceof TypeError)) throw error
    }
  }
  const copia = await leerCopia<T>(clave)
  if (!copia) {
    throw new ApiError(0, 'Sin conexión y todavía no hay datos guardados de esta pantalla. Ábrela una vez con internet.')
  }
  return { datos: copia.datos, copiaDe: new Date(copia.guardadoEn) }
}
