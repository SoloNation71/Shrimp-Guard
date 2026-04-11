import { useRef, useEffect, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { Video, VideoOff, Maximize, Minimize, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchStreamToken } from '@/api/streams';
import type { StreamToken } from '@/api/streams';

interface AnnkePlayerProps {
  pondId?: number;
  label?: string;
}

export function AnnkePlayer({ pondId, label = 'Camera Feed' }: AnnkePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [streamToken, setStreamToken] = useState<StreamToken | null>(null);

  const isDemoMode = !pondId;

  const loadToken = useCallback(async () => {
    if (!pondId) return;
    setError(null);
    setLoading(true);
    try {
      const token = await fetchStreamToken(pondId);
      setStreamToken(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stream');
      setLoading(false);
    }
  }, [pondId]);

  useEffect(() => {
    if (!isDemoMode) loadToken();
    else setLoading(false);
  }, [isDemoMode, loadToken]);

  useEffect(() => {
    if (!streamToken || !videoRef.current) {
      setLoading(false);
      return;
    }

    const hlsUrl = streamToken.hlsUrl;

    hlsRef.current?.destroy();

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(hlsUrl);
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, () => setLoading(false));
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) setError('Stream error — tap to retry');
      });
      return () => hls.destroy();
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = hlsUrl;
      videoRef.current.addEventListener('loadedmetadata', () => setLoading(false));
    } else {
      setError('HLS not supported in this browser');
    }
  }, [streamToken]);

  // Refresh token before expiry
  useEffect(() => {
    if (!streamToken || isDemoMode) return;
    const expiresAt = new Date(streamToken.expiresAt).getTime();
    const refreshIn = expiresAt - Date.now() - 30_000;
    if (refreshIn <= 0) {
      loadToken();
      return;
    }
    const timer = setTimeout(loadToken, refreshIn);
    return () => clearTimeout(timer);
  }, [streamToken, isDemoMode, loadToken]);

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
    <div className="rounded-lg border bg-card overflow-hidden" data-testid={`camera-${pondId ?? 'demo'}`}>
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-1">
          {!isDemoMode && (
            <>
              <button
                onClick={loadToken}
                className="p-1 rounded hover:bg-muted"
                aria-label="Reload stream"
                data-testid="button-reload-stream"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-1 rounded hover:bg-muted"
                aria-label="Toggle fullscreen"
                data-testid="button-fullscreen"
              >
                {isFullscreen ? (
                  <Minimize className="h-3.5 w-3.5" />
                ) : (
                  <Maximize className="h-3.5 w-3.5" />
                )}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="relative aspect-video bg-foreground/5">
        {isDemoMode ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            <VideoOff className="h-10 w-10 mb-2 opacity-40" />
            <p className="text-sm font-medium">Camera Offline</p>
            <p className="text-xs mt-1">Configure Go2RTC stream to connect</p>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-destructive gap-2">
            <VideoOff className="h-10 w-10" />
            <p className="text-sm font-medium">{error}</p>
            <button
              onClick={loadToken}
              className="text-xs underline text-muted-foreground hover:text-foreground"
            >
              Retry
            </button>
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
