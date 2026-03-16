# RedDePatitas - Frontend

Proyecto frontend para la plataforma Red de Patitas. Implementado con React + TypeScript y Tailwind CSS, generado desde diseños en Figma y preparado para ejecutarse con Vite.

## Tecnologías

- React 18
- TypeScript
- Vite
- Tailwind CSS
- PostCSS
- react-router-dom (rutas)
- react-hook-form + zod (formularios y validación)
- clsx / utilidad `cn` (clases condicionales)
- UI wrappers unificados en `src/components/ui` (basados en estilos shadcn)
- ESLint + Prettier (lint y formateo)

## Estructura relevante

- `src/` – código fuente React
- `src/components/` – componentes principales (`Registro`, `Principal`, `Login`, `Reportar`, `ui`)
- `src/components/ui` – UI wrappers unificados (estilos shadcn integrados)
- `public/assets/` – imágenes y assets descargados desde Figma
- `src/lib/api.ts` – mock simple (localStorage) para registrar/listar

## Rutas disponibles (desarrollo)

- `/` → `Principal` (vista principal)
- `/login` → `Login`
- `/registro` → `Registro`
- `/reportar` → `Reportar`

## Requisitos

- Node.js >= 18
- npm (o yarn/pnpm) instalado

## Instalación y ejecución local

1. Clona el repositorio (si aún no lo tienes):

```bash
git clone https://github.com/Proyecto-Integrador-2026-1/ReddePatitas-Frontend.git
cd ReddePatitas-Frontend
```

2. Instala dependencias:

```bash
npm install
```

3. Inicia el servidor de desarrollo (en mi entorno uso `--host` para acceso en LAN):

```bash
npm run dev -- --host 0.0.0.0
```

Abre `http://localhost:5173` (o el puerto que Vite indique en la terminal, por ejemplo `5178`).

4. Para producción/build:

```bash
npm run build
npm run preview
```
