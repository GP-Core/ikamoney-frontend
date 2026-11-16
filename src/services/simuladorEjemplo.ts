import type { SimulacionResponse } from '../types/simulador'
import type { PedidoSimulacion } from '../types/simulador'

/**
 * Datos de ejemplo de la pantalla del simulador (T42). Son respuestas reales de
 * POST /api/v1/simulador/calcular, generadas con el motor de T41 y el perfil de T25/T26
 * (ingreso 20,000, dos tarjetas, dos MSI, "hoy" = 15-mar-2026): los números son los de las
 * pruebas del backend (contado -162 en marzo, 12 MSI score 70, 18 MSI score 71...).
 *
 * Se elige el escenario con ?demo= en la URL (junto a ?simulador):
 *   (nada)        → laptop de 9,000 con prioridad media: contado no alcanza, los MSI sí
 *   sin_opcion    → compra de 45,000: la tarjeta no alcanza para MSI y de contado no alcanza el dinero
 *   sin_opciones  → ninguna forma de pago aplica (estado sin_escenarios_validos)
 *   sin_ingresos  → el backend responde 400 SIN_INGRESOS
 *   error         → falla la carga
 */
export type EscenarioSimulador = 'normal' | 'sin_opcion' | 'sin_opciones' | 'sin_ingresos' | 'error'

/** La compra que se simuló para generar los datos de cada escenario de ejemplo. */
export const PEDIDO_EJEMPLO: Record<'normal' | 'sin_opcion', PedidoSimulacion> = {
  normal: { descripcion: 'Laptop', precio: 9000, prioridad: 'media', ahorro_inicial: 5000 },
  sin_opcion: { descripcion: 'Laptop', precio: 45000, prioridad: 'media', ahorro_inicial: 20000 },
}

