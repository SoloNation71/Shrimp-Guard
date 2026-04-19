import { Router, Request, Response, NextFunction } from 'express';
import { validateKey } from '../lib/deviceStore.js';
import { insertSensorReading } from '../lib/telemetryDb.js';
import { emitSensorUpdate } from '../lib/socketServer.js';
import rateLimit from 'express-rate-limit';

const router = Router();

const telemetryLimiter = rateLimit({
  windowMs: 60_000,
  max: 240,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  keyGenerator: (req) => {
    const key = req.headers['x-api-key'] ?? req.headers['x-device-key'];
    return typeof key === 'string' && key ? key : 'anonymous';
  },
  message: { error: 'Device rate limit exceeded — slow down transmission interval' },
});

function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const apiKey =
    (req.headers['x-api-key'] as string | undefined) ??
    (req.headers['x-device-key'] as string | undefined);

  if (!apiKey) {
    res.status(401).json({ error: 'Missing X-API-Key header' });
    return;
  }
  const device = validateKey(apiKey);
  if (!device) {
    res.status(401).json({ error: 'Invalid API key' });
    return;
  }
  (req as Request & { device: typeof device }).device = device;
  next();
}

router.post(
  '/',
  telemetryLimiter,
  requireApiKey,
  async (req: Request, res: Response, next: NextFunction) => {
    const body = req.body ?? {};
    const { tank_id, timestamp, water_quality = {}, filter: filterData = {}, system: systemData = {} } = body;

    if (!tank_id || typeof tank_id !== 'string') {
      res.status(400).json({ error: 'tank_id is required and must be a string' });
      return;
    }

    const ts = timestamp ?? new Date().toISOString();

    // ── Validation ──────────────────────────────────────────────
    const errors: string[] = [];

    const ph = water_quality.ph !== undefined ? Number(water_quality.ph) : undefined;
    const do_mg_l = water_quality.do_mg_l !== undefined ? Number(water_quality.do_mg_l) : undefined;
    const temp_c = water_quality.temp_c !== undefined ? Number(water_quality.temp_c) : undefined;
    const salinity_ppt = water_quality.salinity_ppt !== undefined ? Number(water_quality.salinity_ppt) : undefined;

    if (ph !== undefined) {
      if (isNaN(ph) || ph < 0 || ph > 14) errors.push('ph must be between 0 and 14');
    }
    if (do_mg_l !== undefined) {
      if (isNaN(do_mg_l) || do_mg_l <= 0) errors.push('do_mg_l must be a positive number');
    }
    if (temp_c !== undefined) {
      if (isNaN(temp_c) || temp_c < -10 || temp_c > 50) errors.push('temp_c must be between -10 and 50°C');
    }

    if (errors.length > 0) {
      res.status(400).json({ error: errors.join('; ') });
      return;
    }

    try {
      const row = {
        tank_id,
        timestamp: ts,
        ph: ph ?? null,
        do_mg_l: do_mg_l ?? null,
        temp_c: temp_c ?? null,
        salinity_ppt: salinity_ppt !== undefined ? salinity_ppt : null,
        filter_dp_kpa: filterData.dp_kpa !== undefined ? Number(filterData.dp_kpa) : null,
        filter_status: filterData.status ?? null,
        demo_mode: !!systemData.demo_mode,
        firmware_version: systemData.firmware_version ?? null,
      };

      const id = insertSensorReading(row);

      const payload = { id, tank_id, timestamp: ts, ...row };
      emitSensorUpdate(tank_id, payload);

      console.log(`[telemetry] tank="${tank_id}" id=${id}`);

      res.status(201).json({ status: 'received', id });
    } catch (err) {
      next(err);
    }
  }
);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  const { getRecentReadings } = await import('../lib/telemetryDb.js');
  try {
    const tank_id = typeof req.query.tank_id === 'string' ? req.query.tank_id : undefined;
    const limit = Math.min(Number(req.query.limit ?? 50), 200);
    res.json(getRecentReadings(tank_id, limit));
  } catch (err) {
    next(err);
  }
});

export default router;
