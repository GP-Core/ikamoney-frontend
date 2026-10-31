import type { ScoreResponse } from '../types/score'

/**
 * Datos de ejemplo de la pantalla de score (T37), con la misma estructura que GET /api/v1/score.
 * Se generaron con el motor real de T35 (app/services/score_formulas.py y reglas_score.json,
 * modelo T25-v1), así que los números y los textos son los que devuelve el backend.
 *
 * Se elige el escenario con ?demo= en la URL (junto a ?score):
 *   (nada)         → perfil de T25 y T26: ingreso 20,000, dos tarjetas, dos MSI → score 78, En revisión
 *   riesgo         → flujo negativo: el score bruto sale en 75.75 y el tope lo limita a 59
 *   sin_tarjetas   → sin tarjetas: la utilización se omite y su peso se reparte
 *   sin_ingresos   → sin ingresos: no hay score y se pide capturarlos
 *   error          → falla la carga
 */
export type EscenarioScore = 'normal' | 'riesgo' | 'sin_tarjetas' | 'sin_ingresos' | 'error'

const ESCENARIOS: Record<Exclude<EscenarioScore, 'error'>, ScoreResponse> = {
  "normal": {
    "estado": "calculado",
    "puntaje": 78,
    "puntaje_bruto": 77.5,
    "nivel": "en_revision",
    "nivel_texto": "En revisión",
    "tope_aplicado": false,
    "motivo_tope": null,
    "periodo": "2026-10",
    "version_modelo": "T25-v1",
    "factores": [
      {
        "clave": "relacion_deuda_ingreso",
        "nombre": "Relación deuda-ingreso",
        "formula": "F11: (pagos mínimos + mensualidades MSI + otras cuotas) / ingreso × 100",
        "disponible": true,
        "peso": 30.0,
        "peso_efectivo": 30.0,
        "valor": 20.81,
        "categoria": null,
        "subpuntaje": 100.0,
        "aporte": 30.0,
        "puntos_perdidos": 0.0,
        "explicacion": "Destinas el 20.8 % de tu ingreso a pagar tarjetas, MSI y otras deudas. Este factor obtiene 100 de 100.",
        "como_mejorar": "Baja tus pagos mensuales de deudas o aumenta tu ingreso; lo ideal es que no pasen del 30 % de lo que ganas.",
        "justificacion_peso": "Es el indicador que usan CONDUSEF, Buró de Crédito y BBVA para medir la capacidad de pago (T24): dice si el ingreso alcanza para los compromisos del mes. Por eso es el factor con más peso.",
        "datos": {
          "compromisos": 4162.0,
          "ingreso": 20000.0
        }
      },
      {
        "clave": "utilizacion_credito",
        "nombre": "Utilización de crédito",
        "formula": "F12: (saldos de tarjetas + pendiente de MSI) / suma de límites × 100",
        "disponible": true,
        "peso": 25.0,
        "peso_efectivo": 25.0,
        "valor": 47.78,
        "categoria": null,
        "subpuntaje": 44.44,
        "aporte": 11.11,
        "puntos_perdidos": 13.89,
        "explicacion": "Usas el 47.8 % del límite de tus tarjetas, contando lo que falta de tus MSI. Este factor obtiene 44 de 100.",
        "como_mejorar": "Baja el saldo de tus tarjetas por debajo del 30 % de su límite.",
        "justificacion_peso": "Buró de Crédito recomienda usar menos de la mitad de la línea y FICO dedica 30 % de su score a los montos adeudados (T24). Pesa menos que la deuda-ingreso porque una línea muy usada no siempre significa pagos mensuales altos. Si el usuario no tiene tarjetas, se omite y su peso se reparte (regla 3 de T25).",
        "datos": {
          "saldo_tarjetas": 32000.0,
          "pendiente_msi": 11000.0,
          "limite_total": 90000.0
        }
      },
      {
        "clave": "flujo_libre",
        "nombre": "Flujo libre",
        "formula": "F13: flujo del mes / ingreso × 100",
        "disponible": true,
        "peso": 25.0,
        "peso_efectivo": 25.0,
        "valor": 19.19,
        "categoria": null,
        "subpuntaje": 97.57,
        "aporte": 24.39,
        "puntos_perdidos": 0.61,
        "explicacion": "Después de gastos y compromisos te queda el 19.2 % de tu ingreso. Este factor obtiene 98 de 100.",
        "como_mejorar": "Recorta gastos variables o compromisos para que te quede al menos el 20 % de tu ingreso cada mes.",
        "justificacion_peso": "Es el eje preventivo de IKAMONEY: el dinero que queda después de cubrir gastos y compromisos (Fórmula 3 de T33). Pesa igual que la utilización, y un flujo negativo además activa el tope de 59 puntos.",
        "datos": {
          "flujo": 3838.0,
          "ingreso": 20000.0
        }
      },
      {
        "clave": "carga_msi",
        "nombre": "Carga de MSI",
        "formula": "F14: mensualidades MSI del mes / ingreso × 100",
        "disponible": true,
        "peso": 10.0,
        "peso_efectivo": 10.0,
        "valor": 10.0,
        "categoria": null,
        "subpuntaje": 100.0,
        "aporte": 10.0,
        "puntos_perdidos": 0.0,
        "explicacion": "Tus mensualidades a meses sin intereses son el 10.0 % de tu ingreso. Este factor obtiene 100 de 100.",
        "como_mejorar": "Evita nuevas compras a meses sin intereses hasta que terminen las actuales; lo ideal es que las mensualidades no pasen del 10 % de tu ingreso.",
        "justificacion_peso": "Las mensualidades MSI ya cuentan dentro de la deuda-ingreso; este factor solo agrega una señal propia de los MSI, que son el diferenciador del producto, con poco peso para no contarlas dos veces.",
        "datos": {
          "mensualidades_msi": 2000.0,
          "ingreso": 20000.0
        }
      },
      {
        "clave": "comportamiento_pago",
        "nombre": "Comportamiento de pago",
        "formula": "Categoría del último periodo: pago total, más del mínimo, solo mínimo o con atraso",
        "disponible": true,
        "peso": 10.0,
        "peso_efectivo": 10.0,
        "valor": null,
        "categoria": "solo_minimo",
        "subpuntaje": 20.0,
        "aporte": 2.0,
        "puntos_perdidos": 8.0,
        "explicacion": "En tu último periodo pagas solo el mínimo. Este factor obtiene 20 de 100.",
        "como_mejorar": "Paga más del mínimo, y si puedes el total, antes de la fecha límite.",
        "justificacion_peso": "Pagar solo el mínimo o con atraso encarece la deuda (T23), pero hoy este dato no se verifica con el banco, así que pesa poco. El atraso además activa el tope de 59 puntos.",
        "datos": {
          "categoria": "solo_minimo"
        }
      }
    ],
    "orden_mejora": [
      "utilizacion_credito",
      "comportamiento_pago",
      "flujo_libre"
    ],
    "faltantes": [],
    "supuestos": [
      "Se considera que pagas solo el mínimo de tus tarjetas (supuesto de T25), porque todavía no se captura tu forma de pago."
    ]
  },
  "riesgo": {
    "estado": "calculado",
    "puntaje": 59,
    "puntaje_bruto": 75.75,
    "nivel": "en_riesgo",
    "nivel_texto": "En riesgo",
    "tope_aplicado": true,
    "motivo_tope": "flujo_negativo",
    "periodo": "2026-10",
    "version_modelo": "T25-v1",
    "factores": [
      {
        "clave": "relacion_deuda_ingreso",
        "nombre": "Relación deuda-ingreso",
        "formula": "F11: (pagos mínimos + mensualidades MSI + otras cuotas) / ingreso × 100",
        "disponible": true,
        "peso": 30.0,
        "peso_efectivo": 30.0,
        "valor": 25.0,
        "categoria": null,
        "subpuntaje": 100.0,
        "aporte": 30.0,
        "puntos_perdidos": 0.0,
        "explicacion": "Destinas el 25.0 % de tu ingreso a pagar tarjetas, MSI y otras deudas. Este factor obtiene 100 de 100.",
        "como_mejorar": "Baja tus pagos mensuales de deudas o aumenta tu ingreso; lo ideal es que no pasen del 30 % de lo que ganas.",
        "justificacion_peso": "Es el indicador que usan CONDUSEF, Buró de Crédito y BBVA para medir la capacidad de pago (T24): dice si el ingreso alcanza para los compromisos del mes. Por eso es el factor con más peso.",
        "datos": {
          "compromisos": 5000.0,
          "ingreso": 20000.0
        }
      },
      {
        "clave": "utilizacion_credito",
        "nombre": "Utilización de crédito",
        "formula": "F12: (saldos de tarjetas + pendiente de MSI) / suma de límites × 100",
        "disponible": true,
        "peso": 25.0,
        "peso_efectivo": 25.0,
        "valor": 5.0,
        "categoria": null,
        "subpuntaje": 100.0,
        "aporte": 25.0,
        "puntos_perdidos": 0.0,
        "explicacion": "Usas el 5.0 % del límite de tus tarjetas, contando lo que falta de tus MSI. Este factor obtiene 100 de 100.",
        "como_mejorar": "Baja el saldo de tus tarjetas por debajo del 30 % de su límite.",
        "justificacion_peso": "Buró de Crédito recomienda usar menos de la mitad de la línea y FICO dedica 30 % de su score a los montos adeudados (T24). Pesa menos que la deuda-ingreso porque una línea muy usada no siempre significa pagos mensuales altos. Si el usuario no tiene tarjetas, se omite y su peso se reparte (regla 3 de T25).",
        "datos": {
          "saldo_tarjetas": 3000.0,
          "pendiente_msi": 0.0,
          "limite_total": 60000.0
        }
      },
      {
        "clave": "flujo_libre",
        "nombre": "Flujo libre",
        "formula": "F13: flujo del mes / ingreso × 100",
        "disponible": true,
        "peso": 25.0,
        "peso_efectivo": 25.0,
        "valor": -2.5,
        "categoria": null,
        "subpuntaje": 35.0,
        "aporte": 8.75,
        "puntos_perdidos": 16.25,
        "explicacion": "Tus gastos y compromisos superan tu ingreso en 2.5 %. Este factor obtiene 35 de 100.",
        "como_mejorar": "Recorta gastos variables o compromisos para que te quede al menos el 20 % de tu ingreso cada mes.",
        "justificacion_peso": "Es el eje preventivo de IKAMONEY: el dinero que queda después de cubrir gastos y compromisos (Fórmula 3 de T33). Pesa igual que la utilización, y un flujo negativo además activa el tope de 59 puntos.",
        "datos": {
          "flujo": -500.0,
          "ingreso": 20000.0
        }
      },
      {
        "clave": "carga_msi",
        "nombre": "Carga de MSI",
        "formula": "F14: mensualidades MSI del mes / ingreso × 100",
        "disponible": true,
        "peso": 10.0,
        "peso_efectivo": 10.0,
        "valor": 5.0,
        "categoria": null,
        "subpuntaje": 100.0,
        "aporte": 10.0,
        "puntos_perdidos": 0.0,
        "explicacion": "Tus mensualidades a meses sin intereses son el 5.0 % de tu ingreso. Este factor obtiene 100 de 100.",
        "como_mejorar": "Evita nuevas compras a meses sin intereses hasta que terminen las actuales; lo ideal es que las mensualidades no pasen del 10 % de tu ingreso.",
        "justificacion_peso": "Las mensualidades MSI ya cuentan dentro de la deuda-ingreso; este factor solo agrega una señal propia de los MSI, que son el diferenciador del producto, con poco peso para no contarlas dos veces.",
        "datos": {
          "mensualidades_msi": 1000.0,
          "ingreso": 20000.0
        }
      },
      {
        "clave": "comportamiento_pago",
        "nombre": "Comportamiento de pago",
        "formula": "Categoría del último periodo: pago total, más del mínimo, solo mínimo o con atraso",
        "disponible": true,
        "peso": 10.0,
        "peso_efectivo": 10.0,
        "valor": null,
        "categoria": "solo_minimo",
        "subpuntaje": 20.0,
        "aporte": 2.0,
        "puntos_perdidos": 8.0,
        "explicacion": "En tu último periodo pagas solo el mínimo. Este factor obtiene 20 de 100.",
        "como_mejorar": "Paga más del mínimo, y si puedes el total, antes de la fecha límite.",
        "justificacion_peso": "Pagar solo el mínimo o con atraso encarece la deuda (T23), pero hoy este dato no se verifica con el banco, así que pesa poco. El atraso además activa el tope de 59 puntos.",
        "datos": {
          "categoria": "solo_minimo"
        }
      }
    ],
    "orden_mejora": [
      "flujo_libre",
      "comportamiento_pago"
    ],
    "faltantes": [],
    "supuestos": [
      "Se considera que pagas solo el mínimo de tus tarjetas (supuesto de T25), porque todavía no se captura tu forma de pago."
    ]
  },
  "sin_tarjetas": {
    "estado": "calculado",
    "puntaje": 89,
    "puntaje_bruto": 89.33,
    "nivel": "saludable",
    "nivel_texto": "Saludable",
    "tope_aplicado": false,
    "motivo_tope": null,
    "periodo": "2026-10",
    "version_modelo": "T25-v1",
    "factores": [
      {
        "clave": "relacion_deuda_ingreso",
        "nombre": "Relación deuda-ingreso",
        "formula": "F11: (pagos mínimos + mensualidades MSI + otras cuotas) / ingreso × 100",
        "disponible": true,
        "peso": 30.0,
        "peso_efectivo": 40.0,
        "valor": 15.0,
        "categoria": null,
        "subpuntaje": 100.0,
        "aporte": 40.0,
        "puntos_perdidos": 0.0,
        "explicacion": "Destinas el 15.0 % de tu ingreso a pagar tarjetas, MSI y otras deudas. Este factor obtiene 100 de 100.",
        "como_mejorar": "Baja tus pagos mensuales de deudas o aumenta tu ingreso; lo ideal es que no pasen del 30 % de lo que ganas.",
        "justificacion_peso": "Es el indicador que usan CONDUSEF, Buró de Crédito y BBVA para medir la capacidad de pago (T24): dice si el ingreso alcanza para los compromisos del mes. Por eso es el factor con más peso.",
        "datos": {
          "compromisos": 3000.0,
          "ingreso": 20000.0
        }
      },
      {
        "clave": "utilizacion_credito",
        "nombre": "Utilización de crédito",
        "formula": "F12: (saldos de tarjetas + pendiente de MSI) / suma de límites × 100",
        "disponible": false,
        "peso": 25.0,
        "peso_efectivo": 0.0,
        "valor": null,
        "categoria": null,
        "subpuntaje": null,
        "aporte": 0.0,
        "puntos_perdidos": 0.0,
        "explicacion": "No tienes tarjetas de crédito registradas, así que este factor no se toma en cuenta.",
        "como_mejorar": "Baja el saldo de tus tarjetas por debajo del 30 % de su límite.",
        "justificacion_peso": "Buró de Crédito recomienda usar menos de la mitad de la línea y FICO dedica 30 % de su score a los montos adeudados (T24). Pesa menos que la deuda-ingreso porque una línea muy usada no siempre significa pagos mensuales altos. Si el usuario no tiene tarjetas, se omite y su peso se reparte (regla 3 de T25).",
        "datos": {
          "saldo_tarjetas": 0.0,
          "pendiente_msi": 0.0,
          "limite_total": 0.0
        }
      },
      {
        "clave": "flujo_libre",
        "nombre": "Flujo libre",
        "formula": "F13: flujo del mes / ingreso × 100",
        "disponible": true,
        "peso": 25.0,
        "peso_efectivo": 33.33,
        "valor": 25.0,
        "categoria": null,
        "subpuntaje": 100.0,
        "aporte": 33.33,
        "puntos_perdidos": 0.0,
        "explicacion": "Después de gastos y compromisos te queda el 25.0 % de tu ingreso. Este factor obtiene 100 de 100.",
        "como_mejorar": "Recorta gastos variables o compromisos para que te quede al menos el 20 % de tu ingreso cada mes.",
        "justificacion_peso": "Es el eje preventivo de IKAMONEY: el dinero que queda después de cubrir gastos y compromisos (Fórmula 3 de T33). Pesa igual que la utilización, y un flujo negativo además activa el tope de 59 puntos.",
        "datos": {
          "flujo": 5000.0,
          "ingreso": 20000.0
        }
      },
      {
        "clave": "carga_msi",
        "nombre": "Carga de MSI",
        "formula": "F14: mensualidades MSI del mes / ingreso × 100",
        "disponible": true,
        "peso": 10.0,
        "peso_efectivo": 13.33,
        "valor": 0.0,
        "categoria": null,
        "subpuntaje": 100.0,
        "aporte": 13.33,
        "puntos_perdidos": 0.0,
        "explicacion": "Tus mensualidades a meses sin intereses son el 0.0 % de tu ingreso. Este factor obtiene 100 de 100.",
        "como_mejorar": "Evita nuevas compras a meses sin intereses hasta que terminen las actuales; lo ideal es que las mensualidades no pasen del 10 % de tu ingreso.",
        "justificacion_peso": "Las mensualidades MSI ya cuentan dentro de la deuda-ingreso; este factor solo agrega una señal propia de los MSI, que son el diferenciador del producto, con poco peso para no contarlas dos veces.",
        "datos": {
          "mensualidades_msi": 0.0,
          "ingreso": 20000.0
        }
      },
      {
        "clave": "comportamiento_pago",
        "nombre": "Comportamiento de pago",
        "formula": "Categoría del último periodo: pago total, más del mínimo, solo mínimo o con atraso",
        "disponible": true,
        "peso": 10.0,
        "peso_efectivo": 13.33,
        "valor": null,
        "categoria": "solo_minimo",
        "subpuntaje": 20.0,
        "aporte": 2.67,
        "puntos_perdidos": 10.67,
        "explicacion": "En tu último periodo pagas solo el mínimo. Este factor obtiene 20 de 100.",
        "como_mejorar": "Paga más del mínimo, y si puedes el total, antes de la fecha límite.",
        "justificacion_peso": "Pagar solo el mínimo o con atraso encarece la deuda (T23), pero hoy este dato no se verifica con el banco, así que pesa poco. El atraso además activa el tope de 59 puntos.",
        "datos": {
          "categoria": "solo_minimo"
        }
      }
    ],
    "orden_mejora": [
      "comportamiento_pago"
    ],
    "faltantes": [],
    "supuestos": [
      "Se considera que pagas solo el mínimo de tus tarjetas (supuesto de T25), porque todavía no se captura tu forma de pago.",
      "No tienes tarjetas: la utilización de crédito no se toma en cuenta y su peso se reparte entre los demás factores (regla 3 de T25)."
    ]
  },
  "sin_ingresos": {
    "estado": "datos_faltantes",
    "puntaje": null,
    "puntaje_bruto": null,
    "nivel": null,
    "nivel_texto": null,
    "tope_aplicado": false,
    "motivo_tope": null,
    "periodo": "2026-10",
    "version_modelo": "T25-v1",
    "factores": [],
    "orden_mejora": [],
    "faltantes": [
      {
        "dato": "ingresos",
        "obligatorio": true,
        "mensaje": "Registra tu ingreso neto mensual (sueldo, honorarios u otros) para calcular tu score."
      },
      {
        "dato": "gastos",
        "obligatorio": false,
        "mensaje": "Registra tus gastos fijos y variables: sin ellos tu flujo libre se ve mejor de lo que es."
      }
    ],
    "supuestos": []
  }
}

export function leerEscenarioScore(): EscenarioScore {
  const valor = new URLSearchParams(window.location.search).get('demo')
  return valor === 'riesgo' || valor === 'sin_tarjetas' || valor === 'sin_ingresos' || valor === 'error'
    ? valor
    : 'normal'
}

export function scoreEjemplo(escenario: Exclude<EscenarioScore, 'error'>): ScoreResponse {
  return ESCENARIOS[escenario]
}
