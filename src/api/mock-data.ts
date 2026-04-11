import type { SensorReading, Pond, Alert } from '@/types';

export const MOCK_PONDS: Pond[] = [
  { id: 1, name: 'Pond Alpha', location: 'North Greenhouse', status: 'healthy' },
  { id: 2, name: 'Pond Beta', location: 'South Greenhouse', status: 'warning' },
  { id: 3, name: 'Pond Gamma', location: 'Outdoor East', status: 'healthy' },
  { id: 4, name: 'Pond Delta', location: 'Outdoor West', status: 'critical' },
];

function generateReading(pondId: number, timestamp: Date): SensorReading {
  const base = {
    temperature: 78 + Math.random() * 6 - 3,
    ph: 7.2 + Math.random() * 1.2 - 0.6,
    dissolved_oxygen: 6.5 + Math.random() * 2 - 1,
    ammonia: 0.02 + Math.random() * 0.08,
    salinity: 15 + Math.random() * 4 - 2,
    turbidity: 12 + Math.random() * 8 - 4,
  };

  // Add anomalies for warning/critical ponds
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

export function getMockLatestReading(pondId: number): SensorReading {
  return generateReading(pondId, new Date());
}

export function getMockHistory(pondId: number, hours: number): SensorReading[] {
  const readings: SensorReading[] = [];
  const now = Date.now();
  const interval = 15 * 60 * 1000; // 15 min intervals
  const count = (hours * 60) / 15;

  for (let i = count; i >= 0; i--) {
    readings.push(generateReading(pondId, new Date(now - i * interval)));
  }
  return readings;
}

export function getMockAlerts(): Alert[] {
  return [
    {
      id: 'a1',
      pond_id: 2,
      type: 'warning',
      parameter: 'pH',
      message: 'pH dropping below optimal range',
      value: 6.3,
      threshold: 6.5,
      timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
      acknowledged: false,
    },
    {
      id: 'a2',
      pond_id: 4,
      type: 'critical',
      parameter: 'Ammonia',
      message: 'Ammonia levels critically high',
      value: 0.22,
      threshold: 0.1,
      timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
      acknowledged: false,
    },
    {
      id: 'a3',
      pond_id: 4,
      type: 'critical',
      parameter: 'Dissolved Oxygen',
      message: 'DO dangerously low',
      value: 3.8,
      threshold: 5.0,
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      acknowledged: false,
    },
    {
      id: 'a4',
      pond_id: 1,
      type: 'warning',
      parameter: 'Temperature',
      message: 'Temperature trending high',
      value: 82.1,
      threshold: 82,
      timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
      acknowledged: true,
    },
  ];
}
