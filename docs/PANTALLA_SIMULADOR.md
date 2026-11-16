# Pantalla del simulador: resultado de una compra

Responde "¿debería comprarlo?": los escenarios lado a lado, cómo queda el dinero mes a mes con cada uno y el veredicto. Se abre en `/?simulador`. Consume `POST /api/v1/simulador/calcular` (T40, motor de T41).

## Qué muestra

| Bloque | Qué responde |
| --- | --- |
| **Veredicto general** | El veredicto del escenario de menor impacto, tal como lo manda el backend, con la opción sugerida, su razón y el score de hoy. |
| **Formas de pagarlo** | Una tarjeta por escenario que aplica: mensualidad, score resultante y cuánto cambia contra el de hoy, veredicto con su color e icono, y el mes más justo con cifras. La de menor impacto lleva sello y borde. |
| **Cuánto te queda disponible** | Una línea por escenario con `balance[].acumulado`. La línea de $0 es la referencia; debajo de ella el dinero no alcanza. Cada línea lleva su nombre y su cifra final, sin ejes ni leyenda. Los puntos marcan el mes más justo. Se ven 6 meses y un botón cambia a todo el horizonte. |
| **Lo que no se pudo comparar** | Los escenarios con `aplica: false`, agrupados por motivo. Siempre visibles. |
| **Explicación** | Espacio para la IA (SC-06). Con `texto` vacío no se pinta nada. Es un bloque aparte, sin color de semáforo. Se puede ver con `/?simulador&ia` (solo con datos de ejemplo). |

## Reglas que respeta

- **El veredicto no se calcula en pantalla.** Se usan `veredicto`, `veredicto_texto` y `menor_impacto` tal cual. Lo único que se calcula es el dato de apoyo ("En marzo te faltarían $162…"), que sale de `balance` y no decide nada.
- **Sin regaño.** "No recomendable por ahora" va con la cifra, no con un juicio.
- **Si todo es "no recomendable"**, la de menor impacto se rotula "Menor impacto" y no "Opción sugerida" (el backend manda `veredicto_texto` = "No se recomienda realizar esta compra por ahora").
- **Semáforo de T20**, con color, forma de icono y texto en cada veredicto: Sano (círculo con palomita) para recomendable, Precaución (triángulo con !) para con precaución y Riesgo (rombo con !) para no recomendable. Las tarjetas siguen los componentes base de T20 (crema, borde arena, línea superior de 4 px, radio 10) y el dorado marca la opción sugerida.

## Dónde va cada archivo

Las rutas son las del repo: se copian encima de la raíz de `ikamoney-frontend`.

**Nuevos:** `src/pages/SimuladorPage.tsx`; `src/components/` `ResumenVeredicto`, `ComparativaEscenarios`, `GraficaEscenarios` (+ `.css`), `EscenariosNoViables`, `ExplicacionIa`, `Simulador.css`; `src/hooks/useSimulacion.ts`; `src/services/simulador.ts` y `simuladorEjemplo.ts`; `src/types/simulador.ts`; `src/utils/simulador.ts`.

**Reemplazan:** `src/App.tsx` (agrega `/?simulador`), `src/vite-env.d.ts` y `.env.example` (variable `VITE_SIMULADOR_USAR_EJEMPLO`).

## Datos de ejemplo

Con `VITE_SIMULADOR_USAR_EJEMPLO=true` (por omisión) no llama al backend. Las respuestas son **reales**: se generaron con el motor de T41 y el perfil de T26 (ingreso 20,000; 2 tarjetas; 2 MSI), así que coinciden con el backend (contado −$162 en marzo y score 53; 12 MSI score 70; 18 MSI score 71; score de hoy 78).

| URL | Qué se ve |
| --- | --- |
| `/?simulador` | Laptop de $9,000, prioridad media, ahorro $5,000: contado no alcanza, los MSI sí |
| `/?simulador&demo=sin_opcion` | Compra de $45,000: la tarjeta no alcanza para MSI y de contado no alcanza el dinero |
| `/?simulador&demo=sin_opciones` | Ninguna forma de pago aplica |
| `/?simulador&demo=sin_ingresos` | El 400 `SIN_INGRESOS` |
| `/?simulador&demo=error` | Falla la carga, con "Reintentar" |

## La compra a simular

La captura de la compra es otra pantalla, así que por ahora sale de la URL:

```
/?simulador&descripcion=Laptop&precio=9000&prioridad=media&ahorro=5000
```

`escenarios` no se manda: el backend evalúa contado y MSI a 3, 6, 12 y 18 meses con la tarjeta de más crédito. Sin precio válido y con el backend conectado, se muestra "Aún no hay una compra para simular".

## Conectar con el endpoint (viernes)

1. En `.env`: `VITE_SIMULADOR_USAR_EJEMPLO=false` y reinicia `npm run dev`.
2. Backend arriba, con `http://localhost:5173` en `CORS_ORIGINS`, y datos de T26 cargados con `seed_demo.py`.
3. Token en el navegador: `localStorage.setItem('ikamoney_token', '<token>')`.
4. Abre `/?simulador&descripcion=Laptop&precio=9000&prioridad=media&ahorro=5000`. Debe dar: contado −$162 en marzo (no recomendable), 12 MSI score 70, 18 MSI sugerida con score 71.

La respuesta ya tiene la forma de `SimulacionResponse`; si algo cambia, el único archivo de tipos es `src/types/simulador.ts`.

## Pendientes

- **Estado Crítico de T20:** el backend manda tres veredictos y el semáforo tiene cuatro estados. "No recomendable" usa Riesgo; el octágono Crítico no se usa porque "por ahora" no es una alerta de acción inmediata. Si el equipo prefiere Crítico, se cambia el mapa `TONO_VEREDICTO` y se agrega la forma en `IconoVeredicto.tsx`.
- **Tipografía de T20:** la guía pide Playfair Display y Source Sans 3, pero el resto de la app usa la fuente del sistema (sin descargar fuentes), así que esta pantalla hace lo mismo para no desentonar.
- **Modo oscuro:** T20 no lo define; los colores de gráfica pasan a texto y su tinte a fondo.
- **SC-06:** al integrarse, pasar el texto a `<ExplicacionIa texto={…} />` en `SimuladorPage.tsx`.
