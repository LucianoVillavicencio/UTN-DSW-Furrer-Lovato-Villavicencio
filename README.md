# FLG Gym

Plataforma de gestión integral para un gimnasio: administradores gestionan clases, profesores,
planes y pagos; socios reservan turnos, gestionan su suscripción y siguen su historial de pagos.

![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5%2F6-3178C6?logo=typescript&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql&logoColor=white)
![Status](https://img.shields.io/badge/status-en%20desarrollo-yellow)
![License](https://img.shields.io/badge/license-académico%20%2F%20sin%20licencia%20pública-lightgrey)

Trabajo Práctico de la materia **Desarrollo de Software (UTN)**. No es un paquete publicado ni
tiene pipeline de CI — las badges de stack son informativas.

## Índice

- [Integrantes del grupo](#integrantes-del-grupo)
- [Acerca del proyecto](#acerca-del-proyecto)
- [Capturas](#capturas)
- [Stack](#stack)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Modelo de dominio](#modelo-de-dominio)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Uso rápido](#uso-rápido)
- [Configuración](#configuración)
- [Scripts útiles](#scripts-útiles)
- [Roadmap y estado](#roadmap-y-estado)
- [Flujo de trabajo / Contribuciones](#flujo-de-trabajo--contribuciones)
- [Soporte / Preguntas frecuentes](#soporte--preguntas-frecuentes)
- [Documentación adicional](#documentación-adicional)
- [Licencia](#licencia)
- [Agradecimientos](#agradecimientos)

## Integrantes del grupo

| Legajo | Integrante |
| :--- | :--- |
| 47853 | Furrer, Francisco |
| 52200 | Lovato, Gabriel |
| 52118 | Villavicencio, Luciano |

## Acerca del proyecto

FLG Gym reemplaza la gestión manual (planillas, WhatsApp, cuadernos) de un gimnasio por una
plataforma web con dos vistas: un **panel de administración** (clases, profesores, planes,
socios, pagos presenciales) y un **panel de socio** (perfil, cambio de plan, historial de pagos).
Nace como TP de la cátedra pero está pensado para poder correr en un gimnasio real chico/mediano.

Funcionalidades principales:

- **Autenticación y roles**: login/registro propio y con Google (OAuth), JWT, y control de
  acceso por rol (`USER` / `ADMIN`) en cada endpoint y ruta del frontend.
- **Panel de socio**: edición de datos personales, cambio de plan de suscripción y consulta del
  historial de pagos propio.
- **Panel de administración**: ABM de clases, profesores, planes y tipos de clase, con borrado
  lógico y restauración.
- **Gestión de socios**: búsqueda por DNI, email o nombre; edición de perfil, cambio de rol,
  alta/baja y cancelación de suscripción desde el panel de administración.
- **Pagos presenciales**: registro de pagos en efectivo/tarjeta contra la suscripción activa de
  un socio, con historial visible tanto para el admin como para el propio socio.

## Capturas

<img src="front/src/assets/hero.png" alt="Landing de FLG Gym" width="720" />

Diagrama del modelo de dominio: [`assets/MD.drawio.png`](assets/MD.drawio.png).

## Stack

**Backend** (`back/`) — [NestJS](https://nestjs.com/) 11 + TypeORM + MySQL, autenticación JWT
(login/registro propio y Google OAuth), documentación Swagger, validación con `class-validator`.

**Frontend** (`front/`) — React 19 + Vite + TypeScript + Tailwind CSS, routing con
`react-router-dom`, autenticación vía `AuthContext` + rutas protegidas por rol.

## Estructura del repositorio

```
back/    API REST (NestJS)
front/   SPA (React + Vite)
assets/  Diagramas y recursos del proyecto
```

## Modelo de dominio

Entidades principales: `Users`, `Plan`, `Trainer`, `TypeClass`, `Class`, `ClassSession`,
`ClassRegistration`, `Subscription`, `Payment`, `Contact`. Todas soportan borrado lógico
(`deleted`). Roles: `USER` (socio) y `ADMIN`.

## Requisitos

- Node.js 20 o superior
- npm
- MySQL 8 corriendo localmente (o accesible por red)
- (Opcional) credenciales de un OAuth Client de Google, para login con Google

## Instalación

```bash
git clone https://github.com/LucianoVillavicencio/UTN-DSW-Furrer-Lovato-Villavicencio.git
cd UTN-DSW-Furrer-Lovato-Villavicencio

cd back && npm install && cp .env.example .env
cd ../front && npm install && cp .env.example .env
```

Completá los `.env` (ver [Configuración](#configuración)) antes de levantar los servidores.

## Uso rápido

En dos terminales, desde la raíz del repo:

```bash
cd back && npm run start:dev
```

```bash
cd front && npm run dev
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:3000/api/v1`
- Documentación interactiva de la API (Swagger): `http://localhost:3000/api`

## Configuración

### `back/.env`

| Variable | Descripción | Ejemplo |
| :--- | :--- | :--- |
| `PORT` | Puerto donde escucha la API | `3000` |
| `NODE_ENV` | `development` apaga el `synchronize` de TypeORM en producción | `development` |
| `DB_HOST` | Host de MySQL | `localhost` |
| `DB_PORT` | Puerto de MySQL | `3306` |
| `DB_USER` | Usuario de MySQL | `root` |
| `DB_PASSWORD` | Password de MySQL | `root` |
| `DB_NAME` | Base de datos a usar | `flg` |
| `GOOGLE_CLIENT_ID` | Client ID de Google OAuth (login con Google) | `xxx.apps.googleusercontent.com` |
| `JWT_SECRET` | Secreto para firmar los JWT — generar uno propio (`openssl rand -base64 48`) | *(generado)* |
| `JWT_EXPIRES_IN` | Expiración de los tokens | `1d` |
| `FRONTEND_URL` | Origen permitido por CORS | `http://localhost:5173` |

### `front/.env`

| Variable | Descripción | Ejemplo |
| :--- | :--- | :--- |
| `VITE_GOOGLE_CLIENT_ID` | Debe coincidir con `GOOGLE_CLIENT_ID` del backend | `xxx.apps.googleusercontent.com` |
| `VITE_API_URL` | URL base de la API | `http://localhost:3000/api/v1` |

Ninguno de estos valores reales debe commitearse — los `.env` están en `.gitignore`, solo se
versionan los `.env.example`.

## Scripts útiles

| Comando (desde `back/` o `front/`) | Descripción |
| :--- | :--- |
| `npm run start:dev` *(back)* | Backend en modo watch |
| `npm run build` | Compila el proyecto |
| `npm run lint` | Linting |
| `npm test` *(back)* | Tests unitarios (Jest) |
| `npm run test:e2e` *(back)* | Tests end-to-end |
| `npm run dev` *(front)* | Servidor de desarrollo Vite |
| `npm run preview` *(front)* | Sirve el build de producción del frontend |

## Roadmap y estado

Proyecto en desarrollo activo. Fases 0–4 (auth/RBAC, dashboard de socio, dashboard de admin,
gestión de usuarios y pagos presenciales) están terminadas y verificadas end-to-end. Pendiente:
integración de pagos online (Mercado Pago) y hardening de seguridad (rate limiting, audit log,
migraciones). Detalle completo en [`roadmap.md`](roadmap.md).

## Flujo de trabajo / Contribuciones

Proyecto de equipo cerrado (3 integrantes) para la cátedra — no acepta contribuciones externas.
Convención interna: rama por feature (`feature/*`, `refactor/*`) contra `main`, integrada por
Pull Request.

```bash
git checkout -b feature/nombre-de-la-feature
# commits...
git push origin feature/nombre-de-la-feature
# abrir PR contra main
```

## Soporte / Preguntas frecuentes

- **¿Dónde veo todos los endpoints disponibles?** En Swagger, `http://localhost:3000/api`, con
  el backend corriendo.
- **El backend no conecta a MySQL.** Verificá que el servicio esté corriendo y que
  `DB_HOST`/`DB_USER`/`DB_PASSWORD`/`DB_NAME` en `back/.env` coincidan con tu instancia local.
- **El login con Google no funciona.** `GOOGLE_CLIENT_ID` (backend) y `VITE_GOOGLE_CLIENT_ID`
  (frontend) tienen que ser el mismo Client ID, y el origin `http://localhost:5173` debe estar
  autorizado en la configuración del OAuth Client en Google Cloud Console.
- Para dudas puntuales del TP, abrir un issue en este repositorio.

## Documentación adicional

- [`proposal.md`](proposal.md) — propuesta original del TP: alcance funcional y modelo de dominio.
- [`specs.md`](specs.md) — especificación de los dashboards de usuario y administrador.
- [`roadmap.md`](roadmap.md) — plan de implementación por fases y su estado actual.

## Licencia

Trabajo académico sin licencia pública (`UNLICENSED`) — código presentado como Trabajo Práctico
para la cátedra de Desarrollo de Software, UTN. Todos los derechos reservados a sus autores.

## Agradecimientos

- Cátedra de Desarrollo de Software, UTN — consigna y seguimiento del TP.
- [NestJS](https://nestjs.com/) y [Vite](https://vite.dev/) por la documentación de referencia
  usada durante el desarrollo.
