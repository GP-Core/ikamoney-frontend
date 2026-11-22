import type { Alerta, ConfiguracionAlertas, ListaAlertas } from '../types/alerta'
import { ApiError } from './api'
import type { AlertasService } from './alertasApi'
import { idUsuarioMock } from './authMock'

/**
 * SOLO PARA DESARROLLO Y DEMOSTRACIONES.
 *
 * Simula /api/v1/alertas dentro del navegador. Los datos se guardan por usuario en localStorage con
 * el prefijo `ikamoney-mock:`. Las alertas de ejemplo siguen el perfil de la hoja de T26 (Tarjeta A
 * y Tarjeta B) y, como las reales, no llevan saldos ni montos (IC-07).
 */

interface DatosMock {
  alertas: Alerta[]
  configuracion: ConfiguracionAlertas
}

/** Mismos valores por defecto que app/core/reglas_alertas.json del backend. */
const CONFIGURACION_INICIAL: ConfiguracionAlertas = {
  umbral_utilizacion: 50,
  dias_anticipacion: 3,
  canales: { correo: true, push: false },
}

function iniciales(): DatosMock {
  const ahora = Date.now()
  const hace = (horas: number) => new Date(ahora - horas * 3_600_000 - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 19)
  const vence = new Date(ahora + 2 * 86_400_000)
  const fecha = vence.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })
  const alertas: Alerta[] = [
    {
      id: 1,
      regla: 'AL-04',
      severidad: 'critica',
      titulo: 'Tarjeta B rebasó su límite',
      mensaje: 'Entre el saldo y los pagos a meses pendientes, Tarjeta B supera su límite de crédito.',
      accion: 'Prioriza bajar este saldo y revisa tus compras a MSI.',
      referencia: 'tarjeta:2',
      estado: 'activa',
      leida: false,
      creada_en: hace(2),
      resuelta_en: null,
    },
    {
      id: 2,
      regla: 'AL-02',
      severidad: 'atencion',
      titulo: 'Utilización alta en Tarjeta A',
      mensaje: 'Tarjeta A usa 50 % o más de su límite de crédito.',
      accion: 'Paga parte del saldo o evita nuevas compras con esta tarjeta.',
      referencia: 'tarjeta:1',
      estado: 'activa',
      leida: false,
      creada_en: hace(26),
      resuelta_en: null,
    },
    {
      id: 3,
      regla: 'AL-03',
      severidad: 'atencion',
      titulo: 'Se acerca el pago de Tarjeta A',
      mensaje: `El pago de Tarjeta A vence el ${fecha}.`,
      accion: 'Págala antes de esa fecha para evitar intereses y cargos.',
      referencia: `tarjeta:1:${vence.toISOString().slice(0, 10)}`,
      estado: 'activa',
      leida: true,
      creada_en: hace(50),
      resuelta_en: null,
    },
    {
      id: 4,
      regla: 'AL-01',
      severidad: 'critica',
      titulo: 'Tus compromisos superan tus ingresos',
      mensaje: 'En el mes de mayor carga tus compromisos serían mayores que tus ingresos.',
      accion: 'Revisa tu proyección y reduce gastos o pagos antes de ese mes.',
      referencia: 'proyeccion',
      estado: 'activa',
      leida: true,
      creada_en: hace(74),
      resuelta_en: null,
    },
  ]
  return { alertas, configuracion: CONFIGURACION_INICIAL }
}

export const claveAlertasMock = (idUsuario: number) => `ikamoney-mock:alertas:${idUsuario}`

function leer(): DatosMock {
  try {
    const valor = localStorage.getItem(claveAlertasMock(idUsuarioMock()))
    if (valor) return JSON.parse(valor) as DatosMock
  } catch {
    // Datos dañados o almacenamiento bloqueado: se vuelve a sembrar.
  }
  const datos = iniciales()
  guardar(datos)
  return datos
}

function guardar(datos: DatosMock): void {
  try {
    localStorage.setItem(claveAlertasMock(idUsuarioMock()), JSON.stringify(datos))
  } catch {
    // Almacenamiento lleno o bloqueado: la prueba sigue sin persistir.
  }
}

const esperar = () => new Promise((resolve) => setTimeout(resolve, 200))

const sinLeer = (alertas: Alerta[]) => alertas.filter((a) => a.estado === 'activa' && !a.leida).length

export const alertasMock: AlertasService = {
  async listar(): Promise<ListaAlertas> {
    await esperar()
    const activas = leer().alertas.filter((a) => a.estado === 'activa')
    return { total: activas.length, sin_leer: sinLeer(activas), alertas: activas }
  },

  async marcarLeida(id, leida) {
    await esperar()
    const datos = leer()
    const alerta = datos.alertas.find((a) => a.id === id)
    if (!alerta) throw new ApiError(404, 'La alerta no existe.', 'ALERTA_NO_ENCONTRADA')
    alerta.leida = leida
    guardar(datos)
    return alerta
  },

  async obtenerConfiguracion() {
    await esperar()
    return leer().configuracion
  },

  async guardarConfiguracion(cambios) {
    await esperar()
    const datos = leer()
    const { canales, ...simples } = cambios
    datos.configuracion = {
      ...datos.configuracion,
      ...simples,
      canales: { ...datos.configuracion.canales, ...canales },
    }
    guardar(datos)
    return datos.configuracion
  },
}
