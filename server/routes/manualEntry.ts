import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { manualEntryLimiter } from '../middleware/rateLimiter.js';
import { writeManualEntry } from '../lib/influxdb.js';

const router = Router();

const ALLOWED_FIELDS = [
  'temperature',
  'ph',
  'dissolved_oxygen',
  'ammonia',
  'salinity',
  'turbidity',
] as const;

type SensorField = (typeof ALLOWED_FIELDS)[number];

router.post(
  '/',
  manualEntryLimiter,
  requireAuth,
  requireRole('owner'),
  async (req: Request, res: Response, next: NextFunction) => {
    const { pond_id, timestamp, notes, ...rawFields } = req.body ?? {};

    const pondId = Number(pond_id);
    if (!pondId || !Number.isInteger(pondId) || pondId < 1) {
      res.status(400).json({ error: 'Invalid pond_id' });
      return;
    }

    const fields: Partial<Record<SensorField, number>> = {};
    for (const field of ALLOWED_FIELDS) {
      if (rawFields[field] !== undefined && rawFields[field] !== '') {
        const val = Number(rawFields[field]);
        if (isNaN(val)) {
          res.status(400).json({ error: `Invalid value for field: ${field}` });
          return;
        }
        fields[field] = val;
      }
    }

    if (Object.keys(fields).length === 0) {
      res.status(400).json({ error: 'At least one sensor field is required' });
      return;
    }

    const USE_MOCK = !process.env.INFLUXDB_URL || !process.env.INFLUXDB_TOKEN;

    try {
      if (!USE_MOCK) {
        await writeManualEntry(
          pondId,
          fields,
          timestamp ? String(timestamp) : undefined
        );
      } else {
        await new Promise((r) => setTimeout(r, 300));
        console.log('[manual-entry] Mock write:', { pond_id: pondId, fields, notes });
      }

      res.status(201).json({
        success: true,
        pond_id: pondId,
        fields,
        timestamp: timestamp ?? new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
