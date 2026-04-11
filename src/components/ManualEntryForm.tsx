import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { usePonds } from '@/context/PondsContext';
import { submitManualEntry } from '@/api/manualEntry';
import { useMutation } from '@tanstack/react-query';
import { Loader2, WifiOff } from 'lucide-react';
import type { ManualEntry } from '@/types';

const FIELDS = [
  { key: 'temperature', label: 'Temperature (°F)', placeholder: '78.5' },
  { key: 'ph', label: 'pH', placeholder: '7.2' },
  { key: 'dissolved_oxygen', label: 'Dissolved Oxygen (mg/L)', placeholder: '6.5' },
  { key: 'ammonia', label: 'Ammonia (ppm)', placeholder: '0.02' },
  { key: 'salinity', label: 'Salinity (ppt)', placeholder: '15' },
  { key: 'turbidity', label: 'Turbidity (NTU)', placeholder: '12' },
] as const;

type FieldKey = (typeof FIELDS)[number]['key'];

const OFFLINE_QUEUE_KEY = 'shrimpguard:offline_queue';

function loadQueue(): ManualEntry[] {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveQueue(queue: ManualEntry[]) {
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export function ManualEntryForm() {
  const { user } = useAuth();
  const { ponds, getPond } = usePonds();

  const [pondId, setPondId] = useState<number>(ponds[0]?.id ?? 1);
  const [values, setValues] = useState<Partial<Record<FieldKey, string>>>({});
  const [notes, setNotes] = useState('');
  const [isOffline] = useState(!navigator.onLine);
  const [queueCount, setQueueCount] = useState(() => loadQueue().length);

  const isViewer = user?.role === 'viewer';

  const mutation = useMutation({
    mutationFn: (entry: ManualEntry) => submitManualEntry(entry),
    onSuccess: () => {
      const pondName = getPond(pondId)?.name ?? `Pond ${pondId}`;
      toast.success('Reading submitted successfully', {
        description: `${pondName} manual entry recorded.`,
      });
      setValues({});
      setNotes('');
    },
    onError: () => {
      if (!navigator.onLine) {
        queueOffline();
      } else {
        toast.error('Failed to submit reading', {
          description: 'Check your connection and try again.',
        });
      }
    },
  });

  function buildEntry(): ManualEntry {
    const fields: Partial<Record<FieldKey, number>> = {};
    for (const field of FIELDS) {
      const v = values[field.key];
      if (v !== undefined && v !== '') {
        fields[field.key] = Number(v);
      }
    }
    return {
      pond_id: pondId,
      timestamp: new Date().toISOString(),
      notes: notes || undefined,
      ...fields,
    };
  }

  function queueOffline() {
    const entry = buildEntry();
    const queue = loadQueue();
    queue.push(entry);
    saveQueue(queue);
    setQueueCount(queue.length);
    toast('Queued for later', {
      description: 'Stored offline. Will sync when connection restores.',
    });
    setValues({});
    setNotes('');
  }

  async function flushQueue() {
    const queue = loadQueue();
    if (!queue.length) return;
    let sent = 0;
    const remaining: ManualEntry[] = [];
    for (const entry of queue) {
      try {
        await submitManualEntry(entry);
        sent++;
      } catch {
        remaining.push(entry);
      }
    }
    saveQueue(remaining);
    setQueueCount(remaining.length);
    if (sent > 0) {
      toast.success(`Synced ${sent} queued reading${sent !== 1 ? 's' : ''}`);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!navigator.onLine) {
      queueOffline();
      return;
    }
    mutation.mutate(buildEntry());
  };

  if (isViewer) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
        <p className="text-sm">Manual entry is restricted to owners.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {queueCount > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-warning/40 bg-warning/10 px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-warning-foreground">
            <WifiOff className="h-4 w-4" />
            <span>
              {queueCount} reading{queueCount !== 1 ? 's' : ''} queued offline
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={flushQueue}
            disabled={isOffline}
          >
            Sync now
          </Button>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-lg border bg-card p-4 space-y-4"
        data-testid="manual-entry-form"
      >
        <div>
          <Label htmlFor="pond-select" className="text-sm font-medium">
            Pond
          </Label>
          <select
            id="pond-select"
            data-testid="select-pond"
            value={pondId}
            onChange={(e) => setPondId(Number(e.target.value))}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {ponds.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <Label htmlFor={f.key} className="text-xs">
                {f.label}
              </Label>
              <Input
                id={f.key}
                data-testid={`input-${f.key}`}
                type="number"
                step="any"
                placeholder={f.placeholder}
                value={values[f.key] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                className="mt-1"
              />
            </div>
          ))}
        </div>

        <div>
          <Label htmlFor="notes" className="text-xs">
            Notes
          </Label>
          <Textarea
            id="notes"
            data-testid="input-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any observations…"
            className="mt-1"
            rows={2}
          />
        </div>

        <Button
          type="submit"
          className="w-full gradient-ocean"
          disabled={mutation.isPending}
          data-testid="button-submit"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting…
            </>
          ) : isOffline ? (
            'Queue Offline'
          ) : (
            'Submit Reading'
          )}
        </Button>
      </form>
    </div>
  );
}
