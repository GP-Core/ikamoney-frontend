import type { NombreIcono } from './Icon'

export interface OpcionNavegacion {
  ruta: string
  texto: string
  /** Nombre completo donde sí cabe (barra lateral y migas de escritorio). */
  textoLargo?: string
  icono: NombreIcono
  /** Pantallas hijas que dejan marcada esta opción. */
  tambien?: string[]
}

/**
 * Las cuatro pestañas: barra inferior en celular, primer grupo de la barra lateral. El simulador no es
 * pestaña porque es una acción: se abre desde el botón de Inicio y de Balance, y desde el menú.
 */
export const SECCIONES: OpcionNavegacion[] = [
  { ruta: '/', texto: 'Inicio', icono: 'inicio' },
  { ruta: '/balance', texto: 'Balance', textoLargo: 'Balance y proyección', icono: 'grafica' },
  { ruta: '/ranking', texto: 'Deudas', icono: 'recibo', tambien: ['/plan'] },
  { ruta: '/score', texto: 'Score', icono: 'actividad' },
]

/** Opciones que no son pestaña; con ellas se arman los grupos. */
const MENU: OpcionNavegacion[] = [
  { ruta: '/tarjetas', texto: 'Tarjetas y deudas', icono: 'tarjeta', tambien: ['/deudas'] },
  { ruta: '/movimientos', texto: 'Ingresos y gastos', icono: 'movimientos' },
  { ruta: '/cuentas', texto: 'Cuentas', icono: 'cartera' },
  { ruta: '/estado-cuenta', texto: 'Subir estado de cuenta', icono: 'subir' },
  { ruta: '/simulador', texto: 'Simular una compra', icono: 'calculadora' },
  { ruta: '/alertas/configuracion', texto: 'Configurar avisos', icono: 'ajustes' },
]

const delMenu = (...rutas: string[]) => MENU.filter((o) => rutas.includes(o.ruta))

/** Todas las opciones por grupo: barra lateral de escritorio y menú lateral del celular. */
export const GRUPOS: { titulo: string; opciones: OpcionNavegacion[] }[] = [
  { titulo: 'Principal', opciones: SECCIONES },
  { titulo: 'Mi dinero', opciones: delMenu('/tarjetas', '/movimientos', '/cuentas', '/estado-cuenta') },
  { titulo: 'Planear', opciones: delMenu('/simulador') },
  { titulo: 'Ajustes', opciones: delMenu('/alertas/configuracion') },
]

export function estaActiva(opcion: OpcionNavegacion, pathname: string): boolean {
  if (opcion.ruta === '/') return pathname === '/'
  return [opcion.ruta, ...(opcion.tambien ?? [])].some((r) => pathname === r || pathname.startsWith(`${r}/`))
}

/** Grupo y página actuales para la barra superior; vacío en Inicio. */
export function migasDe(pathname: string): string[] {
  if (pathname === '/') return []
  for (const grupo of GRUPOS) {
    const opcion = grupo.opciones.find((o) => estaActiva(o, pathname))
    if (!opcion) continue
    const migas = [grupo.titulo, opcion.textoLargo ?? opcion.texto]
    return pathname === '/plan' ? [...migas, 'Plan de pago'] : migas
  }
  if (pathname.startsWith('/alertas')) return ['Avisos']
  if (pathname.startsWith('/cuenta')) return ['Mi cuenta']
  return []
}
