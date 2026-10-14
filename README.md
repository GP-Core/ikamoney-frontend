# IKAMoney · Frontend

Interfaz web de **IKAMoney**. Es una aplicación de una sola página (SPA) hecha con React que se comunica con la API de [`ikamoney-backend`](../ikamoney-backend).

Por ahora la app tiene una sola pantalla de inicio. Esa pantalla comprueba que el frontend se conecta con el backend y que el backend puede leer la base de datos. Sirve como base para construir el resto de pantallas.

## Tecnologías

| Herramienta | Para qué se usa |
|---|---|
| [React 19](https://react.dev/) | Librería para construir la interfaz con componentes |
| [TypeScript 6](https://www.typescriptlang.org/) | JavaScript con tipos, para detectar errores antes de ejecutar |
| [Vite 8](https://vite.dev/) | Servidor de desarrollo (con recarga en caliente) y empaquetador para producción |
| [ESLint](https://eslint.org/) | Revisa el código y avisa de errores comunes y malas prácticas |

## Requisitos

- **Node.js** 20.19 o superior (o 22.12+). Comprueba tu versión con `node -v`.
- **npm** (viene con Node).
- El **backend** corriendo si quieres que la pantalla muestre "Conectado" (ver [Conexión con el backend](#conexión-con-el-backend)).

## Instalación

```bash
# 1. Instalar dependencias (crea la carpeta node_modules)
npm install

# 2. Crear tu archivo de variables de entorno a partir del ejemplo
cp .env.example .env        # en PowerShell: Copy-Item .env.example .env

# 3. Arrancar el servidor de desarrollo
npm run dev
```

Abre <http://localhost:5173> en el navegador.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Arranca el servidor de desarrollo en `http://localhost:5173`. Los cambios se ven al guardar, sin recargar. |
| `npm run build` | Revisa los tipos con TypeScript (`tsc -b`) y genera la versión de producción en `dist/`. **Si hay errores de tipos, falla aquí** (en `dev` no se revisan). |
| `npm run lint` | Revisa el código con ESLint. |
| `npm run preview` | Sirve la carpeta `dist/` para probar la versión de producción en local (primero hay que correr `npm run build`). |

Por ahora no hay pruebas automáticas configuradas.

## Variables de entorno

Se definen en el archivo `.env`, que **no se sube al repositorio**. En `.env.example` está la plantilla.

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | URL del backend, sin `/api` al final |

Solo las variables que empiezan con `VITE_` se pueden leer desde el código (con `import.meta.env.VITE_...`). Vite las incrusta en el código al compilar, así que **nunca pongas secretos ahí**: cualquiera puede verlas en el navegador. Si cambias el `.env`, reinicia `npm run dev`.

## Conexión con el backend

El backend vive en la carpeta hermana `../ikamoney-backend` (FastAPI + MySQL). Para levantarlo:

```bash
cd ../ikamoney-backend
docker compose up --build
```

- La API queda en `http://localhost:8000`, y todas sus rutas empiezan con `/api`.
- El backend solo acepta peticiones del navegador que vengan de `http://localhost:5173` (CORS). Si arrancas el frontend en otro puerto, cambia `CORS_ORIGINS` en el `.env` del backend.

En la pantalla de inicio verás dos indicadores:

| Indicador | Ruta | En verde significa que… |
|---|---|---|
| API | `GET /api/health` | El backend está encendido |
| Base de datos | `GET /api/ping-db` | El backend además puede leer MySQL |

Si aparecen en rojo con el mensaje *"No se pudo conectar con el backend"*, el backend está apagado, la URL de `VITE_API_URL` está mal o hay un problema de CORS.

## Estructura del proyecto

```
ikamoney-frontend/
├── public/               # Archivos estáticos que se sirven tal cual (favicon…)
├── src/
│   ├── assets/           # Imágenes e íconos que se importan desde el código
│   ├── components/       # Piezas de interfaz reutilizables (StatusBadge…)
│   ├── hooks/            # Hooks propios con lógica de estado (useBackendStatus…)
│   ├── pages/            # Pantallas completas (HomePage…)
│   ├── services/         # Llamadas a la API del backend
│   │   ├── api.ts        #   cliente base: URL, errores, JSON
│   │   └── health.ts     #   endpoints de salud del backend
│   ├── types/            # Tipos de TypeScript compartidos (respuestas de la API…)
│   ├── utils/            # Funciones de ayuda sin estado (formatMoney…)
│   ├── App.tsx           # Componente raíz
│   ├── main.tsx          # Punto de entrada: monta React en el HTML
│   ├── index.css         # Estilos globales y colores (modo claro/oscuro)
│   └── vite-env.d.ts     # Tipos de las variables de entorno
├── index.html            # HTML base donde se monta la app
├── .env.example          # Plantilla de variables de entorno
├── vite.config.ts        # Configuración de Vite
├── eslint.config.js      # Configuración de ESLint
└── tsconfig*.json        # Configuración de TypeScript
```

## Cómo funciona

El recorrido de la pantalla de inicio, de principio a fin:

```
index.html
  └─ main.tsx            monta <App /> dentro de <div id="root">
      └─ App.tsx         muestra la página actual
          └─ pages/HomePage.tsx
              ├─ hooks/useBackendStatus.ts      pide el estado al montar la página
              │   └─ services/health.ts         getHealth() y pingDb()
              │       └─ services/api.ts        apiFetch() → fetch(VITE_API_URL + /api/...)
              │           └─ ikamoney-backend   responde JSON
              └─ components/StatusBadge.tsx     pinta "Cargando", "Conectado" o "Error"
```

Cada capa tiene una sola responsabilidad:

1. **`services/`** sabe *cómo* hablar con el backend. `apiFetch` arma la URL, convierte la respuesta a JSON y, si el backend responde con error, lanza un `ApiError` con el mensaje `detail` que manda FastAPI. Ningún componente usa `fetch` directamente.
2. **`types/`** describe la forma de los datos que devuelve el backend, para que TypeScript avise si se usan mal.
3. **`hooks/`** guarda el estado (cargando / ok / error) y decide *cuándo* llamar a los servicios.
4. **`components/`** y **`pages/`** solo muestran datos. Las páginas combinan hooks y componentes, y los componentes reciben todo por props.

## Cómo agregar algo nuevo

**Un endpoint nuevo del backend** (por ejemplo, transacciones):

1. Define el tipo de la respuesta en `src/types/` (por ejemplo `types/transaction.ts`).
2. Crea las funciones en `src/services/` (por ejemplo `services/transactions.ts`) usando `apiFetch<Tipo>('/transactions')`.
3. Si varias pantallas lo necesitan, envuelve la llamada en un hook en `src/hooks/`.

**Una pantalla nueva:** créala en `src/pages/` (por ejemplo `TransactionsPage.tsx` con su `.css`). Cuando haya más de una pantalla habrá que añadir un enrutador (por ejemplo React Router) en `App.tsx`.

**Un componente reutilizable:** créalo en `src/components/`, con un componente por archivo y el CSS al lado con el mismo nombre.

## Convenciones

- Componentes y páginas en `PascalCase` (`StatusBadge.tsx`), hooks con prefijo `use` (`useBackendStatus.ts`), el resto en `camelCase`.
- Texto de la interfaz y comentarios en **español**.
- Cada componente importa su propio CSS. Los colores salen de las variables de `index.css` (`var(--accent)`, `var(--danger)`…), que ya cambian solas en modo oscuro.
- La configuración de TypeScript es estricta, y estas reglas hacen fallar el `build`:
  - Los tipos se importan con `import type { ... }`.
  - No se permiten `enum` ni `namespace`; usa uniones de strings (`'ok' | 'error'`).
  - No puede haber variables, imports ni parámetros sin usar.

## Qué no se sube al repositorio

El `.gitignore` excluye `node_modules/` (se regenera con `npm install`), `dist/` (se regenera con `npm run build`), los archivos `.env` (excepto `.env.example`), logs, archivos de editores y los archivos locales de Claude Code (`CLAUDE.md`, `.claude/`).
