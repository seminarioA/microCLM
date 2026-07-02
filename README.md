# microCLM

microCLM es un CLM/CRM de pipeline comercial genérico: **React + TypeScript + Vite** en el frontend y **Supabase** (Postgres + Auth + Storage + Edge Functions) como backend, sin servidor propio. La marca — colores, nombre del tenant — es configuración, no código: hoy lo está implementando **La Segunda Mordida (LSM)**, con un lenguaje de diseño minimalista de inspiración japonesa, pero cualquier equipo puede adoptarlo cambiando su configuración de marca (ver [Configuración](#configuración-de-marca)).

## Módulos

- **Tablero Kanban** — pipeline de ventas en 8 etapas con drag & drop y columnas colapsables, persistido en Postgres.
- **Captación de Leads** — formulario que crea empresa/contacto/lead reales; el campo Empresa sugiere compañías ya existentes y, aunque no hagas click en una sugerencia, la resuelve sola al enviar (evita duplicar "UTP" / "Utp" / "Universidad Tecnológica del Perú" como empresas distintas). Rubro es una tabla dinámica: se pueden crear nuevos desde el propio formulario.
- **Prospección OSINT** — enriquecimiento **real** de prospectos: una Edge Function de Supabase consulta los resultados HTML de DuckDuckGo y un parser propio (sin dependencias) clasifica presencia digital, datos de empresa, contacto estimado y menciones públicas. La empresa también se autorresuelve contra `companies` al lanzar la búsqueda.
- **Organigrama** — mapa visual (árbol con líneas conectoras) de los contactos de una empresa, con jerarquía "reporta a" y motivo de contacto. Click en un contacto abre su perfil en Perfiles (si ya tiene un lead asociado).
- **Dashboard Gerencial** — KPIs, embudo de conversión y gráficos (Chart.js) sobre datos reales; los colores de las series se derivan de las variables de marca, no están hardcodeados.
- **Perfiles** — directorio navegable de leads/contactos con filtros por rubro y etapa; el detalle de cada perfil tiene timeline de interacciones, foto subible manualmente (Storage), correo (`mailto:`) y teléfono (WhatsApp) clicables, edición de datos e impresión (`@media print` oculta el resto de la app).
- **Mi Perfil** — cuenta del usuario: nombre, cargo, foto (Storage), correo editable (pasa por el flujo de confirmación de Supabase Auth) y Rol visible solo para administradores.
- **Configuración** *(solo administradores)* — colores de marca del tenant, precargados con la configuración actual y editables en caliente para todo el equipo (tabla `tenant_settings`).
- **Autenticación** — login con Supabase Auth (email/password), sesión persistida.
- **Modo oscuro** y **sidebar compactable** — con dock estilo macOS en móvil.

## Stack

- React 19 + TypeScript + Vite (rolldown-vite)
- Supabase: Postgres + Auth + Row Level Security + Storage (`avatars`) + Edge Functions (Deno) — el cliente habla directo con Supabase vía `@supabase/supabase-js`
- Chart.js / react-chartjs-2
- lucide-react (iconografía)
- Vitest para tests unitarios/integración; GitHub Actions corre la suite en cada push
- Despliegue: Vercel — producción se auto-despliega en cada push a `main`; `dev` se despliega manualmente a un alias fijo (`microclm-dev.vercel.app`) para pruebas

## Backend (Supabase)

Tablas principales: `profiles`, `companies`, `contacts`, `sectors`, `pipeline_stages`, `leads`, `timeline_events`, `notifications`, `tenant_settings`. Todas con RLS habilitado.

- `profiles.role` (`admin` / `member`) controla acceso a Configuración y visibilidad del campo Rol — es distinto de `role_title` (el cargo/puesto de la persona).
- `contacts.reports_to` (auto-referencia) arma la jerarquía del Organigrama; `contacts.avatar_url` guarda la foto subida manualmente desde Perfiles.
- `sectors` es la lista de rubros, editable desde la UI en vez de un enum fijo.
- `tenant_settings` es una fila única con los colores de marca; se aplican en el cliente sobrescribiendo las variables CSS de `tokens.css`.
- Bucket de Storage `avatars`: lectura pública, escritura para cualquier usuario autenticado (fotos de perfil de usuario y de contactos).
- Edge Function `osint-search`: recibe nombre/empresa, consulta DuckDuckGo y devuelve las señales clasificadas.

## Desarrollo

```bash
npm install
cp .env.example .env.local   # completar con las credenciales del proyecto Supabase
npm run dev
```

```bash
npm run test    # Vitest — parseo/clasificación OSINT (fixtures) + integración contra la Edge Function real
npm run build   # tsc -b && vite build
```

## Ramas y despliegue

- `main` es el único trunk (histórico: existió una rama `master`, se eliminó). `dev` es la rama de trabajo.
- Cada push a `dev` corre la suite de GitHub Actions (`.github/workflows/osint-tests.yml`).
- Al cerrar un lote de cambios: merge `dev` → `main` (fast-forward), push de ambas, y redeploy manual del preview de `dev` (`vercel --yes` + `vercel alias set`). Producción se despliega sola vía el webhook de Vercel al pushear `main`.

## Configuración de marca

Los colores viven en `src/styles/tokens.css` como valores de fábrica, pero en runtime se sobrescriben con lo guardado en `tenant_settings` (módulo Configuración, solo admins) vía variables CSS custom properties — así "La Segunda Mordida" es una configuración del producto, no algo hardcodeado en los componentes. Paleta de fábrica: naranja primario `#F27405`, naranja profundo `#D93D04`, oliva `#365902`, papel `#F5F3E8`. Tipografía display: **Anton**. Tipografía de cuerpo: **Kanit**.
