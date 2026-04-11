import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { listDevices, createDevice, deleteDevice } from '../lib/deviceStore.js';

const router = Router();

// All device management requires owner auth
router.use(requireAuth);
router.use(requireRole('owner'));

router.get('/', (_req: Request, res: Response) => {
  res.json(listDevices());
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  const { name, type, pond_id } = req.body ?? {};

  if (!name?.trim()) {
    res.status(400).json({ error: 'Device name is required' });
    return;
  }
  if (!['arduino', 'raspberry_pi'].includes(type)) {
    res.status(400).json({ error: 'type must be "arduino" or "raspberry_pi"' });
    return;
  }
  const pondId = Number(pond_id);
  if (!pondId || !Number.isInteger(pondId) || pondId < 1) {
    res.status(400).json({ error: 'Invalid pond_id' });
    return;
  }

  try {
    const device = createDevice(name.trim(), type, pondId);
    // Return the full key once — it won't be shown again
    res.status(201).json(device);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  const deleted = deleteDevice(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Device not found' });
    return;
  }
  res.json({ ok: true });
});

export default router;
