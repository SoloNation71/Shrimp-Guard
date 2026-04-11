import type { SensorReading } from '@/types';
import { getMockLatestReading, getMockHistory } from './mock-data';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const USE_MOCK = !import.meta.env.VITE_API_BASE_URL;

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

async function fetchWithRetry<T>(
  url: string,
  retries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          // Auth token would go here
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return await res.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, delay * (i + 1)));
    }
  }
  throw new Error('Fetch failed after retries');
}

export async function fetchLatestSensorData(pondId: number): Promise<SensorReading> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));
    return getMockLatestReading(pondId);
  }
  return fetchWithRetry<SensorReading>(`${API_BASE}/sensors/latest?pond_id=${pondId}`);
}

export async function fetchSensorHistory(
  pondId: number,
  hours = 24
): Promise<SensorReading[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 500));
    return getMockHistory(pondId, hours);
  }
  return fetchWithRetry<SensorReading[]>(
    `${API_BASE}/sensors/history?pond_id=${pondId}&hours=${hours}`
  );
}
