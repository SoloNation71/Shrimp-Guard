import { AlertsPanel } from '@/components/AlertsPanel';

export default function AlertsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-foreground">Alerts</h1>
      <p className="text-sm text-muted-foreground">Active and acknowledged alerts across all ponds.</p>
      <AlertsPanel />
    </div>
  );
}
