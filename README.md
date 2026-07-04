# microCLM

CLM (Client Lifecycle Management) de pipeline comercial.

- Frontend: React + TypeScript + Vite.
- Backend: Supabase (Postgres + Auth + Storage + Edge Functions), sin servidor propio.
- Producto genérico y white-label: marca (colores, nombre del tenant) es configuración, no código. Ver [Configuración de marca](#configuración-de-marca).
- Tenant actual: **La Segunda Mordida (LSM)**, diseño minimalista de inspiración japonesa.

## Módulos

| Módulo | Descripción | Acceso |
|---|---|---|
| Tablero Kanban | Pipeline de ventas en 8 etapas, drag & drop, columnas colapsables, persistido en Postgres. | Todos |
| Captación de Leads | Crea empresa/contacto/lead. Empresa sugiere compañías existentes y las resuelve al enviar sin requerir click en la sugerencia (evita duplicar "UTP" / "Utp" / "Universidad Tecnológica del Perú" como empresas distintas). Rubro es una tabla dinámica, editable desde el formulario. | Todos |
| Prospección OSINT | Una Edge Function consulta resultados HTML de DuckDuckGo; un parser propio (sin dependencias) clasifica presencia digital, datos de empresa, contacto estimado y menciones públicas. La empresa se autorresuelve contra `companies` al lanzar la búsqueda. | Todos |
| Organigrama | Árbol visual de los contactos de una empresa, jerarquía "reporta a" y motivo de contacto. Click en un contacto abre su perfil en Perfiles si tiene un lead asociado. | Todos (módulo opcional, activable desde Marketplace) |
| Dashboard | KPIs, embudo de conversión, gráficos (Chart.js) sobre datos reales. Colores de series derivados de las variables de marca. | Todos |
| Perfiles | Directorio de leads/contactos, filtros por rubro y etapa, vista lista/grilla. Detalle: timeline de interacciones, foto subible (Storage), correo (`mailto:`) y teléfono (WhatsApp) clicables, edición de datos, impresión. | Todos |
| Correo | Envío de correos reales desde el perfil de un lead (Resend), con tracking de apertura (pixel) y de clics (redirect instrumentado), reflejado como estado en el timeline. | Todos |
| Catálogo | CRUD de productos/servicios (nombre, descripción, categoría, precio, estado). Es la fuente de verdad que usa el módulo de Lead Sintético para recomendar. | Todos |
| Lead Sintético | Toma un lead real (contacto, empresa, rubro, etapa, historial de timeline) y el Catálogo, y le pide a Gemini un análisis estructurado: persona/preferencias, producto recomendado (con motivo), probabilidad de cierre y métricas (interés, encaje de rubro, encaje de presupuesto, urgencia). El id del producto recomendado siempre se valida contra el Catálogo real. | Todos (módulo opcional, activable desde Marketplace) |
| Mi Perfil | Nombre, cargo, foto, correo editable (flujo de confirmación de Supabase Auth), Rol visible solo para administradores. | Todos |
| Configuración | Colores de marca del tenant, precargados y editables en caliente para todo el equipo; botón para restaurar la paleta de fábrica. | Administradores |
| Marketplace de módulos | Activa/desactiva módulos opcionales para todo el equipo. | Administradores |
| Notificaciones | Campanita in-app + notificaciones reales del navegador (Web Notifications API) vía Supabase Realtime. | Todos |
| Autenticación | Supabase Auth (email/password), sesión persistida. | Todos |
| Modo oscuro / sidebar compactable | Dock estilo macOS en móvil. | Todos |

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

Tablas: `profiles`, `companies`, `contacts`, `sectors`, `pipeline_stages`, `leads`, `timeline_events`, `emails`, `products`, `lead_synthetic_insights`, `notifications`, `tenant_settings`, `installed_modules`. Todas con RLS habilitado.

- `profiles.role` (`admin` / `member`): controla acceso a Configuración/Marketplace y visibilidad del campo Rol. Distinto de `role_title` (cargo/puesto).
- `contacts.reports_to` (auto-referencia): jerarquía del Organigrama. `contacts.avatar_url`: foto subida desde Perfiles.
- `sectors`: lista de rubros, editable desde la UI.
- `tenant_settings`: fila única con los colores de marca; se aplican en el cliente sobrescribiendo las variables CSS de `tokens.css`.
- `installed_modules`: qué módulos opcionales están activos para el equipo (hoy: `orgchart`, `synthetic_lead`).
- `emails` / `timeline_events.email_id`: registro de cada correo enviado (destinatario, asunto, cuerpo, estado, `opened_at`, `clicked_at`), vinculado al evento del timeline que lo originó.
- `products`: catálogo de productos/servicios (nombre, descripción, categoría, precio, estado).
- `lead_synthetic_insights`: historial de análisis de IA por lead (persona, preferencias, producto recomendado, probabilidad de éxito, score, métricas, respuesta cruda de Gemini para auditoría).
- Storage `avatars`: lectura pública, escritura para cualquier usuario autenticado.
- Edge Function `osint-search`: recibe nombre/empresa, consulta DuckDuckGo, devuelve señales clasificadas.
- Edge Function `send-email`: envía el correo vía Resend, instrumentando el HTML con pixel de apertura y links reescritos para trackear clics. Requiere el secret `RESEND_API_KEY`.
- Edge Functions `track-email-open` / `track-email-click`: endpoints públicos (`verify_jwt: false`) que registran `opened_at`/`clicked_at` y devuelven el pixel o redirigen al link real.
- Edge Function `generate-lead-insight`: arma el contexto real del lead (timeline, empresa, rubro) + el Catálogo activo, y llama a la API de Gemini (`gemini-2.0-flash`, salida forzada a JSON por schema) para generar el análisis. Valida que el producto recomendado exista en el Catálogo real antes de guardarlo. Requiere el secret `GEMINI_API_KEY`.

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
