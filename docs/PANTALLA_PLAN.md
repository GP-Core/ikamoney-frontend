# Pantalla del plan de pago (`/?plan`)

Muestra cuánto abonar a cada deuda, cuándo queda libre el usuario y cuánto ahorra.

## De dónde salen los datos

`GET /api/v1/priorizador?extra_mensual=<pesos>` (backend T43 + T45, ver `docs/PRIORIZADOR.md` del backend). **El frontend no calcula nada**: ranking, fechas, intereses, ahorro y escenario base vienen del backend, para que los cálculos sean auditables y no haya dos motores que se desvíen.

| Pantalla | Campo de la respuesta |
| --- | --- |
| Fecha de liquidación | `plan.total.liquidacion_plan`, `meses_plan` |
| Ahorro y su referencia | `plan.total.ahorro`, `meses_menos` y `plan.escenario_base_texto` (se muestra siempre junto a la cifra) |
| Cuánto abonar a cada deuda | `plan.calendario[].pagos[]` (primer mes y máximo), `plan.deudas[]` para meses, fecha e intereses |
| Por qué va en ese lugar | `ranking[].razon` |
| Control de `extraMensual` | parámetro `extra_mensual`; `plan.extra_sugerido` se ofrece como punto de partida |
| Avisos | `plan.avisos[]` (`EXCEDENTE_NO_SOSTENIBLE`, `SIN_DINERO_EXTRA`, `PLAN_NO_SE_LIQUIDA`, `DEUDA_SIN_PAGO_MENSUAL`; `BASE_NO_SE_LIQUIDA` se refleja en el bloque de ahorro) |
| Supuestos | `plan.supuestos[]` |
| MSI y deudas sin tasa | `sin_ranking[]` y `msi_mes_total` ("Fuera del plan") |

Cada cambio del extra pide el plan de nuevo (con 250 ms de espera y cancelando la petición anterior). Mientras llega, se conserva el último plan y el control muestra "Actualizando…".

## Datos de ejemplo

`VITE_PLAN_USAR_EJEMPLO=true` (por defecto) usa `src/services/planEjemplo.json`, que es la **respuesta real del backend** generada con `scripts/generar_plan_ejemplo.py` (hay que correrlo si cambia la estructura). Está calculado cada $500, y los meses se corren para que el primero sea el actual.

Escenarios con `?demo=` junto a `?plan`: `atrapado` (el pago no cubre los intereses), `vacio` (sin deudas con intereses) y `error`.

Con `VITE_PLAN_USAR_EJEMPLO=false` usa el backend real y requiere el token JWT del usuario (el mismo del resto de pantallas).

## Pruebas

`npm test` prueba las funciones de `src/utils/planVista.ts`. Los cálculos del plan están probados en el backend (`tests/unit/test_plan_pagos.py`, `tests/api/test_plan_pagos.py`).