const NORMAL: SimulacionResponse = {
  "estado": "calculado",
  "periodo": "2026-03",
  "descripcion": "Laptop",
  "precio": 9000.0,
  "prioridad": "media",
  "meses": 18,
  "score_actual": {
    "puntaje": 78,
    "nivel": "en_revision",
    "nivel_texto": "En revisión"
  },
  "escenarios": [
    {
      "id": "contado",
      "tipo": "contado",
      "tarjeta_id": null,
      "tarjeta_nombre": null,
      "meses": null,
      "aplica": true,
      "motivo": null,
      "mensualidad": 9000.0,
      "balance": [
        { "mes": 1, "periodo": "2026-03", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 4162.0, "compra": 9000.0, "flujo": -5162.0, "acumulado": -162.0 },
        { "mes": 2, "periodo": "2026-04", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 4129.57, "compra": 0.0, "flujo": 3870.43, "acumulado": 3708.43 },
        { "mes": 3, "periodo": "2026-05", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 4097.63, "compra": 0.0, "flujo": 3902.37, "acumulado": 7610.8 },
        { "mes": 4, "periodo": "2026-06", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 3066.16, "compra": 0.0, "flujo": 4933.84, "acumulado": 12544.64 },
        { "mes": 5, "periodo": "2026-07", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 3035.17, "compra": 0.0, "flujo": 4964.83, "acumulado": 17509.47 },
        { "mes": 6, "periodo": "2026-08", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 3004.64, "compra": 0.0, "flujo": 4995.36, "acumulado": 22504.83 },
        { "mes": 7, "periodo": "2026-09", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 2974.57, "compra": 0.0, "flujo": 5025.43, "acumulado": 27530.26 },
        { "mes": 8, "periodo": "2026-10", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 2944.95, "compra": 0.0, "flujo": 5055.05, "acumulado": 32585.3 },
        { "mes": 9, "periodo": "2026-11", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1915.78, "compra": 0.0, "flujo": 6084.22, "acumulado": 38669.52 },
        { "mes": 10, "periodo": "2026-12", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1887.04, "compra": 0.0, "flujo": 6112.96, "acumulado": 44782.48 },
        { "mes": 11, "periodo": "2027-01", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1858.74, "compra": 0.0, "flujo": 6141.26, "acumulado": 50923.74 },
        { "mes": 12, "periodo": "2027-02", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1830.86, "compra": 0.0, "flujo": 6169.14, "acumulado": 57092.89 },
        { "mes": 13, "periodo": "2027-03", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1803.39, "compra": 0.0, "flujo": 6196.61, "acumulado": 63289.49 },
        { "mes": 14, "periodo": "2027-04", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1776.34, "compra": 0.0, "flujo": 6223.66, "acumulado": 69513.15 },
        { "mes": 15, "periodo": "2027-05", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1749.7, "compra": 0.0, "flujo": 6250.3, "acumulado": 75763.45 },
        { "mes": 16, "periodo": "2027-06", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1723.45, "compra": 0.0, "flujo": 6276.55, "acumulado": 82040.0 },
        { "mes": 17, "periodo": "2027-07", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1697.6, "compra": 0.0, "flujo": 6302.4, "acumulado": 88342.4 },
        { "mes": 18, "periodo": "2027-08", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1672.14, "compra": 0.0, "flujo": 6327.86, "acumulado": 94670.27 }
      ],
      "indicadores": {
        "flujo_minimo": -5162.0,
        "mes_flujo_minimo": 1,
        "acumulado_minimo": -162.0,
        "meses_en_negativo": 1,
        "primer_mes_negativo": 1
      },
      "score": {
        "puntaje": 53,
        "puntaje_bruto": 53.11,
        "nivel": "en_riesgo",
        "nivel_texto": "En riesgo",
        "tope_aplicado": false,
        "motivo_tope": null,
        "cambio": -25
      },
      "veredicto": "no_recomendable",
      "veredicto_texto": "No recomendable por ahora",
      "regla": "RN-15",
      "razon": "En 2026-03 tu dinero disponible quedaría en -$162.00: no alcanzaría para cubrir tus gastos y pagos.",
      "menor_impacto": false
    },
    {
      "id": "msi-1-3",
      "tipo": "msi",
      "tarjeta_id": 1,
      "tarjeta_nombre": "Tarjeta A",
      "meses": 3,
      "aplica": true,
      "motivo": null,
      "mensualidad": 3000.0,
      "balance": [
        { "mes": 1, "periodo": "2026-03", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 7162.0, "compra": 3000.0, "flujo": 838.0, "acumulado": 5838.0 },
        { "mes": 2, "periodo": "2026-04", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 7129.57, "compra": 3000.0, "flujo": 870.43, "acumulado": 6708.43 },
        { "mes": 3, "periodo": "2026-05", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 7097.63, "compra": 3000.0, "flujo": 902.37, "acumulado": 7610.8 },
        { "mes": 4, "periodo": "2026-06", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 3066.16, "compra": 0.0, "flujo": 4933.84, "acumulado": 12544.64 },
        { "mes": 5, "periodo": "2026-07", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 3035.17, "compra": 0.0, "flujo": 4964.83, "acumulado": 17509.47 },
        { "mes": 6, "periodo": "2026-08", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 3004.64, "compra": 0.0, "flujo": 4995.36, "acumulado": 22504.83 },
        { "mes": 7, "periodo": "2026-09", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 2974.57, "compra": 0.0, "flujo": 5025.43, "acumulado": 27530.26 },
        { "mes": 8, "periodo": "2026-10", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 2944.95, "compra": 0.0, "flujo": 5055.05, "acumulado": 32585.3 },
        { "mes": 9, "periodo": "2026-11", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1915.78, "compra": 0.0, "flujo": 6084.22, "acumulado": 38669.52 },
        { "mes": 10, "periodo": "2026-12", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1887.04, "compra": 0.0, "flujo": 6112.96, "acumulado": 44782.48 },
        { "mes": 11, "periodo": "2027-01", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1858.74, "compra": 0.0, "flujo": 6141.26, "acumulado": 50923.74 },
        { "mes": 12, "periodo": "2027-02", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1830.86, "compra": 0.0, "flujo": 6169.14, "acumulado": 57092.89 },
        { "mes": 13, "periodo": "2027-03", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1803.39, "compra": 0.0, "flujo": 6196.61, "acumulado": 63289.49 },
        { "mes": 14, "periodo": "2027-04", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1776.34, "compra": 0.0, "flujo": 6223.66, "acumulado": 69513.15 },
        { "mes": 15, "periodo": "2027-05", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1749.7, "compra": 0.0, "flujo": 6250.3, "acumulado": 75763.45 },
        { "mes": 16, "periodo": "2027-06", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1723.45, "compra": 0.0, "flujo": 6276.55, "acumulado": 82040.0 },
        { "mes": 17, "periodo": "2027-07", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1697.6, "compra": 0.0, "flujo": 6302.4, "acumulado": 88342.4 },
        { "mes": 18, "periodo": "2027-08", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1672.14, "compra": 0.0, "flujo": 6327.86, "acumulado": 94670.27 }
      ],
      "indicadores": {
        "flujo_minimo": 838.0,
        "mes_flujo_minimo": 1,
        "acumulado_minimo": 5838.0,
        "meses_en_negativo": 0,
        "primer_mes_negativo": null
      },
      "score": {
        "puntaje": 45,
        "puntaje_bruto": 44.87,
        "nivel": "en_riesgo",
        "nivel_texto": "En riesgo",
        "tope_aplicado": false,
        "motivo_tope": null,
        "cambio": -33
      },
      "veredicto": "con_precaucion",
      "veredicto_texto": "Recomendable con precaución",
      "regla": "RN-16",
      "razon": "Tu dinero alcanza, pero tu índice quedaría en nivel En riesgo.",
      "menor_impacto": false
    },
    {
      "id": "msi-1-6",
      "tipo": "msi",
      "tarjeta_id": 1,
      "tarjeta_nombre": "Tarjeta A",
      "meses": 6,
      "aplica": true,
      "motivo": null,
      "mensualidad": 1500.0,
      "balance": [
        { "mes": 1, "periodo": "2026-03", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 5662.0, "compra": 1500.0, "flujo": 2338.0, "acumulado": 7338.0 },
        { "mes": 2, "periodo": "2026-04", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 5629.57, "compra": 1500.0, "flujo": 2370.43, "acumulado": 9708.43 },
        { "mes": 3, "periodo": "2026-05", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 5597.63, "compra": 1500.0, "flujo": 2402.37, "acumulado": 12110.8 },
        { "mes": 4, "periodo": "2026-06", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 4566.16, "compra": 1500.0, "flujo": 3433.84, "acumulado": 15544.64 },
        { "mes": 5, "periodo": "2026-07", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 4535.17, "compra": 1500.0, "flujo": 3464.83, "acumulado": 19009.47 },
        { "mes": 6, "periodo": "2026-08", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 4504.64, "compra": 1500.0, "flujo": 3495.36, "acumulado": 22504.83 },
        { "mes": 7, "periodo": "2026-09", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 2974.57, "compra": 0.0, "flujo": 5025.43, "acumulado": 27530.26 },
        { "mes": 8, "periodo": "2026-10", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 2944.95, "compra": 0.0, "flujo": 5055.05, "acumulado": 32585.3 },
        { "mes": 9, "periodo": "2026-11", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1915.78, "compra": 0.0, "flujo": 6084.22, "acumulado": 38669.52 },
        { "mes": 10, "periodo": "2026-12", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1887.04, "compra": 0.0, "flujo": 6112.96, "acumulado": 44782.48 },
        { "mes": 11, "periodo": "2027-01", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1858.74, "compra": 0.0, "flujo": 6141.26, "acumulado": 50923.74 },
        { "mes": 12, "periodo": "2027-02", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1830.86, "compra": 0.0, "flujo": 6169.14, "acumulado": 57092.89 },
        { "mes": 13, "periodo": "2027-03", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1803.39, "compra": 0.0, "flujo": 6196.61, "acumulado": 63289.49 },
        { "mes": 14, "periodo": "2027-04", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1776.34, "compra": 0.0, "flujo": 6223.66, "acumulado": 69513.15 },
        { "mes": 15, "periodo": "2027-05", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1749.7, "compra": 0.0, "flujo": 6250.3, "acumulado": 75763.45 },
        { "mes": 16, "periodo": "2027-06", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1723.45, "compra": 0.0, "flujo": 6276.55, "acumulado": 82040.0 },
        { "mes": 17, "periodo": "2027-07", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1697.6, "compra": 0.0, "flujo": 6302.4, "acumulado": 88342.4 },
        { "mes": 18, "periodo": "2027-08", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1672.14, "compra": 0.0, "flujo": 6327.86, "acumulado": 94670.27 }
      ],
      "indicadores": {
        "flujo_minimo": 2338.0,
        "mes_flujo_minimo": 1,
        "acumulado_minimo": 7338.0,
        "meses_en_negativo": 0,
        "primer_mes_negativo": null
      },
      "score": {
        "puntaje": 64,
        "puntaje_bruto": 64.21,
        "nivel": "en_revision",
        "nivel_texto": "En revisión",
        "tope_aplicado": false,
        "motivo_tope": null,
        "cambio": -14
      },
      "veredicto": "recomendable",
      "veredicto_texto": "Recomendable",
      "regla": "RN-16",
      "razon": "Tu dinero alcanza y tu índice queda en nivel En revisión.",
      "menor_impacto": false
    },
    {
      "id": "msi-1-12",
      "tipo": "msi",
      "tarjeta_id": 1,
      "tarjeta_nombre": "Tarjeta A",
      "meses": 12,
      "aplica": true,
      "motivo": null,
      "mensualidad": 750.0,
      "balance": [
        { "mes": 1, "periodo": "2026-03", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 4912.0, "compra": 750.0, "flujo": 3088.0, "acumulado": 8088.0 },
        { "mes": 2, "periodo": "2026-04", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 4879.57, "compra": 750.0, "flujo": 3120.43, "acumulado": 11208.43 },
        { "mes": 3, "periodo": "2026-05", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 4847.63, "compra": 750.0, "flujo": 3152.37, "acumulado": 14360.8 },
        { "mes": 4, "periodo": "2026-06", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 3816.16, "compra": 750.0, "flujo": 4183.84, "acumulado": 18544.64 },
        { "mes": 5, "periodo": "2026-07", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 3785.17, "compra": 750.0, "flujo": 4214.83, "acumulado": 22759.47 },
        { "mes": 6, "periodo": "2026-08", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 3754.64, "compra": 750.0, "flujo": 4245.36, "acumulado": 27004.83 },
        { "mes": 7, "periodo": "2026-09", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 3724.57, "compra": 750.0, "flujo": 4275.43, "acumulado": 31280.26 },
        { "mes": 8, "periodo": "2026-10", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 3694.95, "compra": 750.0, "flujo": 4305.05, "acumulado": 35585.3 },
        { "mes": 9, "periodo": "2026-11", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 2665.78, "compra": 750.0, "flujo": 5334.22, "acumulado": 40919.52 },
        { "mes": 10, "periodo": "2026-12", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 2637.04, "compra": 750.0, "flujo": 5362.96, "acumulado": 46282.48 },
        { "mes": 11, "periodo": "2027-01", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 2608.74, "compra": 750.0, "flujo": 5391.26, "acumulado": 51673.74 },
        { "mes": 12, "periodo": "2027-02", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 2580.86, "compra": 750.0, "flujo": 5419.14, "acumulado": 57092.89 },
        { "mes": 13, "periodo": "2027-03", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1803.39, "compra": 0.0, "flujo": 6196.61, "acumulado": 63289.49 },
        { "mes": 14, "periodo": "2027-04", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1776.34, "compra": 0.0, "flujo": 6223.66, "acumulado": 69513.15 },
        { "mes": 15, "periodo": "2027-05", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1749.7, "compra": 0.0, "flujo": 6250.3, "acumulado": 75763.45 },
        { "mes": 16, "periodo": "2027-06", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1723.45, "compra": 0.0, "flujo": 6276.55, "acumulado": 82040.0 },
        { "mes": 17, "periodo": "2027-07", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1697.6, "compra": 0.0, "flujo": 6302.4, "acumulado": 88342.4 },
        { "mes": 18, "periodo": "2027-08", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1672.14, "compra": 0.0, "flujo": 6327.86, "acumulado": 94670.27 }
      ],
      "indicadores": {
        "flujo_minimo": 3088.0,
        "mes_flujo_minimo": 1,
        "acumulado_minimo": 8088.0,
        "meses_en_negativo": 0,
        "primer_mes_negativo": null
      },
      "score": {
        "puntaje": 70,
        "puntaje_bruto": 69.52,
        "nivel": "en_revision",
        "nivel_texto": "En revisión",
        "tope_aplicado": false,
        "motivo_tope": null,
        "cambio": -8
      },
      "veredicto": "recomendable",
      "veredicto_texto": "Recomendable",
      "regla": "RN-16",
      "razon": "Tu dinero alcanza y tu índice queda en nivel En revisión.",
      "menor_impacto": false
    },
    {
      "id": "msi-1-18",
      "tipo": "msi",
      "tarjeta_id": 1,
      "tarjeta_nombre": "Tarjeta A",
      "meses": 18,
      "aplica": true,
      "motivo": null,
      "mensualidad": 500.0,
      "balance": [
        { "mes": 1, "periodo": "2026-03", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 4662.0, "compra": 500.0, "flujo": 3338.0, "acumulado": 8338.0 },
        { "mes": 2, "periodo": "2026-04", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 4629.57, "compra": 500.0, "flujo": 3370.43, "acumulado": 11708.43 },
        { "mes": 3, "periodo": "2026-05", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 4597.63, "compra": 500.0, "flujo": 3402.37, "acumulado": 15110.8 },
        { "mes": 4, "periodo": "2026-06", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 3566.16, "compra": 500.0, "flujo": 4433.84, "acumulado": 19544.64 },
        { "mes": 5, "periodo": "2026-07", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 3535.17, "compra": 500.0, "flujo": 4464.83, "acumulado": 24009.47 },
        { "mes": 6, "periodo": "2026-08", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 3504.64, "compra": 500.0, "flujo": 4495.36, "acumulado": 28504.83 },
        { "mes": 7, "periodo": "2026-09", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 3474.57, "compra": 500.0, "flujo": 4525.43, "acumulado": 33030.26 },
        { "mes": 8, "periodo": "2026-10", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 3444.95, "compra": 500.0, "flujo": 4555.05, "acumulado": 37585.3 },
        { "mes": 9, "periodo": "2026-11", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 2415.78, "compra": 500.0, "flujo": 5584.22, "acumulado": 43169.52 },
        { "mes": 10, "periodo": "2026-12", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 2387.04, "compra": 500.0, "flujo": 5612.96, "acumulado": 48782.48 },
        { "mes": 11, "periodo": "2027-01", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 2358.74, "compra": 500.0, "flujo": 5641.26, "acumulado": 54423.74 },
        { "mes": 12, "periodo": "2027-02", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 2330.86, "compra": 500.0, "flujo": 5669.14, "acumulado": 60092.89 },
        { "mes": 13, "periodo": "2027-03", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 2303.39, "compra": 500.0, "flujo": 5696.61, "acumulado": 65789.49 },
        { "mes": 14, "periodo": "2027-04", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 2276.34, "compra": 500.0, "flujo": 5723.66, "acumulado": 71513.15 },
        { "mes": 15, "periodo": "2027-05", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 2249.7, "compra": 500.0, "flujo": 5750.3, "acumulado": 77263.45 },
        { "mes": 16, "periodo": "2027-06", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 2223.45, "compra": 500.0, "flujo": 5776.55, "acumulado": 83040.0 },
        { "mes": 17, "periodo": "2027-07", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 2197.6, "compra": 500.0, "flujo": 5802.4, "acumulado": 88842.4 },
        { "mes": 18, "periodo": "2027-08", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 2172.14, "compra": 500.0, "flujo": 5827.86, "acumulado": 94670.27 }
      ],
      "indicadores": {
        "flujo_minimo": 3338.0,
        "mes_flujo_minimo": 1,
        "acumulado_minimo": 8338.0,
        "meses_en_negativo": 0,
        "primer_mes_negativo": null
      },
      "score": {
        "puntaje": 71,
        "puntaje_bruto": 71.3,
        "nivel": "en_revision",
        "nivel_texto": "En revisión",
        "tope_aplicado": false,
        "motivo_tope": null,
        "cambio": -7
      },
      "veredicto": "recomendable",
      "veredicto_texto": "Recomendable",
      "regla": "RN-16",
      "razon": "Tu dinero alcanza y tu índice queda en nivel En revisión.",
      "menor_impacto": true
    }
  ],
  "menor_impacto": "msi-1-18",
  "veredicto": "recomendable",
  "veredicto_texto": "Recomendable",
  "faltantes": [],
  "supuestos": [
    "Se considera que pagas solo el mínimo de tus tarjetas (supuesto de T25), porque todavía no se captura tu forma de pago.",
    "Tus gastos variables se estiman con el promedio de los últimos 3 meses que tienen registros.",
    "Ahorro disponible hoy: $5,000.00.",
    "De contado se paga completo este mes, con efectivo o débito.",
    "A MSI la mensualidad es el precio entre los meses, y el total ocupa el límite de la tarjeta desde el primer mes."
  ],
  "version_modelo": "T25-v1"
}

