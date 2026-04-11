import { useState, useEffect } from 'react';
import { PondSelector } from '@/components/PondSelector';
import { SensorCard } from '@/components/SensorCard';
import { SensorChart } from '@/components/SensorChart';
import { AlertsPanel } from '@/components/AlertsPanel';
import { AnnkePlayer } from '@/components/AnnkePlayer';
import { useLatestSensor, useSensorHistory } from '@/hooks/useSensorData';
import { usePonds } from '@/context/PondsContext';
import { RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PondThresholds } from '@/types';

function getStatus(
  value: number,
  thresholds: { min?: number; max?: number }
): 'normal' | 'warning' | 'critical' {
  const { min, max } = thresholds;
  if ((min !== undefined && value < min) || (max !== undefined && value > max)) return 'critical';
  const range = (max ?? value) - (min ?? value);
  const margin = range * 0.15;
  if (
    (min !== undefined && value < min + margin) ||
    (max !== undefined && value > max - margin)
  )
    return 'warning';
  return 'normal';
}

export default function DashboardPage() {
  const { ponds, getPond } = usePonds();
  const [selectedPond, setSelectedPond] = useState<number>(ponds[0]?.id ?? 1);

  // If the selected pond was deleted, fall back to the first available pond
  useEffect(() => {
    if (!getPond(selectedPond) && ponds.length > 0) {
      setSelectedPond(ponds[0].id);
    }
  }, [ponds, selectedPond, getPond]);

  const pond = getPond(selectedPond);
  const { data: latest, isLoading, refetch, isRefetching } = useLatestSensor(selectedPond);
  const { data: history } = useSensorHistory(selectedPond, 24);

  const t = pond?.thresholds as PondThresholds | undefined;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {pond?.name ?? '—'} · {pond?.location ?? '—'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
          data-testid="button-refresh"
        >
          {isRefetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Pond Selector */}
      <PondSelector selectedPondId={selectedPond} onChange={setSelectedPond} />

      {/* Sensor Cards */}
      {isLoading || !latest ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4 animate-pulse">
              <div className="h-3 w-16 bg-muted rounded mb-3" />
              <div className="h-7 w-12 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 animate-slide-up">
          <SensorCard
            label="Temp"
            value={latest.temperature}
            unit="°F"
            icon="temperature"
            status={getStatus(latest.temperature, t?.temperature ?? { min: 75, max: 84 })}
          />
          <SensorCard
            label="pH"
            value={latest.ph}
            unit=""
            icon="ph"
            status={getStatus(latest.ph, t?.ph ?? { min: 6.5, max: 8.5 })}
          />
          <SensorCard
            label="DO"
            value={latest.dissolved_oxygen}
            unit="mg/L"
            icon="oxygen"
            status={getStatus(latest.dissolved_oxygen, t?.dissolved_oxygen ?? { min: 5, max: 10 })}
          />
          <SensorCard
            label="Ammonia"
            value={latest.ammonia}
            unit="ppm"
            icon="ammonia"
            status={getStatus(latest.ammonia, { max: t?.ammonia?.max ?? 0.1 })}
          />
          <SensorCard
            label="Salinity"
            value={latest.salinity}
            unit="ppt"
            icon="salinity"
            status={getStatus(latest.salinity, t?.salinity ?? { min: 10, max: 25 })}
          />
          <SensorCard
            label="Turbidity"
            value={latest.turbidity}
            unit="NTU"
            icon="turbidity"
            status={getStatus(latest.turbidity, { max: t?.turbidity?.max ?? 25 })}
          />
        </div>
      )}

      {/* Charts + Camera Row */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {history && (
            <>
              <SensorChart
                data={history}
                metric="temperature"
                label="Temperature (°F) — 24h"
                color="hsl(0, 72%, 51%)"
              />
              <SensorChart
                data={history}
                metric="dissolved_oxygen"
                label="Dissolved Oxygen (mg/L) — 24h"
                color="hsl(199, 89%, 38%)"
              />
              <SensorChart
                data={history}
                metric="ph"
                label="pH — 24h"
                color="hsl(168, 60%, 42%)"
              />
            </>
          )}
        </div>

        <div className="space-y-4">
          <AnnkePlayer pondId={selectedPond} label={`${pond?.name ?? 'Pond'} Camera`} />
          <AlertsPanel pondFilter={selectedPond} />
        </div>
      </div>
    </div>
  );
}
