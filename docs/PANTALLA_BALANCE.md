# Pantalla principal: balance del mes y proyección

Es la primera pantalla que ve el usuario al entrar y la que se muestra en la demo. Está hecha mobile-first (se diseña para 360 px de ancho y se acomoda en dos columnas a partir de 900 px).

## Qué muestra

| Bloque | Qué responde |
| --- | --- |
| **Resumen del mes** | Una tarjeta verde con el dinero que te queda libre en grande, dentro de un anillo que reparte el ingreso entre gastos fijos, variables, MSI y libre. Arriba, una frase sencilla dice cómo vas ("Vas bien este mes", "Te queda poco margen" o "Este mes te pasas"). Si los gastos superan al ingreso, la cifra dice "Te faltan" en tono rojizo. |
| **Próximos 6 meses** | Barras apiladas de lo que sale cada mes y una línea con lo que entra. Se toca (o se navega con teclado) un mes para ver su detalle. |
| **MSI comprometido** | Dentro de la gráfica, las mensualidades de MSI van rayadas en morado para distinguirlas. Debajo, el bloque "Compromisos a MSI" dice qué porcentaje de lo proyectado ya está comprometido, el saldo pendiente, cuántos planes hay, cuándo se termina de pagar y en qué mes se libera dinero. |
| **Usuario nuevo** | Si no hay ingresos, gastos ni MSI, en lugar de ceros se muestra una guía de tres pasos. |
| **Carga y error** | Esqueleto mientras carga y un mensaje con botón "Reintentar" si falla. |

## Dónde va cada archivo

Los archivos del zip llevan las mismas rutas que el repo: se copian encima de la raíz de `ikamoney-frontend`.

**Nuevos**

| Ruta | Qué contiene |
| --- | --- |
| `src/pages/BalancePage.tsx` y `.css` | La pantalla: arma los bloques y maneja carga, error y vacío |
| `src/components/ResumenMes.tsx` y `.css` | Resumen del mes |
| `src/components/GraficaProyeccion.tsx` y `.css` | Gráfica SVG (sin librerías) y detalle del mes elegido |
| `src/components/CompromisosMsi.tsx` y `.css` | Bloque de compromisos a MSI |
| `src/components/BalanceVacio.tsx` y `.css` | Estado del usuario nuevo |
| `src/hooks/useBalance.ts` | Carga el balance de un mes; reintentar |
| `src/hooks/useContador.ts` | Anima la cifra de dinero libre al cargar (respeta "reducir movimiento") |
| `src/services/balance.ts` | `obtenerBalance(mes)`: el único punto donde se decide entre datos de ejemplo y backend |
| `src/services/balanceEjemplo.ts` | Datos de ejemplo para la demo |
| `src/services/session.ts` | Lee y guarda el token JWT |
| `src/types/balance.ts` | Tipos del contrato de T33 |
| `src/utils/formatMes.ts` | Nombres y aritmética de meses (`AAAA-MM`) |
| `src/utils/pesos.ts` | Formato de pesos mexicanos |

**Reemplazan a un archivo existente**

| Ruta | Qué cambia |
| --- | --- |
| `src/App.tsx` | Muestra `BalancePage`. La pantalla de estado del sistema sigue en `/?sistema` |
| `src/services/api.ts` | Manda el token en `Authorization: Bearer` y lee el mensaje de error `{codigo, mensaje, campos}` del backend |
| `src/types/api.ts` | `ApiErrorBody` acepta `codigo` y `mensaje` |
| `src/vite-env.d.ts` | Declara la variable `VITE_USAR_DATOS_EJEMPLO` |
| `.env.example` | Agrega `VITE_USAR_DATOS_EJEMPLO=true` |

Para probar: copia los archivos, copia `.env.example` a `.env` si no lo tienes, `npm run dev` y abre <http://localhost:5173>. Antes de subir corre `npm run build` y `npm run lint`.

## Datos de ejemplo para la demo

Mientras `VITE_USAR_DATOS_EJEMPLO=true` (el valor por defecto) la pantalla no llama al backend y muestra la etiqueta "Datos de ejemplo". Se elige el escenario con `?demo=` en la URL:

| URL | Qué se ve |
| --- | --- |
| `/` | Usuario con datos: libre positivo y MSI que baja en febrero |
| `/?demo=apretado` | Un mes en rojo ("Te faltan $700") |
| `/?demo=vacio` | Usuario nuevo, sin datos |
| `/?demo=error` | Falla la carga, con botón "Reintentar" |

Las flechas del encabezado cambian de mes.

## Contrato propuesto para el endpoint de T33

T33 aún no existe, así que éste es el contrato que usa la pantalla. Quien implemente T33 puede ajustarlo, pero entonces hay que cambiar `src/types/balance.ts`.

```
GET /api/v1/balance?mes=2026-10&meses=6
Authorization: Bearer <JWT>
```

| Parámetro | Obligatorio | Descripción |
| --- | --- | --- |
| `mes` | No | `AAAA-MM`. Por defecto, el mes actual (hora de México) |
| `meses` | No | Cuántos meses devolver contando el consultado. Por defecto 6; de 2 a 12 |

Respuesta 200:

