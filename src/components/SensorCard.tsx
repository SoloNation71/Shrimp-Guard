import { cn } from '@/lib/utils';
import { Thermometer, Droplets, Wind, FlaskConical, Waves, Eye } from 'lucide-react';

interface SensorCardProps {
  label: string;
  value: number;
  unit: string;
  icon: 'temperature' | 'ph' | 'oxygen' | 'ammonia' | 'salinity' | 'turbidity';
  status?: 'normal' | 'warning' | 'critical';
}

const ICONS = {
  temperature: Thermometer,
  ph: FlaskConical,
  oxygen: Wind,
  ammonia: Droplets,
  salinity: Waves,
  turbidity: Eye,
};

const STATUS_CLASSES = {
  normal: 'border-success/30 bg-success/5',
  warning: 'border-warning/30 bg-warning/5',
  critical: 'border-danger/30 bg-danger/5',
};

const ICON_CLASSES = {
  normal: 'text-success',
  warning: 'text-warning',
  critical: 'text-danger',
};

export function SensorCard({ label, value, unit, icon, status = 'normal' }: SensorCardProps) {
  const Icon = ICONS[icon];

  return (
    <div className={cn(
      'rounded-lg border p-4 transition-all sensor-card-glow',
      STATUS_CLASSES[status]
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        <Icon className={cn('h-4 w-4', ICON_CLASSES[status])} />
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-foreground">{value}</span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}
