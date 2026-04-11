import { ManualEntryForm } from '@/components/ManualEntryForm';

export default function ManualEntryPage() {
  return (
    <div className="space-y-4 max-w-lg">
      <h1 className="text-xl font-bold text-foreground">Manual Entry</h1>
      <p className="text-sm text-muted-foreground">Record sensor readings manually. Entries are queued if offline.</p>
      <ManualEntryForm />
    </div>
  );
}
