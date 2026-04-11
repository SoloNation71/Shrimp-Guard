import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MOCK_PONDS } from '@/api/mock-data';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

const FIELDS = [
  { key: 'temperature', label: 'Temperature (°F)', placeholder: '78.5' },
  { key: 'ph', label: 'pH', placeholder: '7.2' },
  { key: 'dissolved_oxygen', label: 'Dissolved Oxygen (mg/L)', placeholder: '6.5' },
  { key: 'ammonia', label: 'Ammonia (ppm)', placeholder: '0.02' },
  { key: 'salinity', label: 'Salinity (ppt)', placeholder: '15' },
  { key: 'turbidity', label: 'Turbidity (NTU)', placeholder: '12' },
] as const;

export function ManualEntryForm() {
  const { user } = useAuth();
  const [pondId, setPondId] = useState(1);
  const [values, setValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isViewer = user?.role === 'viewer';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Simulate API call / queue for offline
    await new Promise((r) => setTimeout(r, 600));

    toast.success('Reading submitted successfully', {
      description: `Pond ${pondId} manual entry recorded.`,
    });

    setValues({});
    setNotes('');
    setSubmitting(false);
  };

  if (isViewer) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
        <p className="text-sm">Manual entry is restricted to owners.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-4 space-y-4">
      <div>
        <Label htmlFor="pond-select" className="text-sm font-medium">Pond</Label>
        <select
          id="pond-select"
          value={pondId}
          onChange={(e) => setPondId(Number(e.target.value))}
          className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
        >
          {MOCK_PONDS.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <Label htmlFor={f.key} className="text-xs">{f.label}</Label>
            <Input
              id={f.key}
              type="number"
              step="any"
              placeholder={f.placeholder}
              value={values[f.key] || ''}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              className="mt-1"
            />
          </div>
        ))}
      </div>

      <div>
        <Label htmlFor="notes" className="text-xs">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any observations..."
          className="mt-1"
          rows={2}
        />
      </div>

      <Button type="submit" className="w-full gradient-ocean" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit Reading'}
      </Button>
    </form>
  );
}
