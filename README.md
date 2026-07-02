# microCLM

CLM (Client Lifecycle Management) de pipeline comercial.

- Frontend: React + TypeScript + Vite.
- Backend: Supabase (Postgres + Auth + Storage + Edge Functions), sin servidor propio.
- Producto genérico y white-label: marca (colores, nombre del tenant) es configuración, no código. Ver [Configuración de marca](#configuración-de-marca).
- Tenant actual: **La Segunda Mordida (LSM)**, diseño minimalista de inspiración japonesa.

## Módulos

- **Tablero Kanban** — pipeline de ventas en 8 etapas, drag & drop, columnas colapsables, persistido en Postgres.
- **Captación de Leads** — crea empresa/contacto/lead. El campo Empresa sugiere compañías existentes y las resuelve al enviar sin requerir click en la sugerencia (evita duplicar "UTP" / "Utp" / "Universidad Tecnológica del Perú" como empresas distintas). Rubro es una tabla dinámica, editable desde el formulario.
- **Prospección OSINT** — una Edge Function consulta resultados HTML de DuckDuckGo; un parser propio (sin dependencias) clasifica presencia digital, datos de empresa, contacto estimado y menciones públicas. La empresa se autorresuelve contra `companies` al lanzar la búsqueda.
- **Organigrama** *(módulo opcional, activable desde Marketplace)* — árbol visual de los contactos de una empresa, jerarquía "reporta a" y motivo de contacto. Click en un contacto abre su perfil en Perfiles si tiene un lead asociado.
- **Dashboard** — KPIs, embudo de conversión, gráficos (Chart.js) sobre datos reales. Colores de series derivados de las variables de marca.
- **Perfiles** — directorio de leads/contactos, filtros por rubro y etapa, vista lista/grilla. Detalle: timeline de interacciones, foto subible (Storage), correo (`mailto:`) y teléfono (WhatsApp) clicables, edición de datos, impresión.
- **Mi Perfil** — nombre, cargo, foto, correo editable (flujo de confirmación de Supabase Auth), Rol visible solo para administradores.
- **Configuración** *(solo administradores)* — colores de marca del tenant, precargados y editables en caliente para todo el equipo; botón para restaurar la paleta de fábrica.
- **Marketplace de módulos** *(solo administradores)* — activa/desactiva módulos opcionales para todo el equipo.
- **Notificaciones** — campanita in-app + notificaciones reales del navegador (Web Notifications API) vía Supabase Realtime.
- **Autenticación** — Supabase Auth (email/password), sesión persistida.
- **Modo oscuro**, **sidebar compactable**, dock estilo macOS en móvil.

## Stack

| | Tecnología | Uso |
|---|---|---|
| <img src="https://iconic-api.onrender.com/dark/react" width="28"/> | React 19 + TypeScript | Frontend |
| <img src="https://iconic-api.onrender.com/dark/vite" width="28"/> | Vite (rolldown-vite) | Build tool / dev server |
| <img src="https://iconic-api.onrender.com/dark/postgresql" width="28"/> | Postgres (Supabase) | Base de datos, Row Level Security |
| <img src="https://iconic-api.onrender.com/dark/deno" width="28"/> | Deno | Runtime de Edge Functions |
| <img src="https://iconic-api.onrender.com/dark/duckduckgo" width="28"/> | DuckDuckGo | Fuente de datos para OSINT |
| <img src="https://iconic-api.onrender.com/dark/vercel" width="28"/> | Vercel | Hosting, deploy automático en `main` |
| <img src="https://iconic-api.onrender.com/dark/git" width="28"/> | Git | Control de versiones |
| <img src="https://iconic-api.onrender.com/dark/github" width="28"/> | GitHub | Repositorio |
| <img src="https://iconic-api.onrender.com/dark/github-actions" width="28"/> | GitHub Actions | CI, corre tests en cada push |
| | Chart.js / react-chartjs-2 | Gráficos del Dashboard |
| | lucide-react | Iconografía de la UI |
| | Vitest | Tests unitarios e integración |
| | `@supabase/supabase-js` | Cliente: Auth, Storage, Realtime, Edge Functions |

## Backend (Supabase)

Tablas: `profiles`, `companies`, `contacts`, `sectors`, `pipeline_stages`, `leads`, `timeline_events`, `notifications`, `tenant_settings`, `installed_modules`. Todas con RLS habilitado.

- `profiles.role` (`admin` / `member`): controla acceso a Configuración/Marketplace y visibilidad del campo Rol. Distinto de `role_title` (cargo/puesto).
- `contacts.reports_to` (auto-referencia): jerarquía del Organigrama. `contacts.avatar_url`: foto subida desde Perfiles.
- `sectors`: lista de rubros, editable desde la UI.
- `tenant_settings`: fila única con los colores de marca; se aplican en el cliente sobrescribiendo las variables CSS de `tokens.css`.
- `installed_modules`: qué módulos opcionales están activos para el equipo (hoy: `orgchart`).
- Storage `avatars`: lectura pública, escritura para cualquier usuario autenticado.
- Edge Function `osint-search`: recibe nombre/empresa, consulta DuckDuckGo, devuelve señales clasificadas.

## Desarrollo

```bash
npm install
cp .env.example .env.local   # completar con las credenciales del proyecto Supabase
npm run dev
```

```bash
npm run test    # Vitest: parseo/clasificación OSINT (fixtures) + integración contra la Edge Function real
npm run build   # tsc -b && vite build
```

## Ramas y despliegue

- `main` es el único trunk. `dev` es la rama de trabajo.
- Cada push a `dev` corre GitHub Actions (`.github/workflows/osint-tests.yml`).
- Cierre de lote: merge `dev` → `main` (fast-forward), push de ambas, redeploy manual del preview de `dev` (`vercel --yes` + `vercel alias set`). Producción se despliega sola vía webhook de Vercel al pushear `main`.

## Configuración de marca

- Colores de fábrica en `src/styles/tokens.css`: naranja primario `#F27405`, naranja profundo `#D93D04`, oliva `#365902`, papel `#F5F3E8`. Tipografía display: **Anton**. Tipografía de cuerpo: **Kanit**.
- En runtime se sobrescriben con lo guardado en `tenant_settings` (módulo Configuración, solo admins) vía CSS custom properties.
- "La Segunda Mordida" es una configuración del producto, no código hardcodeado en los componentes.
