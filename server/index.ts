import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import sensorsRouter from './routes/sensors.js';
import streamsRouter from './routes/streams.js';
import manualEntryRouter from './routes/manualEntry.js';
import ingestRouter from './routes/ingest.js';
import devicesRouter from './routes/devices.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';

// In production: port 5000 (behind the load balancer). Dev: API_PORT (3001)
const PORT = Number(process.env.PORT ?? (isProd ? 5000 : (process.env.API_PORT ?? 3001)));
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5000';

const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  })
);

app.use(
  cors({
    origin: isProd ? CLIENT_ORIGIN : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Key'],
  })
);

app.use(express.json({ limit: '100kb' }));
app.use(apiLimiter);

// ─── API routes ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    influxdb: !!(process.env.INFLUXDB_URL && process.env.INFLUXDB_TOKEN),
    go2rtc: !!process.env.GO2RTC_BASE_URL,
    supabase: !!process.env.SUPABASE_JWT_SECRET,
    mock_mode: !(process.env.INFLUXDB_URL && process.env.INFLUXDB_TOKEN),
  });
});

app.use('/api/sensors', sensorsRouter);
app.use('/api/stream', streamsRouter);
app.use('/api/manual-entry', manualEntryRouter);
app.use('/api/ingest', ingestRouter);
app.use('/api/devices', devicesRouter);

// ─── API 404 (always runs before any static/SPA handler) ─────────────────────
app.use('/api', notFound);

// ─── Static frontend (production only) ───────────────────────────────────────
if (isProd) {
  const distDir = path.resolve(__dirname, '../dist');
  app.use(express.static(distDir));
  // SPA fallback — all non-API routes serve index.html for client-side routing
  app.use((_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  const mode = isProd ? '(PRODUCTION)' : !(process.env.INFLUXDB_URL && process.env.INFLUXDB_TOKEN)
    ? '(MOCK MODE)'
    : '(LIVE)';
  console.log(`[server] ShrimpGuard API running on port ${PORT} ${mode}`);
});

export default app;
