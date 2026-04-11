import { usePonds } from '@/context/PondsContext';
import { cn } from '@/lib/utils';

interface PondSelectorProps {
  selectedPondId: number;
  onChange: (pondId: number) => void;
}

const STATUS_DOT = {
  healthy: 'bg-success',
  warning: 'bg-warning',
  critical: 'bg-danger animate-pulse-glow',
};

export function PondSelector({ selectedPondId, onChange }: PondSelectorProps) {
  const { ponds } = usePonds();

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {ponds.map((pond) => (
        <button
          key={pond.id}
          onClick={() => onChange(pond.id)}
          data-testid={`button-pond-${pond.id}`}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium whitespace-nowrap transition-all',
            selectedPondId === pond.id
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-card text-muted-foreground hover:border-primary/30'
          )}
        >
          <span className={cn('h-2 w-2 rounded-full', STATUS_DOT[pond.status])} />
          {pond.name}
        </button>
      ))}
    </div>
  );
}
