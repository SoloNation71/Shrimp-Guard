import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { streamTokenLimiter } from '../middleware/rateLimiter.js';
import { getStreamToken, listStreams } from '../lib/go2rtc.js';

const router = Router();

router.post(
  '/token',
  streamTokenLimiter,
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    const pondId = Number(req.body?.pond_id);
    if (!pondId || !Number.isInteger(pondId) || pondId < 1) {
      res.status(400).json({ error: 'Invalid pond_id' });
      return;
    }

    try {
      const token = await getStreamToken(pondId);
      res.json(token);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/list',
  requireAuth,
  requireRole('owner'),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const streams = await listStreams();
      res.json({ streams });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
