import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { SensorReading } from '@/types';
import { format } from 'date-fns';

interface SensorChartProps {
  data: SensorReading[];
  metric: keyof Omit<SensorReading, 'id' | 'pond_id' | 'timestamp'>;
  label: string;
  color?: string;
}

export function SensorChart({ data, metric, label, color = 'hsl(199, 89%, 38%)' }: SensorChartProps) {
  const chartData = useMemo(
    () =>
      data.map((r) => ({
        time: format(new Date(r.timestamp), 'HH:mm'),
        value: r[metric] as number,
      })),
    [data, metric]
  );

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">{label}</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(200, 18%, 88%)" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: 'hsl(210, 10%, 45%)' }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(210, 10%, 45%)' }}
              tickLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{
                background: 'hsl(0, 0%, 100%)',
                border: '1px solid hsl(200, 18%, 88%)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
