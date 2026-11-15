# Pantalla de ranking de deudas (T44)

Ruta: `/?ranking`. Muestra las deudas en el orden que devuelve `GET /api/v1/priorizador` y el texto `razon` de cada posición.

**El frontend no reordena.** Pinta `ranking` tal como llega. Si algo se ve raro, se reporta a Ramón.

## Datos simulados (hoja de T26)
| URL | Qué se ve |
| --- | --- |
| `/?ranking` | CP-11: Tarjeta A (60 %) primero, Tarjeta B (45 %) segunda, más un MSI fuera del orden |
| `/?ranking&demo=una` | Una sola deuda |
| `/?ranking&demo=sin_deudas` | Estado positivo |
| `/?ranking&demo=error` | Falla la carga, con "Reintentar" |

## Conectar con el backend
1. `.env`: `VITE_RANKING_USAR_EJEMPLO=false` y `VITE_API_URL=http://localhost:8000`.
2. Backend levantado con `docker compose up --build` y un token guardado en el navegador (ver README del backend o `seed_demo.py`).
3. Reiniciar `npm run dev` y abrir `/?ranking`.

## Pendiente
Los umbrales del semáforo según la tasa (`UMBRALES_TASA` en `utils/ranking.ts`) son provisionales: confirmar con Ramón.
