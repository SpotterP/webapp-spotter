# Spotter - Web App

Web de Spotter en React para consultar rutinas y perfil con la API [backend-spotter](https://github.com/SpotterP/backend-spotter).

## Instalar las dependencias

```bash
npm install
```

Hace falta el backend arrancado con su MongoDB (ver su [README](https://github.com/SpotterP/backend-spotter#readme): `npm install`, `cp .env.example .env`, `npm run seed` y `npm run dev`).

Toda la configuración de la API está en un solo sitio en [`src/config.ts`](src/config.ts) mediante la variable `VITE_API_URL`. Por defecto apunta a `http://localhost:1337`. Para cambiarla sin tocar código, se puede crear un archivo `.env.local` a partir de `.env.example`:

```bash
cp .env.example .env.local
```

## Ejecutar

Mientras programas, arranca Vite en modo desarrollo:

```bash
npm run dev
```

Queda disponible en <http://localhost:5173>. Para entrar se puede usar el usuario normal de prueba del seed del backend: `user@example.com` / `seminari7`, o registrar un usuario nuevo en la pantalla de registro.

Para compilar la versión de producción:

```bash
npm run build
```

## Linter y hook de Git

El linter es [Oxlint](https://oxc.rs/docs/guide/usage/linter) (el mismo que el backend), con sus reglas en `.oxlintrc.json`:

```bash
npm run lint        # analiza src/
npm run lint:fix    # aplica las correcciones automáticas
```

Al hacer `npm install` se activa solo un hook de Git (`.githooks/pre-commit`, lo configura el script `prepare`).
Antes de cada `git commit` pasa `npm run lint`: si el linter encuentra un error, el commit se cancela y dice qué arreglar.
Se puede saltar una vez con `git commit --no-verify`, pero lo normal es arreglar el aviso.

## Pantallas

Sin sesión, cualquier página protegida redirige a `/login`.

| Ruta | Pantalla | Quién puede | Qué hace |
|---|---|---|---|
| `/login` | Iniciar sesión | solo sin sesión | Pide email y contraseña a `POST /auth/login`, guarda los tokens y el usuario, y redirige a la app |
| `/registro` | Crear cuenta | solo sin sesión | Registra un usuario nuevo con rol `USER` (`POST /auth/register`), sin token, y lleva al login con aviso de confirmación |
| `/rutinas` | Mis rutinas | con sesión | Lista de rutinas del usuario, creación y eliminación |
| `/rutinas/:id` | Editar rutina | con sesión | Detalle y edición de rutina (en desarrollo) |
| `/progreso` | Progreso | con sesión | Resumen del progreso (`GET /users/me/progress`) y lista de entrenamientos realizados (`GET /users/me/sessions`). Se actualiza sola en tiempo real, ver más abajo |
| `/perfil` | Perfil | con sesión | Muestra el nombre y el correo del usuario autenticado |
| cualquier otra | — | — | Redirige a `/rutinas` (o a `/login` si no hay sesión) |

## Tiempo real (Socket.IO)

La pantalla **Progreso** se actualiza sola cuando se guarda un entrenamiento, en la web, en la app o en otro dispositivo, sin recargar la página.
Usa Socket.IO (`socket.io-client`, en `src/api/realtime.ts`) con la misma URL que la API, igual que la pestaña Progreso de la app:

- Al abrir la pantalla carga los datos y después abre la conexión con el token de la sesión. Al salir de la pantalla o cerrar sesión, la cierra.
- Cuando el backend emite `session:created`, la pantalla vuelve a pedir el resumen y la lista.
- Si no se puede conectar (servidor caído o token que no vale), la pantalla sigue funcionando y no sale ningún error.

## Qué queda fuera de la demo

Esta demo web cubre el flujo de autenticación, renovación de token por refresh, navegación protegida, listado y edición de rutinas, perfil y progreso con avisos en tiempo real. El seguimiento de entrenamientos activos, el registro de series y el calendario quedan en la app móvil.
