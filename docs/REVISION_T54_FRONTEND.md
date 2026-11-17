# Revisión T54 · frontend (16–20 nov)

Revisión con lista de verificación, no auditoría. Se reporta; quien escribió cada parte lo corrige. Prioridad: caché y cierre de sesión primero, formularios después.

## Revisado

| Área | Cómo se revisó | Resultado |
|---|---|---|
| Caché del service worker | `npm run build` y lectura de `dist/sw.js` | Solo precache de la interfaz (12 archivos) y un `NavigationRoute` que excluye `/api/`. Sin `runtimeCaching`: ninguna respuesta de la API se guarda ahí |
| Cierre de sesión | Sesión de prueba, abrir avisos (se guarda la copia `alertas`), cerrar sesión, listar almacenamiento | Tras cerrar: `sessionStorage` vacío, IndexedDB sin bases, Cache Storage vacío. Queda solo `ikamoney-mock:*` (ver H5) |
| Limpieza al abrir sin token | Lectura de `authProvider.tsx` | Si no hay token, `limpiarDispositivo()` borra lo que haya de una sesión anterior |
| Validadores de formularios | Prueba directa de `utils/validacionFinanzas.ts` con entradas raras; lectura de `utils/validarMovimiento.ts` | Rechazan negativos, cero, vacío, `1e5`, `0x10`, `.5`, `5.`, dígitos de ancho completo y tres decimales. Hallazgos H1 a H3 |
| Mensajes de error | Lectura de `services/api.ts` y `utils/errores.ts` | Los 5xx se reemplazan por un texto genérico; no se muestran trazas. Hallazgo H4 |
| Avisos y configuración (T48, T49) | Prueba manual con datos de prueba | El rango del umbral (10–100) y de los días (1–15) se valida en pantalla y en `utils/alertas.ts` |

## No revisado (queda para el sprint 10)

- Aislamiento entre usuarios con dos cuentas reales y validación del servidor (backend de T54). El servidor que había en `localhost:8000` era una versión sin las rutas de alertas, así que no se pudo probar el contrato real de T48/T49 (ver H6).
- Formularios con el servidor real: la respuesta del backend ante lo mismo que rechaza la pantalla.
- Prueba en dispositivo con la app instalada, en Android y en iPhone.

## Hallazgos

| # | Qué | Dónde | Gravedad | Responsable | Estado |
|---|---|---|---|---|---|
| H1 | `validarFecha` solo comprueba el formato: acepta `2026-02-31` y `0000-00-00`. El servidor las rechaza con 422, pero el mensaje que ve la persona es el del backend | `src/utils/validacionFinanzas.ts:62` | Baja | Quien escribió T30 (tarjetas, MSI y deudas) | Pendiente |
| H2 | `validarMonto` y `leerNumero` quitan todas las comas: `1,2,3` pasa como 123 | `src/utils/validacionFinanzas.ts:5` | Baja | Quien escribió T30 | Pendiente |
| H3 | `validarMovimiento` no limita el largo del concepto; el backend acepta hasta 120 caracteres y responde 422. Además el tope del monto es distinto (9,999,999 en ingresos y gastos; 9,999,999,999.99 en tarjetas) | `src/utils/validarMovimiento.ts:15` | Baja | Quien escribió ingresos y gastos | Pendiente |
| H4 | Si el servidor responde un error sin `mensaje` ni `detail` (por ejemplo, un 404 de un proxy), el mensaje incluye la ruta de la API: `Error 404 al llamar a /v1/...` | `src/services/api.ts:32` | Baja | Quien escribió `api.ts` | Pendiente |
| H5 | Al cerrar sesión se conservan las claves `ikamoney-mock:*`, que incluyen las cuentas de prueba y los datos de ejemplo. Es intencional (documentado en `tokenStorage.ts`), pero solo existe con `VITE_AUTH_MOCK=true`. Hay que asegurarse de que ningún despliegue real tenga esa variable en `true`, o el aviso de privacidad (T55) quedaría contradicho | `src/services/tokenStorage.ts:58` | Media (solo en modo de prueba) | Quien escribió T56 | Pendiente: comprobar la variable en Vercel |
| H6 | El backend que corría en `localhost:8000` no tenía las rutas `/api/v1/alertas`, aunque el código del repositorio sí. Probablemente es una imagen vieja de Docker | Entorno local | Informativa | Quien lleva el backend | Reconstruir con `docker compose up --build -d` |
| H7 | El valor por omisión del umbral de utilización es 70 %. El semáforo de T24 marca amarillo desde 30 % y rojo desde 50 %. T49 pide que los valores por omisión sean los de T24 | `ikamoney-backend/app/core/reglas_alertas.json` | Media | Quien lleva T47 y T24 | Decidir el valor |
| H8 | El correo de alertas enlaza a `{FRONTEND_URL}/alertas`. La ruta existe desde T48, pero solo funciona si `FRONTEND_URL` apunta al dominio del frontend desplegado | `ikamoney-backend/.env` | Baja | Quien lleva T50 | Comprobar en producción |
