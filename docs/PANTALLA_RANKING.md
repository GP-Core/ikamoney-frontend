# Pantalla de ranking de deudas (T44)

Ruta: `/?ranking`. Muestra las deudas en el orden que devuelve el priorizador y explica cada posición en pesos.

**El frontend no reordena.** Pinta `deudas` tal como llegan. Si algo se ve raro, se reporta a Ramón.

## Escenarios simulados (hoja de T26)
| URL | Qué se ve |
| --- | --- |
| `/?ranking` | CP-11: Tarjeta A (60 %, $20,000) primero, Tarjeta B (45 %, $12,000) segunda |
| `/?ranking&demo=empate` | CE-08: dos tarjetas con la misma tasa; va primero la de mayor utilización |
| `/?ranking&demo=una` | Una sola deuda |
| `/?ranking&demo=sin_deudas` | Estado positivo, sin pantalla vacía |
| `/?ranking&demo=error` | Falla la carga, con "Reintentar" |

## Contrato propuesto para GET /api/v1/priorizador
Ver `src/types/ranking.ts`. Por deuda: `posicion, nombre, tipo, saldo, tasa_anual, costo_mensual_pct, interes_mensual, limite, utilizacion, pago_minimo, desempate`. Montos en pesos y porcentajes en % (60 = 60 %).

## Jueves: conectar
En `.env` poner `VITE_RANKING_USAR_EJEMPLO=false`. Solo cambia `services/ranking.ts`.

## Pendientes por confirmar
- Umbrales del semáforo según la tasa (`UMBRALES_TASA` en `utils/ranking.ts`): provisionales, ni T20 ni T26 los definen.
- Que el motor devuelva `interes_mensual`, `pago_minimo` y `desempate` ya calculados.
