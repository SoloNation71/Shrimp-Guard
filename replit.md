# ShrimpGuard — Aquaculture IoT Monitoring Dashboard

## Overview
Full-stack production-ready monitoring app for shrimp aquaponics operations. Real-time sensor data, camera feeds via RTSP→WebRTC proxy, alerts, and manual entry with offline queuing.

## Architecture
```
Frontend (Vite/React, port 5000)
  → /api/* proxy → Express Backend (port 3001)
                      → InfluxDB Cloud 2 (time-series sensor data)
                      → Go2RTC (RTSP→WebRTC/HLS for Annke cameras)
                      → Supabase (JWT auth validation)
```

## Workflows
- **Start application** — `npm run dev` (Vite dev server, port 5000, webview)
- **Start Backend** — `npx tsx server/index.ts` (Express API, port 3001, console)

Both run concurrently. The Vite server proxies all `/api/*` requests to the Express server.

## Key Files

### Backend (`/server`)
- `server/index.ts` — Express app: CORS, Helmet, rate limiting, route registration
- `server/middleware/auth.ts` — Supabase JWT validation (`requireAuth`, `requireRole`)
- `server/middleware/rateLimiter.ts` — Per-route rate limits
- `server/middleware/errorHandler.ts` — Global error handler + 404
- `server/routes/sensors.ts` — `GET /api/sensors/latest` & `/history` (InfluxDB proxy)
- `server/routes/streams.ts` — `POST /api/stream/token` (Go2RTC short-lived tokens)
- `server/routes/manualEntry.ts` — `POST /api/manual-entry` (InfluxDB write, owner-only)
- `server/lib/influxdb.ts` — InfluxDB Cloud 2 client, query & write functions
- `server/lib/go2rtc.ts` — Go2RTC API wrapper (stream verification + token generation)
- `server/routes/mock-helpers.ts` — Mock data when InfluxDB is not configured

### Frontend (`/src`)
- `src/api/sensors.ts` — Sensor fetch functions (calls `/api/sensors/*`)
- `src/api/streams.ts` — Stream token fetch (`POST /api/stream/token`)
- `src/api/manualEntry.ts` — Manual entry submit
- `src/api/mock-data.ts` — Pond/alert mock data used for pond list
- `src/lib/apiClient.ts` — Shared fetch wrapper with auth headers + retry logic
- `src/context/AuthContext.tsx` — Auth state; Supabase sign-in when env vars set, mock fallback
- `src/hooks/useSensorData.ts` — TanStack Query hooks (30s polling)
- `src/components/AnnkePlayer.tsx` — HLS/WebRTC camera player with token refresh
- `src/components/ManualEntryForm.tsx` — Form with offline queue (localStorage)

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | None | Health + mode check |
| GET | `/api/sensors/latest?pond_id=N` | Bearer | Latest sensor reading |
| GET | `/api/sensors/history?pond_id=N&hours=N` | Bearer | Historical readings (max 168h) |
| POST | `/api/stream/token` | Bearer | 5-min tokenized Go2RTC stream URL |
| GET | `/api/stream/list` | Bearer + owner | List active Go2RTC streams |
| POST | `/api/manual-entry` | Bearer + owner | Write manual reading to InfluxDB |

## Mock Mode
The backend runs in **mock mode** automatically when `INFLUXDB_URL`/`INFLUXDB_TOKEN` are not set. All sensor endpoints return realistic generated data. Auth accepts any Bearer token in dev mode when `SUPABASE_JWT_SECRET` is unset.

## Environment Variables
See `.env.example` for full list. Key variables:
- `INFLUXDB_URL`, `INFLUXDB_TOKEN`, `INFLUXDB_ORG`, `INFLUXDB_BUCKET`
- `SUPABASE_JWT_SECRET` (server-side only)
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (frontend)
- `GO2RTC_BASE_URL`, `GO2RTC_API_KEY`
- `API_PORT` (default: 3001)

## Demo Credentials (Mock Mode)
- Owner: `owner@shrimpguard.com` / `demo1234`
- Viewer: `viewer@shrimpguard.com` / `demo1234`

## Go2RTC Setup (Production)
Configure `go2rtc.yaml` with Annke camera RTSP URLs:
```yaml
streams:
  pond_1: rtsp://admin:password@192.168.1.100:554/stream1
  pond_2: rtsp://admin:password@192.168.1.101:554/stream1
  pond_3: rtsp://admin:password@192.168.1.102:554/stream1
  pond_4: rtsp://admin:password@192.168.1.103:554/stream1
```
Run Go2RTC as a sidecar. Set `GO2RTC_BASE_URL=http://localhost:1984` in `.env`.

## InfluxDB Schema
Measurement: `sensor_reading`
- Tags: `pond_id` (string)
- Fields: `temperature`, `ph`, `dissolved_oxygen`, `ammonia`, `salinity`, `turbidity`

## Offline Support
Manual entries are queued to `localStorage` when offline and can be flushed via the "Sync now" button. Camera tokens auto-refresh 30s before expiry.
