import { AnnkePlayer } from '@/components/AnnkePlayer';
import { MOCK_PONDS } from '@/api/mock-data';

export default function CamerasPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-foreground">Camera Feeds</h1>
      <p className="text-sm text-muted-foreground">
        Live RTSP streams via Go2RTC → WebRTC/HLS proxy. Connect your Annke cameras to see feeds here.
      </p>
      <div className="grid md:grid-cols-2 gap-4">
        {MOCK_PONDS.map((pond) => (
          <AnnkePlayer key={pond.id} label={`${pond.name} — ${pond.location}`} />
        ))}
      </div>
    </div>
  );
}
