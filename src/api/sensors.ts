import type { SensorReading } from '@/types';
import { apiGet } from '@/lib/apiClient';

export async function fetchLatestSensorData(pondId: number): Promise<SensorReading> {
  return apiGet<SensorReading>(`/sensors/latest?pond_id=${pondId}`);
}

export async function fetchSensorHistory(
  pondId: number,
  hours = 24
): Promise<SensorReading[]> {
  return apiGet<SensorReading[]>(`/sensors/history?pond_id=${pondId}&hours=${hours}`);
}
