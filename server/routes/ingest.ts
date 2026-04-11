import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { validateKey, touchDevice } from '../lib/deviceStore.js';
import { writeManualEntry } from '../lib/influxdb.js';

const router = Router();

const ingestLimiter = rateLimit({
  windowMs: 60_000,
  max: 240,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  keyGenerator: (req) => {
    const key = req.headers['x-device-key'];
    return typeof key === 'string' && key ? key : 'anonymous';
  },
  message: { error: 'Device rate limit exceeded — slow down transmission interval' },
});

const SENSOR_FIELDS = [
  'temperature',
  'ph',
  'dissolved_oxygen',
  'ammonia',
  'salinity',
  'turbidity',
] as const;

type SensorField = (typeof SENSOR_FIELDS)[number];

router.post(
  '/',
  ingestLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    // Device key auth via X-Device-Key header
    const deviceKey = req.headers['x-device-key'];
    if (!deviceKey || typeof deviceKey !== 'string') {
      res.status(401).json({ error: 'Missing X-Device-Key header' });
      return;
    }

    const device = validateKey(deviceKey);
    if (!device) {
      res.status(401).json({ error: 'Invalid device key' });
      return;
    }

    const body = req.body ?? {};
    const pondId = Number(body.pond_id ?? device.pond_id);

    if (!pondId || !Number.isInteger(pondId) || pondId < 1) {
      res.status(400).json({ error: 'Invalid pond_id' });
      return;
    }

    // Extract and validate sensor fields
    const fields: Partial<Record<SensorField, number>> = {};
    for (const field of SENSOR_FIELDS) {
      if (body[field] !== undefined && body[field] !== null && body[field] !== '') {
        const val = Number(body[field]);
        if (!isNaN(val)) fields[field] = val;
      }
    }

    if (Object.keys(fields).length === 0) {
      res.status(400).json({ error: 'At least one sensor field is required' });
      return;
    }

    try {
      const USE_MOCK = !process.env.INFLUXDB_URL || !process.env.INFLUXDB_TOKEN;

      if (!USE_MOCK) {
        await writeManualEntry(pondId, fields, body.timestamp);
      } else {
        console.log(
          `[ingest] device="${device.name}" pond=${pondId}`,
          fields
        );
      }

      touchDevice(device.id, { pond_id: pondId, ...fields });

      res.status(201).json({
        ok: true,
        device: device.name,
        pond_id: pondId,
        fields_received: Object.keys(fields),
        timestamp: body.timestamp ?? new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
