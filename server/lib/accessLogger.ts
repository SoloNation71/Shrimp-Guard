import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { insertAccessLog } from './telemetryDb.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.resolve(__dirname, '../../api_access.log');

export function accessLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const ip =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0].trim() ??
      req.socket.remoteAddress ??
      '-';
    const timestamp = new Date().toISOString();
    const line = `${timestamp} ${req.method} ${req.path} ${res.statusCode} ${duration}ms ${ip}\n`;

    // Write to file (non-blocking)
    fs.appendFile(LOG_FILE, line, () => {/* ignore errors */});

    // Skip static/non-API noise
    if (req.path.startsWith('/api') || req.path === '/') {
      try {
        insertAccessLog({
          timestamp,
          method: req.method,
          endpoint: req.path,
          status_code: res.statusCode,
          client_ip: ip,
          duration_ms: duration,
        });
      } catch {
        // DB errors must not crash the request
      }
    }
  });

  next();
}
