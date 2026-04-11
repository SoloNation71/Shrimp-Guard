import { getMockAlerts } from '@/api/mock-data';
import { AlertTriangle, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

export function AlertsPanel({ pondFilter }: { pondFilter?: number }) {
  const [alerts, setAlerts] = useState(getMockAlerts);
  const filtered = pondFilter ? alerts.filter((a) => a.pond_id === pondFilter) : alerts;

  const acknowledge = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)));
  };

  if (filtered.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
        <Check className="h-8 w-8 mx-auto mb-2 text-success" />
        <p className="text-sm">All clear — no active alerts</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filtered.map((alert) => (
        <div
          key={alert.id}
          className={cn(
            'rounded-lg border p-3 flex items-start gap-3 transition-all',
            alert.acknowledged && 'opacity-50',
            alert.type === 'critical' ? 'border-danger/30 bg-danger/5' : 'border-warning/30 bg-warning/5'
          )}
        >
          {alert.type === 'critical' ? (
            <AlertCircle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{alert.message}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pond {alert.pond_id} · {alert.parameter}: {alert.value} (threshold: {alert.threshold}) ·{' '}
              {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
            </p>
          </div>
          {!alert.acknowledged && (
            <button
              onClick={() => acknowledge(alert.id)}
              className="text-xs px-2 py-1 rounded bg-card border text-muted-foreground hover:text-foreground shrink-0"
            >
              ACK
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
