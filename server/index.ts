import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import sensorsRouter from './routes/sensors.js';
import streamsRouter from './routes/streams.js';
import manualEntryRouter from './routes/manualEntry.js';

const PORT = Number(process.env.API_PORT ?? 3001);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5000';
const isDev = process.env.NODE_ENV !== 'production';

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
    origin: isDev ? true : CLIENT_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '100kb' }));
app.use(apiLimiter);

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

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  const mode = !(process.env.INFLUXDB_URL && process.env.INFLUXDB_TOKEN)
    ? '(MOCK MODE)'
    : '(LIVE)';
  console.log(`[server] ShrimpGuard API running on port ${PORT} ${mode}`);
});

export default app;
