import crypto from 'crypto';

const GO2RTC_BASE = process.env.GO2RTC_BASE_URL || 'http://localhost:1984';
const GO2RTC_API_KEY = process.env.GO2RTC_API_KEY || '';

export interface StreamToken {
  url: string;
  hlsUrl: string;
  token: string;
  expiresAt: string;
}

function generateToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

export async function getStreamToken(
  pondId: number
): Promise<StreamToken> {
  const streamName = `pond_${pondId}`;
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (GO2RTC_API_KEY) {
    headers['Authorization'] = `Bearer ${GO2RTC_API_KEY}`;
  }

  const webrtcUrl = `${GO2RTC_BASE}/api/webrtc?src=${streamName}&token=${token}`;
  const hlsUrl = `${GO2RTC_BASE}/api/stream.m3u8?src=${streamName}&token=${token}`;

  try {
    const res = await fetch(`${GO2RTC_BASE}/api/streams`, { headers });
    if (!res.ok) {
      throw new Error(`Go2RTC API error: ${res.status}`);
    }
    const streams: Record<string, unknown> = await res.json();
    if (!streams[streamName]) {
      throw new Error(`Stream not found: ${streamName}`);
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Go2RTC] Using demo mode — stream not verified:', err instanceof Error ? err.message : err);
      return {
        url: webrtcUrl,
        hlsUrl,
        token,
        expiresAt,
      };
    }
    throw err;
  }

  return {
    url: webrtcUrl,
    hlsUrl,
    token,
    expiresAt,
  };
}

export async function listStreams(): Promise<string[]> {
  const headers: Record<string, string> = {};
  if (GO2RTC_API_KEY) {
    headers['Authorization'] = `Bearer ${GO2RTC_API_KEY}`;
  }

  try {
    const res = await fetch(`${GO2RTC_BASE}/api/streams`, { headers });
    if (!res.ok) throw new Error(`Go2RTC error: ${res.status}`);
    const data: Record<string, unknown> = await res.json();
    return Object.keys(data);
  } catch (err) {
    console.warn('[Go2RTC] listStreams demo mode —', err instanceof Error ? err.message : err);
    // Return placeholder stream names so the UI stays functional without Go2RTC
    return ['pond_1', 'pond_2', 'pond_3', 'pond_4'];
  }
}
