import { AnnkePlayer } from '@/components/AnnkePlayer';
import { usePonds } from '@/context/PondsContext';

export default function CamerasPage() {
  const { ponds } = usePonds();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">Camera Feeds</h1>
        <p className="text-sm text-muted-foreground">
          Live RTSP streams proxied via Go2RTC → WebRTC/HLS. Configure your Annke cameras in Go2RTC to activate feeds.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {ponds.map((pond) => (
          <AnnkePlayer
            key={pond.id}
            pondId={pond.id}
            label={`${pond.name} — ${pond.location}`}
          />
        ))}
      </div>
    </div>
  );
}
