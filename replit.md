# ShrimpGuard — Aquaculture Monitoring Dashboard

## Project Overview
A real-time shrimp aquaculture IoT monitoring dashboard built with React, TypeScript, Vite, and Tailwind CSS. Features sensor data visualization, camera feeds, alerts management, and manual data entry.

## Architecture
- **Frontend only**: Pure React SPA (no backend server required currently)
- **Auth**: Mock auth system with two demo users (stored in AuthContext)
- **Data**: Mock data from `src/api/` — designed to be replaced with real InfluxDB/Supabase integrations
- **Routing**: React Router v6 with protected routes

## Key Files
- `src/App.tsx` — Root component with routing and auth protection
- `src/context/AuthContext.tsx` — Auth provider with mock users
- `src/pages/` — Page components (Dashboard, Cameras, Alerts, ManualEntry, Settings)
- `src/components/` — Shared UI components including layout and sensor cards
- `src/api/` — Mock data and sensor utilities
- `vite.config.ts` — Vite dev server config (port 5000, host 0.0.0.0 for Replit)

## Running the App
- **Dev**: `npm run dev` (starts on port 5000)
- **Build**: `npm run build` (outputs to `dist/`)

## Demo Credentials
- Owner: `owner@shrimpguard.com` / `demo1234`
- Viewer: `viewer@shrimpguard.com` / `demo1234`

## Environment Variables (Optional — for future integrations)
See `.env.example` for Supabase, InfluxDB, and Go2RTC configuration.
These are not required for the current demo-mode app.

## Replit Migration Notes
- Removed `lovable-tagger` from Vite config (Lovable-specific dev tool)
- Set Vite server host to `0.0.0.0` and port to `5000` for Replit compatibility
- `allowedHosts: true` set to support Replit's proxy/iframe environment
- Deployment configured as static site (build → `dist/`)
