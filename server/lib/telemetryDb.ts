import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../data');
const DB_PATH = path.resolve(DATA_DIR, 'sensor_data.db');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS sensor_readings (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    tank_id    TEXT    NOT NULL,
    timestamp  TEXT    NOT NULL,
    ph         REAL,
    do_mg_l    REAL,
    temp_c     REAL,
    salinity_ppt REAL,
    filter_dp_kpa REAL,
    filter_status TEXT,
    demo_mode  INTEGER DEFAULT 0,
    firmware_version TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );

  CREATE TABLE IF NOT EXISTS access_log (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp  TEXT NOT NULL,
    method     TEXT NOT NULL,
    endpoint   TEXT NOT NULL,
    status_code INTEGER,
    client_ip  TEXT,
    duration_ms INTEGER
  );
`);

export interface TelemetryRow {
  id?: number;
  tank_id: string;
  timestamp: string;
  ph?: number | null;
  do_mg_l?: number | null;
  temp_c?: number | null;
  salinity_ppt?: number | null;
  filter_dp_kpa?: number | null;
  filter_status?: string | null;
  demo_mode?: boolean;
  firmware_version?: string | null;
  created_at?: string;
}

export interface AccessLogRow {
  id?: number;
  timestamp: string;
  method: string;
  endpoint: string;
  status_code?: number;
  client_ip?: string;
  duration_ms?: number;
}

const stmtInsertReading = db.prepare<Omit<TelemetryRow, 'id' | 'created_at'>>(`
  INSERT INTO sensor_readings
    (tank_id, timestamp, ph, do_mg_l, temp_c, salinity_ppt,
     filter_dp_kpa, filter_status, demo_mode, firmware_version)
  VALUES
    (@tank_id, @timestamp, @ph, @do_mg_l, @temp_c, @salinity_ppt,
     @filter_dp_kpa, @filter_status, @demo_mode, @firmware_version)
`);

const stmtInsertLog = db.prepare<Omit<AccessLogRow, 'id'>>(`
  INSERT INTO access_log (timestamp, method, endpoint, status_code, client_ip, duration_ms)
  VALUES (@timestamp, @method, @endpoint, @status_code, @client_ip, @duration_ms)
`);

export function insertSensorReading(row: Omit<TelemetryRow, 'id' | 'created_at'>): number {
  const result = stmtInsertReading.run({
    tank_id: row.tank_id,
    timestamp: row.timestamp,
    ph: row.ph ?? null,
    do_mg_l: row.do_mg_l ?? null,
    temp_c: row.temp_c ?? null,
    salinity_ppt: row.salinity_ppt ?? null,
    filter_dp_kpa: row.filter_dp_kpa ?? null,
    filter_status: row.filter_status ?? null,
    demo_mode: row.demo_mode ? 1 : 0,
    firmware_version: row.firmware_version ?? null,
  });
  return result.lastInsertRowid as number;
}

export function getRecentReadings(tank_id?: string, limit = 50): TelemetryRow[] {
  if (tank_id) {
    return db
      .prepare('SELECT * FROM sensor_readings WHERE tank_id = ? ORDER BY created_at DESC LIMIT ?')
      .all(tank_id, limit) as TelemetryRow[];
  }
  return db
    .prepare('SELECT * FROM sensor_readings ORDER BY created_at DESC LIMIT ?')
    .all(limit) as TelemetryRow[];
}

export function insertAccessLog(row: Omit<AccessLogRow, 'id'>): void {
  stmtInsertLog.run(row);
  // Prune to last 500 rows
  db.prepare('DELETE FROM access_log WHERE id NOT IN (SELECT id FROM access_log ORDER BY id DESC LIMIT 500)').run();
}

export function getRecentAccessLogs(limit = 100): AccessLogRow[] {
  return db
    .prepare('SELECT * FROM access_log ORDER BY id DESC LIMIT ?')
    .all(limit) as AccessLogRow[];
}

export default db;
