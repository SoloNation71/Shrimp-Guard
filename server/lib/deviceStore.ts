import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.resolve(__dirname, '../data/devices.json');

export interface Device {
  id: string;
  name: string;
  type: 'arduino' | 'raspberry_pi';
  pond_id: number;
  key: string;          // API key shown once at creation
  key_preview: string;  // First 8 chars for display
  created_at: string;
  last_seen: string | null;
  last_reading: Record<string, number> | null;
}

interface Store {
  devices: Device[];
}

function read(): Store {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) as Store;
  } catch {
    return { devices: [] };
  }
}

function write(store: Store): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf8');
}

export function listDevices(): Omit<Device, 'key'>[] {
  return read().devices.map(({ key: _k, ...rest }) => rest);
}

export function createDevice(
  name: string,
  type: Device['type'],
  pond_id: number
): Device {
  const store = read();
  const key = crypto.randomBytes(32).toString('hex');
  const device: Device = {
    id: crypto.randomUUID(),
    name,
    type,
    pond_id,
    key,
    key_preview: key.slice(0, 8) + '…',
    created_at: new Date().toISOString(),
    last_seen: null,
    last_reading: null,
  };
  store.devices.push(device);
  write(store);
  return device; // Return full key once
}

export function deleteDevice(id: string): boolean {
  const store = read();
  const before = store.devices.length;
  store.devices = store.devices.filter((d) => d.id !== id);
  write(store);
  return store.devices.length < before;
}

export function validateKey(key: string): Device | null {
  const store = read();
  return store.devices.find((d) => d.key === key) ?? null;
}

export function touchDevice(
  id: string,
  reading: Record<string, number>
): void {
  const store = read();
  const device = store.devices.find((d) => d.id === id);
  if (device) {
    device.last_seen = new Date().toISOString();
    device.last_reading = reading;
    write(store);
  }
}
