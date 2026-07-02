# microCLM

CRM de pipeline comercial migrado de HTML/CSS/JS vanilla a **React + TypeScript + Vite**, con la identidad visual de **La Segunda Mordida (LSM)**, un lenguaje de diseño minimalista de inspiración japonesa, y backend real sobre **Supabase**.

## Módulos

- **Tablero Kanban** — pipeline de ventas en 8 etapas con drag & drop, persistido en Postgres.
- **Captación de Leads** — formulario que crea empresa/contacto/lead reales en la base de datos.
- **Prospección OSINT** — enriquecimiento simulado a partir de fuentes públicas (demo, sin conexión a APIs externas).
- **Dashboard Gerencial** — KPIs, embudo de conversión y gráficos (Chart.js) calculados sobre datos reales.
- **Perfil del Cliente** — datos del cliente y timeline de interacciones con acciones rápidas que escriben en la base de datos.
- **Autenticación** — login con Supabase Auth (email/password), sesión persistida.
- **Modo oscuro** — tema claro/oscuro con persistencia en `localStorage`.

## Stack

- React 19 + TypeScript + Vite
- Supabase (Postgres + Auth + RLS) como backend — sin servidor propio: el cliente habla directo con Supabase vía `@supabase/supabase-js`, protegido por Row Level Security.
- Chart.js / react-chartjs-2
- lucide-react (iconografía)
- Despliegue: Vercel (frontend, con integración de Git para deploys automáticos en cada push a `main`)

## Backend (Supabase)

Tablas: `profiles`, `companies`, `contacts`, `pipeline_stages`, `leads`, `timeline_events`, `notifications`. Todas con RLS habilitado; los usuarios autenticados tienen acceso CRUD completo (app interna de un solo equipo comercial).

## Desarrollo

```bash
npm install
cp .env.example .env.local   # completar con las credenciales del proyecto Supabase
npm run dev
```

## Identidad de marca

Paleta y tipografía tomadas del brandbook de La Segunda Mordida (LSM):

- Naranja primario `#F27405`, naranja profundo `#D93D04`, oliva `#365902`, papel `#F5F3E8`.
- Tipografía display: **Anton**. Tipografía de cuerpo: **Kanit**.
