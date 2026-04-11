#!/bin/bash
set -e
export NODE_ENV=${NODE_ENV:-development}
echo "[start-server] Starting ShrimpGuard API on port ${API_PORT:-3001}..."
exec npx tsx server/index.ts
