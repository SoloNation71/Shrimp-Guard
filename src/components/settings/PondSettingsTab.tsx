import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MOCK_PONDS } from '@/api/mock-data';
import { Pencil, Check, X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Pond, PondThresholds } from '@/types';

export function PondSettingsTab() {
  const [ponds, setPonds] = useState<Pond[]>([...MOCK_PONDS]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; location: string; thresholds: PondThresholds } | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newPond, setNewPond] = useState({ name: '', location: '' });

  const startEdit = (pond: Pond) => {
    setEditingId(pond.id);
    setEditForm({ name: pond.name, location: pond.location, thresholds: { ...pond.thresholds } });
  };

  const saveEdit = () => {
    if (!editForm || editingId === null) return;
    setPonds(ponds.map(p => p.id === editingId ? { ...p, name: editForm.name, location: editForm.location, thresholds: editForm.thresholds } : p));
    setEditingId(null);
    setEditForm(null);
    toast.success('Pond updated');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const addPond = () => {
    if (!newPond.name.trim()) return;
    const id = Math.max(...ponds.map(p => p.id)) + 1;
    const defaultThresholds: PondThresholds = {
      temperature: { min: 75, max: 84 },
      ph: { min: 6.5, max: 8.5 },
      dissolved_oxygen: { min: 5, max: 10 },
      ammonia: { max: 0.1 },
      salinity: { min: 10, max: 25 },
      turbidity: { max: 25 },
    };
    setPonds([...ponds, { id, name: newPond.name, location: newPond.location, status: 'healthy', thresholds: defaultThresholds }]);
    setNewPond({ name: '', location: '' });
    setShowAdd(false);
    toast.success('Pond added');
  };

  const deletePond = (id: number) => {
    setPonds(ponds.filter(p => p.id !== id));
    toast.success('Pond removed');
  };

  const updateThreshold = (field: string, bound: 'min' | 'max', value: string) => {
    if (!editForm) return;
    const num = parseFloat(value);
    if (isNaN(num)) return;
    setEditForm({
      ...editForm,
      thresholds: {
        ...editForm.thresholds,
        [field]: { ...(editForm.thresholds as any)[field], [bound]: num },
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Pond Management</h2>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="h-4 w-4 mr-1" /> Add Pond
        </Button>
      </div>

      {showAdd && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Name</Label>
                <Input value={newPond.name} onChange={e => setNewPond({ ...newPond, name: e.target.value })} placeholder="Pond Echo" className="mt-1" />
              </div>
              <div>
                <Label>Location</Label>
                <Input value={newPond.location} onChange={e => setNewPond({ ...newPond, location: e.target.value })} placeholder="Building C" className="mt-1" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={addPond}>Add</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {ponds.map(pond => (
        <Card key={pond.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              {editingId === pond.id ? (
                <div className="flex-1 grid grid-cols-2 gap-3 mr-3">
                  <Input value={editForm!.name} onChange={e => setEditForm({ ...editForm!, name: e.target.value })} />
                  <Input value={editForm!.location} onChange={e => setEditForm({ ...editForm!, location: e.target.value })} />
                </div>
              ) : (
                <div>
                  <CardTitle className="text-base">{pond.name}</CardTitle>
                  <CardDescription>{pond.location}</CardDescription>
                </div>
              )}
              <div className="flex gap-1">
                {editingId === pond.id ? (
                  <>
                    <Button size="icon" variant="ghost" onClick={saveEdit}><Check className="h-4 w-4 text-success" /></Button>
                    <Button size="icon" variant="ghost" onClick={cancelEdit}><X className="h-4 w-4" /></Button>
                  </>
                ) : (
                  <>
                    <Button size="icon" variant="ghost" onClick={() => startEdit(pond)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => deletePond(pond.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>

          {editingId === pond.id && editForm && (
            <CardContent className="pt-0">
              <p className="text-sm font-medium text-muted-foreground mb-2">Thresholds</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { key: 'temperature', label: 'Temp (°F)', hasMin: true },
                  { key: 'ph', label: 'pH', hasMin: true },
                  { key: 'dissolved_oxygen', label: 'DO (mg/L)', hasMin: true },
                  { key: 'ammonia', label: 'Ammonia (ppm)', hasMin: false },
                  { key: 'salinity', label: 'Salinity (ppt)', hasMin: true },
                  { key: 'turbidity', label: 'Turbidity (NTU)', hasMin: false },
                ].map(({ key, label, hasMin }) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs">{label}</Label>
                    <div className="flex gap-1">
                      {hasMin && (
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Min"
                          value={(editForm.thresholds as any)[key]?.min ?? ''}
                          onChange={e => updateThreshold(key, 'min', e.target.value)}
                          className="text-xs h-8"
                        />
                      )}
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Max"
                        value={(editForm.thresholds as any)[key]?.max ?? ''}
                        onChange={e => updateThreshold(key, 'max', e.target.value)}
                        className="text-xs h-8"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
