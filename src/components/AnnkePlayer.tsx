import { useRef, useEffect, useState } from 'react';
import Hls from 'hls.js';
import { Video, VideoOff, Maximize, Minimize } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnnkePlayerProps {
  stream_url?: string;
  token?: string;
  label?: string;
}

export function AnnkePlayer({ stream_url, token, label = 'Camera Feed' }: AnnkePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Demo mode — no real stream
  const isDemoMode = !stream_url;

  useEffect(() => {
    if (isDemoMode || !videoRef.current) {
      setLoading(false);
      return;
    }

    const url = token ? `${stream_url}?token=${token}` : stream_url;

    // Try WebRTC first (Go2RTC), fall back to HLS
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(url);
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, () => setLoading(false));
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) setError(true);
      });
      return () => hls.destroy();
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = url;
      videoRef.current.addEventListener('loadedmetadata', () => setLoading(false));
    } else {
      setError(true);
    }
  }, [stream_url, token, isDemoMode]);

  const toggleFullscreen = () => {
    const container = videoRef.current?.parentElement;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        {!isDemoMode && (
          <button onClick={toggleFullscreen} className="p-1 rounded hover:bg-muted" aria-label="Toggle fullscreen">
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        )}
      </div>

      <div className="relative aspect-video bg-foreground/5">
        {isDemoMode ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            <VideoOff className="h-10 w-10 mb-2 opacity-40" />
            <p className="text-sm font-medium">Camera Offline</p>
            <p className="text-xs mt-1">Configure Go2RTC stream URL to connect</p>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-danger">
            <VideoOff className="h-10 w-10 mb-2" />
            <p className="text-sm font-medium">Stream Error</p>
            <p className="text-xs mt-1 text-muted-foreground">Unable to load camera feed</p>
          </div>
        ) : (
          <>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={cn('w-full h-full object-cover', loading && 'invisible')}
            />
          </>
        )}
      </div>
    </div>
  );
}
