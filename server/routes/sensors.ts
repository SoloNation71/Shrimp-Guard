import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { queryLatest, queryHistory, SensorRow } from '../lib/influxdb.js';
import { getMockLatestReading, getMockHistory } from './mock-helpers.js';

const router = Router();

const USE_MOCK = !process.env.INFLUXDB_URL || !process.env.INFLUXDB_TOKEN;

function parsePondId(req: Request, res: Response): number | null {
  const pondId = Number(req.query['pond_id']);
  if (!pondId || !Number.isInteger(pondId) || pondId < 1 || pondId > 100) {
    res.status(400).json({ error: 'Invalid pond_id — must be a positive integer' });
    return null;
  }
  return pondId;
}

router.get('/latest', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  const pondId = parsePondId(req, res);
  if (!pondId) return;

  try {
    let data: SensorRow | null;

    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 200 + Math.random() * 200));
      data = getMockLatestReading(pondId);
    } else {
      data = await queryLatest(pondId);
    }

    if (!data) {
      res.status(404).json({ error: 'No recent readings found for this pond' });
      return;
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/history', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  const pondId = parsePondId(req, res);
  if (!pondId) return;

  const hours = Math.min(Number(req.query['hours'] ?? 24), 168);
  if (isNaN(hours) || hours < 1) {
    res.status(400).json({ error: 'Invalid hours parameter — must be 1–168' });
    return;
  }

  try {
    let data: SensorRow[];

    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 300 + Math.random() * 300));
      data = getMockHistory(pondId, hours);
    } else {
      data = await queryHistory(pondId, hours);
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