```json
{
  "mes": "2026-10",
  "tiene_datos": true,
  "resumen": {
    "mes": "2026-10",
    "ingresos": 30000,
    "gastos_fijos": 12200,
    "gastos_variables": 4800,
    "msi": 3200,
    "libre": 9800
  },
  "proyeccion": [
    { "mes": "2026-11", "ingresos": 30000, "gastos_fijos": 12200, "gastos_variables": 0, "msi": 3200, "libre": 14600 }
  ],
  "msi": { "saldo_pendiente": 21000, "planes_activos": 3, "ultimo_mes": "2027-07" }
}
```

`proyeccion` trae los `meses − 1` meses siguientes, en orden (aquí se abrevió a uno). Los errores usan el formato de siempre: `{codigo, mensaje, campos}`.

### Cómo se calcula cada cifra

Todo sale de lo que ya existe en `/movimientos`, `/msi` y `/tarjetas`:

| Campo | Cálculo |
| --- | --- |
| `ingresos` | Suma de los ingresos activos que caen en ese mes (misma expansión de recurrentes que `GET /movimientos`) |
| `gastos_fijos` | Suma de los gastos activos con clase `fijo` que caen en ese mes |
| `gastos_variables` | Suma de los gastos `variable` del mes consultado. En los meses de `proyeccion` es siempre 0, porque no se pueden prever |
| `msi` | Suma de `monto_mensualidad` de los planes MSI activos con `mensualidades_restantes` mayor al número de meses que faltan para ese mes (0 para el mes actual, 1 para el siguiente, etc.) |
| `libre` | `ingresos − gastos_fijos − gastos_variables − msi`. Puede ser negativo |
| `tiene_datos` | `false` solo si el usuario no tiene ningún ingreso, gasto ni plan MSI activo |
| `msi.saldo_pendiente` | Suma de `saldo_pendiente` de los planes MSI activos |
| `msi.planes_activos` | Número de planes MSI activos |
| `msi.ultimo_mes` | Mes del último pago: el mes actual más (mayor `mensualidades_restantes` − 1). `null` si no hay planes |

Los montos son números JSON, como en el resto de la API. Las compras a MSI no están en `gasto` (entran por el estado de cuenta), así que sumar `msi` aparte no cuenta nada dos veces.

### Puntos por acordar con T33

1. **Meses pasados.** El saldo de MSI se conoce a hoy, así que para un mes anterior al actual `msi` no es exacto. La pantalla permite navegar a meses pasados; si T33 prefiere, puede devolver `msi: 0` allí o limitar la navegación.
2. **Gastos variables en la proyección.** Hoy se proyectan en 0. Si se quisiera estimarlos (por ejemplo, el promedio de los últimos meses), sería un campo aparte, para no mezclarlo con lo comprometido.

## Conectar con T33 (jueves)

1. En `.env` del frontend: `VITE_USAR_DATOS_EJEMPLO=false`. Reinicia `npm run dev` (Vite lee el `.env` solo al arrancar).
2. El backend debe estar levantado y permitir `http://localhost:5173` en `CORS_ORIGINS`.
3. Los endpoints de `/api/v1` exigen token. Mientras no exista la pantalla de login, genera uno con el script de "Probar los endpoints" del README del backend y guárdalo desde la consola del navegador:

   ```js
   localStorage.setItem('ikamoney_token', '<pega-el-token>')
   ```

   Recarga la página. `apiFetch` lo manda solo. Dura 24 horas. Un 401 aparece como "La sesión venció o no es válida" con el botón "Reintentar".
4. Si la respuesta de T33 difiere del contrato, el único archivo de tipos a tocar es `src/types/balance.ts`; si hay que adaptar nombres, se hace en `obtenerBalance()` de `src/services/balance.ts`, sin tocar los componentes.

## Decisiones de diseño

- **Gráfica en SVG propio**, sin librería: el proyecto no tiene ninguna y así no se agrega una dependencia para una sola gráfica. Escala con el ancho del celular.
- **El MSI se distingue por patrón rayado**, no solo por color, para que se vea también sin distinguir colores y en pantallas con poco contraste.
- **Se toca un mes para ver el detalle** en lugar de pasar el dedo encima (no hay hover en celular). Cada mes es un botón accesible con teclado.
- **Nada se pinta en cero si el usuario es nuevo**: se muestra la guía en lugar de una gráfica vacía.
- **Una sola cosa llamativa:** la tarjeta verde con el anillo. Es lo único que se anima al entrar (el anillo se dibuja y la cifra cuenta hasta su valor, menos de un segundo); el resto está quieto. Con "reducir movimiento" activado no se anima nada.
- **Lenguaje cercano:** "Te queda libre", "Vas bien este mes", "Cómo se ven tus próximos 6 meses". Sin términos financieros.
- **Paleta en `BalancePage.css`:** verde profundo para el resumen, ámbar para gastos variables, verde menta para el dinero libre y violeta (siempre rayado en la gráfica) solo para MSI. Modo claro y oscuro. Los textos y tamaños usan la tipografía del sistema, sin descargar fuentes.
- **Tarjetas con jerarquía:** el resumen es más grande y oscuro, la gráfica es blanca y el bloque de MSI lleva un fondo lila suave para que se asocie con el rayado de la gráfica.
- **Los pasos del estado vacío no tienen botones** porque todavía no existen las pantallas de captura. Cuando existan, hay que enlazarlos desde `BalanceVacio.tsx`.
