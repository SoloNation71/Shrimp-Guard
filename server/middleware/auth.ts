import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || '';
const IS_DEV = process.env.NODE_ENV !== 'production';

export interface AuthPayload {
  sub: string;
  email: string;
  role: string;
  app_metadata?: { role?: string };
  user_metadata?: { name?: string; role?: string };
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

const DEV_FALLBACK_USER: AuthPayload = {
  sub: 'dev-user',
  email: 'owner@shrimpguard.com',
  role: 'authenticated',
  app_metadata: { role: 'owner' },
  user_metadata: { name: 'Dev User', role: 'owner' },
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
};

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  // Dev mode: no JWT secret configured → accept any bearer token
  if (!SUPABASE_JWT_SECRET && IS_DEV) {
    // Try to decode as JWT; fall back to dev user
    try {
      const decoded = jwt.decode(token) as AuthPayload | null;
      req.user = decoded ?? { ...DEV_FALLBACK_USER };
    } catch {
      req.user = { ...DEV_FALLBACK_USER };
    }
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, SUPABASE_JWT_SECRET) as AuthPayload;
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
    } else {
      res.status(401).json({ error: 'Invalid token' });
    }
  }
}

export function requireRole(role: 'owner' | 'viewer') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole =
      req.user?.app_metadata?.role ||
      req.user?.user_metadata?.role ||
      req.user?.role;

    if (role === 'owner' && userRole !== 'owner') {
      res.status(403).json({ error: 'Owner role required' });
      return;
    }
    next();
  };
}
