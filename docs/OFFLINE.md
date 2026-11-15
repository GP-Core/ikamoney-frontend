# Consulta sin conexión en solo lectura · T60

Sin internet, la app abre y muestra los **últimos datos guardados** de balance, score, tarjetas y deudas, con la fecha y hora en que se obtuvieron. No se puede escribir nada. Al cerrar sesión se borra todo del dispositivo.

La **interfaz** sin conexión es de T59 (`docs/PWA.md`, service worker). Esta tarea agrega los **datos**.

## Cómo funciona

1. Con conexión, cada pantalla pide sus datos como siempre y guarda una copia en IndexedDB con la hora (`services/offline.ts`, función `conCopia`).
2. Sin conexión, o si la petición falla por red, se muestra la última copia y una línea con su fecha: **"Datos guardados el 13 nov 2026, 8:14 p.m. No son actuales"**.
3. Al volver la conexión, las pantallas se actualizan solas.

La conexión se detecta con `navigator.onLine` y los eventos `online`/`offline` (`hooks/useConexion.ts`). Es lo mismo en modo de prueba y en modo real.

| Pantalla | Clave de la copia | Hook |
|---|---|---|
| Balance (por mes) | `balance:AAAA-MM` | `useBalance` |
| Score | `score` | `useScore` |
| Tarjetas y deudas | `tarjetas-deudas` | `useTarjetasYDeudas` |
| Detalle de una tarjeta | `tarjeta:<id>` | `useTarjeta` |
| Usuario (para reabrir la sesión sin red) | `usuario` | `authProvider.tsx` |

Solo se guarda lo que el usuario ya abrió con conexión. Un mes de Balance o una tarjeta que nunca se abrió muestra "Sin conexión y todavía no hay datos guardados de esta pantalla".

La base es `ikamoney-offline`, almacén `copias`, registros `{ datos, guardadoEn }`. Sin sesión no se lee ni se escribe nada.

## Solo lectura: tres barreras

Permitir escribir sin red obligaría a sincronizar después. Por eso hay tres capas, para que ningún botón quede activo por descuido:

| Capa | Dónde | Qué hace |
|---|---|---|
| Botones | `EnlaceEscritura`, `disabled`, `NotaSinConexion` | Agregar, editar y eliminar se apagan y se lee la razón: "Sin conexión: no puedes agregar, editar ni eliminar" |
| Rutas | `SoloConConexion` en `App.tsx` | Los formularios (tarjeta, deuda, MSI) no se muestran sin conexión, ni entrando por la URL |
| Servicio | `services/finanzas.ts` (`escribir`) y `eliminarCuenta` | Última barrera: crear, editar y eliminar lanzan error sin conexión |

"Cerrar sesión" sigue activo sin conexión, porque es lo que borra los datos.

**Si agregas una pantalla o botón que escribe:** apágalo con `useConexion()` o `EnlaceEscritura`, envuelve su ruta con `SoloConConexion` y pasa su llamada por `escribir()`.

**Si agregas una pantalla de consulta:** usa `conCopia(clave, enLinea, pedir)` en su hook y pon `<FechaCopia fecha={copiaDe} />` arriba.

## Cuándo se borra

`limpiarDispositivo()` (`services/dispositivo.ts`, de T56) borra: token, almacenamiento local, **IndexedDB**, cachés de datos y la suscripción push. Se ejecuta:

- Al **cerrar sesión**, aunque no haya conexión.
- Al **expirar la sesión** o responder el servidor 401.
- Al **eliminar la cuenta** (T56).
- Al **abrir la app sin sesión válida**: si alguien cierra el navegador sin cerrar sesión, el token se pierde pero IndexedDB no, y así no le queda a quien use el dispositivo después.

Se conserva la caché de la interfaz (`workbox-precache-*`), que no tiene datos del usuario.

## Limitaciones

- **La sesión no sobrevive al cierre de la app.** El token vive en `sessionStorage` a propósito (T51): al cerrar la app por completo hay que iniciar sesión, y sin internet no se puede. Sí funciona con la app abierta o en segundo plano, y al recargar. Para abrir sin internet desde cero habría que cambiar esa decisión de seguridad.
- **Un formulario abierto cuando se pierde la conexión se reemplaza** por el aviso, y se pierde lo capturado.
- **Las copias son "lo último que viste"**, no un espejo: si editas una tarjeta y pierdes la conexión sin volver a abrir la lista, la copia de la lista puede ser anterior al cambio.
- **Las copias no tienen versión.** Si el backend cambia la forma de una respuesta, una copia vieja puede no coincidir hasta que se vuelva a abrir la pantalla con conexión o se cierre sesión.
- **Modo de prueba (`VITE_AUTH_MOCK=true`):** los datos ya viven en el navegador y no hay red; la copia solo entra en juego cuando `navigator.onLine` es falso.

## Cómo probar

### En la computadora

El service worker solo existe en el build:

```bash
npm run build
```

```bash
npm run preview
```

1. Abre <http://localhost:4173>, inicia sesión (en modo de prueba, crea una cuenta y usa "Cargar datos de ejemplo").
2. Recorre **Balance**, **Score**, **Tarjetas** y el detalle de una tarjeta con conexión. En DevTools → Application → IndexedDB aparece `ikamoney-offline` con sus copias.
3. DevTools → Network → **Offline**. Debe aparecer la franja "Sin conexión · solo lectura", cada pantalla con su fecha y hora, y los botones de agregar, editar y eliminar apagados con su razón. Escribir `/tarjetas/nueva` en la URL muestra el bloqueo.
4. Un mes de Balance que no abriste muestra "no hay datos guardados".
5. Cierra sesión (aun sin conexión): IndexedDB queda sin `ikamoney-offline`.
6. Prueba también cerrar la pestaña sin cerrar sesión, volver a abrir la app y revisar que IndexedDB quedó vacío.

### En el celular en modo avión (pendiente)

Es el criterio real de la tarea y **todavía no se ha hecho**. Necesita HTTPS (Vercel o un túnel); ver "En el celular" en `docs/PWA.md`.

1. Con conexión, abre la app instalada, inicia sesión y recorre Balance, Score, Tarjetas y el detalle de una tarjeta.
2. Activa el **modo avión** sin cerrar la app.
3. Recorre las mismas pantallas: deben verse sus datos con fecha y hora; los botones que escriben, apagados; "Cerrar sesión" activo.
4. Cierra sesión y confirma que al volver a abrir no queda nada.

| Fecha | Dispositivo | Sistema y navegador | ¿Se ven los datos? | ¿Fecha y hora visibles? | ¿Escritura bloqueada? | ¿Se borra al cerrar sesión? | Notas |
|---|---|---|---|---|---|---|---|
| | | | | | | | |

## Archivos

| Archivo | Qué hace |
|---|---|
| `src/services/offline.ts` | Copias en IndexedDB y `conCopia` |
| `src/hooks/useConexion.ts` | Estado de la conexión |
| `src/components/AvisoSinConexion.tsx` | Franja global |
| `src/components/FechaCopia.tsx` | Línea con la fecha y hora de la copia |
| `src/components/SoloConConexion.tsx` | Bloquea las rutas de formularios |
| `src/components/EnlaceEscritura.tsx` | Enlace que se apaga sin conexión |
| `src/components/NotaSinConexion.tsx` | La razón visible |
| `src/components/SinConexion.css` | Estilos de todo lo anterior |
| `src/services/dispositivo.ts` | Limpieza al cerrar sesión (T56 + T60) |