const SIN_OPCION: SimulacionResponse = {
  "estado": "calculado",
  "periodo": "2026-03",
  "descripcion": "Laptop",
  "precio": 45000.0,
  "prioridad": "media",
  "meses": 18,
  "score_actual": {
    "puntaje": 78,
    "nivel": "en_revision",
    "nivel_texto": "En revisión"
  },
  "escenarios": [
    {
      "id": "contado",
      "tipo": "contado",
      "tarjeta_id": null,
      "tarjeta_nombre": null,
      "meses": null,
      "aplica": true,
      "motivo": null,
      "mensualidad": 45000.0,
      "balance": [
        { "mes": 1, "periodo": "2026-03", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 4162.0, "compra": 45000.0, "flujo": -41162.0, "acumulado": -21162.0 },
        { "mes": 2, "periodo": "2026-04", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 4129.57, "compra": 0.0, "flujo": 3870.43, "acumulado": -17291.57 },
        { "mes": 3, "periodo": "2026-05", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 4097.63, "compra": 0.0, "flujo": 3902.37, "acumulado": -13389.2 },
        { "mes": 4, "periodo": "2026-06", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 3066.16, "compra": 0.0, "flujo": 4933.84, "acumulado": -8455.36 },
        { "mes": 5, "periodo": "2026-07", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 3035.17, "compra": 0.0, "flujo": 4964.83, "acumulado": -3490.53 },
        { "mes": 6, "periodo": "2026-08", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 3004.64, "compra": 0.0, "flujo": 4995.36, "acumulado": 1504.83 },
        { "mes": 7, "periodo": "2026-09", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 2974.57, "compra": 0.0, "flujo": 5025.43, "acumulado": 6530.26 },
        { "mes": 8, "periodo": "2026-10", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 2944.95, "compra": 0.0, "flujo": 5055.05, "acumulado": 11585.3 },
        { "mes": 9, "periodo": "2026-11", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1915.78, "compra": 0.0, "flujo": 6084.22, "acumulado": 17669.52 },
        { "mes": 10, "periodo": "2026-12", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1887.04, "compra": 0.0, "flujo": 6112.96, "acumulado": 23782.48 },
        { "mes": 11, "periodo": "2027-01", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1858.74, "compra": 0.0, "flujo": 6141.26, "acumulado": 29923.74 },
        { "mes": 12, "periodo": "2027-02", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1830.86, "compra": 0.0, "flujo": 6169.14, "acumulado": 36092.89 },
        { "mes": 13, "periodo": "2027-03", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1803.39, "compra": 0.0, "flujo": 6196.61, "acumulado": 42289.49 },
        { "mes": 14, "periodo": "2027-04", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1776.34, "compra": 0.0, "flujo": 6223.66, "acumulado": 48513.15 },
        { "mes": 15, "periodo": "2027-05", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1749.7, "compra": 0.0, "flujo": 6250.3, "acumulado": 54763.45 },
        { "mes": 16, "periodo": "2027-06", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1723.45, "compra": 0.0, "flujo": 6276.55, "acumulado": 61040.0 },
        { "mes": 17, "periodo": "2027-07", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1697.6, "compra": 0.0, "flujo": 6302.4, "acumulado": 67342.4 },
        { "mes": 18, "periodo": "2027-08", "ingresos": 20000.0, "gastos": 12000.0, "compromisos": 1672.14, "compra": 0.0, "flujo": 6327.86, "acumulado": 73670.27 }
      ],
      "indicadores": {
        "flujo_minimo": -41162.0,
        "mes_flujo_minimo": 1,
        "acumulado_minimo": -21162.0,
        "meses_en_negativo": 5,
        "primer_mes_negativo": 1
      },
      "score": {
        "puntaje": 53,
        "puntaje_bruto": 53.11,
        "nivel": "en_riesgo",
        "nivel_texto": "En riesgo",
        "tope_aplicado": false,
        "motivo_tope": null,
        "cambio": -25
      },
      "veredicto": "no_recomendable",
      "veredicto_texto": "No recomendable por ahora",
      "regla": "RN-15",
      "razon": "En 2026-03 tu dinero disponible quedaría en -$21,162.00: no alcanzaría para cubrir tus gastos y pagos.",
      "menor_impacto": true
    },
    {
      "id": "msi-1-3",
      "tipo": "msi",
      "tarjeta_id": 1,
      "tarjeta_nombre": "Tarjeta A",
      "meses": 3,
      "aplica": false,
      "motivo": {
        "codigo": "LIMITE_INSUFICIENTE",
        "mensaje": "La tarjeta Tarjeta A solo tiene $32,000.00 de crédito disponible y la compra es de $45,000.00."
      },
      "mensualidad": null,
      "balance": [],
      "indicadores": null,
      "score": null,
      "veredicto": null,
      "veredicto_texto": null,
      "regla": null,
      "razon": null,
      "menor_impacto": false
    },
    {
      "id": "msi-1-6",
      "tipo": "msi",
      "tarjeta_id": 1,
      "tarjeta_nombre": "Tarjeta A",
      "meses": 6,
      "aplica": false,
      "motivo": {
        "codigo": "LIMITE_INSUFICIENTE",
        "mensaje": "La tarjeta Tarjeta A solo tiene $32,000.00 de crédito disponible y la compra es de $45,000.00."
      },
      "mensualidad": null,
      "balance": [],
      "indicadores": null,
      "score": null,
      "veredicto": null,
      "veredicto_texto": null,
      "regla": null,
      "razon": null,
      "menor_impacto": false
    },
    {
      "id": "msi-1-12",
      "tipo": "msi",
      "tarjeta_id": 1,
      "tarjeta_nombre": "Tarjeta A",
      "meses": 12,
      "aplica": false,
      "motivo": {
        "codigo": "LIMITE_INSUFICIENTE",
        "mensaje": "La tarjeta Tarjeta A solo tiene $32,000.00 de crédito disponible y la compra es de $45,000.00."
      },
      "mensualidad": null,
      "balance": [],
      "indicadores": null,
      "score": null,
      "veredicto": null,
      "veredicto_texto": null,
      "regla": null,
      "razon": null,
      "menor_impacto": false
    },
    {
      "id": "msi-1-18",
      "tipo": "msi",
      "tarjeta_id": 1,
      "tarjeta_nombre": "Tarjeta A",
      "meses": 18,
      "aplica": false,
      "motivo": {
        "codigo": "LIMITE_INSUFICIENTE",
        "mensaje": "La tarjeta Tarjeta A solo tiene $32,000.00 de crédito disponible y la compra es de $45,000.00."
      },
      "mensualidad": null,
      "balance": [],
      "indicadores": null,
      "score": null,
      "veredicto": null,
      "veredicto_texto": null,
      "regla": null,
      "razon": null,
      "menor_impacto": false
    }
  ],
  "menor_impacto": "contado",
  "veredicto": "no_recomendable",
  "veredicto_texto": "No se recomienda realizar esta compra por ahora",
  "faltantes": [],
  "supuestos": [
    "Se considera que pagas solo el mínimo de tus tarjetas (supuesto de T25), porque todavía no se captura tu forma de pago.",
    "Tus gastos variables se estiman con el promedio de los últimos 3 meses que tienen registros.",
    "Ahorro disponible hoy: $20,000.00.",
    "De contado se paga completo este mes, con efectivo o débito."
  ],
  "version_modelo": "T25-v1"
}

export function leerEscenarioSimulador(): EscenarioSimulador {
  const valor = new URLSearchParams(window.location.search).get('demo')
  return valor === 'sin_opcion' || valor === 'sin_opciones' || valor === 'sin_ingresos' || valor === 'error' ? valor : 'normal'
}

export function simulacionEjemplo(escenario: Exclude<EscenarioSimulador, 'sin_ingresos' | 'error'>): SimulacionResponse {
  if (escenario === 'sin_opcion') return SIN_OPCION
  if (escenario === 'sin_opciones') {
    // Mismo caso sin la opción de contado: nada se puede comparar.
    return {
      ...SIN_OPCION,
      estado: 'sin_escenarios_validos',
      escenarios: SIN_OPCION.escenarios.filter((e) => !e.aplica),
      menor_impacto: null,
      veredicto: null,
      veredicto_texto: null,
    }
  }
  return NORMAL
}
