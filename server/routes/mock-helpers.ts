import type { SensorRow } from '../lib/influxdb.js';

function generateReading(pondId: number, timestamp: Date): SensorRow {
  const base = {
    temperature: 78 + Math.random() * 6 - 3,
    ph: 7.2 + Math.random() * 1.2 - 0.6,
    dissolved_oxygen: 6.5 + Math.random() * 2 - 1,
    ammonia: 0.02 + Math.random() * 0.08,
    salinity: 15 + Math.random() * 4 - 2,
    turbidity: 12 + Math.random() * 8 - 4,
  };

  if (pondId === 2) base.ph = 6.2 + Math.random() * 0.3;
  if (pondId === 4) {
    base.ammonia = 0.15 + Math.random() * 0.1;
    base.dissolved_oxygen = 4.0 + Math.random() * 0.5;
  }

  return {
    id: `${pondId}-${timestamp.getTime()}`,
    pond_id: pondId,
    timestamp: timestamp.toISOString(),
    temperature: +base.temperature.toFixed(1),
    ph: +base.ph.toFixed(2),
    dissolved_oxygen: +base.dissolved_oxygen.toFixed(1),
    ammonia: +base.ammonia.toFixed(3),
    salinity: +base.salinity.toFixed(1),
    turbidity: +base.turbidity.toFixed(1),
  };
}

export function getMockLatestReading(pondId: number): SensorRow {
  return generateReading(pondId, new Date());
}

export function getMockHistory(pondId: number, hours: number): SensorRow[] {
  const readings: SensorRow[] = [];
  const now = Date.now();
  const interval = 15 * 60 * 1000;
  const count = Math.round((hours * 60) / 15);

  for (let i = count; i >= 0; i--) {
    readings.push(generateReading(pondId, new Date(now - i * interval)));
  }
  return readings;
}
