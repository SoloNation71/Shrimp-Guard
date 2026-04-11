import { InfluxDB, flux } from '@influxdata/influxdb-client';

const url = process.env.INFLUXDB_URL;
const token = process.env.INFLUXDB_TOKEN;
const org = process.env.INFLUXDB_ORG || 'shrimpguard';
const bucket = process.env.INFLUXDB_BUCKET || 'shrimpguard';

function getClient(): InfluxDB {
  if (!url || !token) {
    throw new Error('InfluxDB not configured: set INFLUXDB_URL and INFLUXDB_TOKEN');
  }
  return new InfluxDB({ url, token });
}

export interface SensorRow {
  id: string;
  pond_id: number;
  timestamp: string;
  temperature: number;
  ph: number;
  dissolved_oxygen: number;
  ammonia: number;
  salinity: number;
  turbidity: number;
}

const SENSOR_FIELDS = [
  'temperature',
  'ph',
  'dissolved_oxygen',
  'ammonia',
  'salinity',
  'turbidity',
] as const;

type SensorField = (typeof SENSOR_FIELDS)[number];

function rowsToReading(rows: Record<string, unknown>[]): SensorRow | null {
  if (!rows.length) return null;

  const first = rows[0];
  const timestamp = String(first._time ?? new Date().toISOString());
  const pondId = Number(first.pond_id ?? 0);

  const reading: Partial<SensorRow> = {
    id: `${pondId}-${Date.parse(timestamp)}`,
    pond_id: pondId,
    timestamp,
  };

  for (const row of rows) {
    const field = String(row._field) as SensorField;
    if (SENSOR_FIELDS.includes(field)) {
      (reading as Record<string, unknown>)[field] = Number(row._value ?? 0);
    }
  }

  return reading as SensorRow;
}

export async function queryLatest(pondId: number): Promise<SensorRow | null> {
  const client = getClient();
  const queryApi = client.getQueryApi(org);

  const query = flux`
    from(bucket: ${bucket})
      |> range(start: -1h)
      |> filter(fn: (r) => r._measurement == "sensor_reading")
      |> filter(fn: (r) => r.pond_id == ${String(pondId)})
      |> filter(fn: (r) => ${flux.literal(SENSOR_FIELDS.map((f) => `r._field == "${f}"`).join(' or '))})
      |> last()
  `;

  const rows: Record<string, unknown>[] = [];
  await queryApi.collectRows(query, (row, tableMeta) => {
    rows.push(tableMeta.toObject(row));
  });

  return rowsToReading(rows);
}

export async function queryHistory(
  pondId: number,
  hours: number
): Promise<SensorRow[]> {
  const client = getClient();
  const queryApi = client.getQueryApi(org);

  const query = flux`
    from(bucket: ${bucket})
      |> range(start: -${flux.literal(`${hours}h`)})
      |> filter(fn: (r) => r._measurement == "sensor_reading")
      |> filter(fn: (r) => r.pond_id == ${String(pondId)})
      |> filter(fn: (r) => ${flux.literal(SENSOR_FIELDS.map((f) => `r._field == "${f}"`).join(' or '))})
      |> aggregateWindow(every: 15m, fn: mean, createEmpty: false)
      |> pivot(rowKey: ["_time", "pond_id"], columnKey: ["_field"], valueColumn: "_value")
      |> sort(columns: ["_time"])
  `;

  const results: SensorRow[] = [];
  await queryApi.collectRows(query, (row, tableMeta) => {
    const obj = tableMeta.toObject(row);
    const timestamp = String(obj._time ?? new Date().toISOString());
    const pid = Number(obj.pond_id ?? pondId);
    results.push({
      id: `${pid}-${Date.parse(timestamp)}`,
      pond_id: pid,
      timestamp,
      temperature: Number(obj.temperature ?? 0),
      ph: Number(obj.ph ?? 0),
      dissolved_oxygen: Number(obj.dissolved_oxygen ?? 0),
      ammonia: Number(obj.ammonia ?? 0),
      salinity: Number(obj.salinity ?? 0),
      turbidity: Number(obj.turbidity ?? 0),
    });
  });

  return results;
}

export async function writeManualEntry(
  pondId: number,
  fields: Partial<Omit<SensorRow, 'id' | 'pond_id' | 'timestamp'>>,
  timestamp?: string
): Promise<void> {
  const { WriteApi } = await import('@influxdata/influxdb-client');
  const { Point } = await import('@influxdata/influxdb-client');
  const client = getClient();
  const writeApi = client.getWriteApi(org, bucket, 'ms');

  const point = new Point('sensor_reading').tag('pond_id', String(pondId));

  for (const [key, val] of Object.entries(fields)) {
    if (val !== undefined && val !== null) {
      point.floatField(key, Number(val));
    }
  }

  if (timestamp) {
    point.timestamp(new Date(timestamp).getTime());
  }

  writeApi.writePoint(point);
  await writeApi.close();
}
