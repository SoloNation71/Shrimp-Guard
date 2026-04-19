import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  Wifi,
  WifiOff,
  Radio,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  CheckCircle,
  Globe,
  Terminal,
} from 'lucide-react';
import { getAuthHeaders } from '@/lib/apiClient';
import { toast } from 'sonner';

interface HeartbeatResponse {
  status: string;
  timestamp: string;
}

interface AccessLogEntry {
  id: number;
  timestamp: string;
  method: string;
  endpoint: string;
  status_code: number;
  client_ip: string;
  duration_ms: number;
}

interface LiveEvent {
  id: string;
  received_at: string;
  payload: Record<string, unknown>;
}

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 5) return 'just now';
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

function statusColor(code: number): string {
  if (code < 300) return 'text-green-600 dark:text-green-400';
  if (code < 400) return 'text-blue-600 dark:text-blue-400';
  if (code < 500) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative">
      <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 text-xs overflow-x-auto whitespace-pre leading-relaxed">
        {code}
      </pre>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => {
          navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="absolute top-2 right-2 h-7 w-7 text-slate-300 hover:text-white"
        data-testid="button-copy-code"
      >
        {copied ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}

function HeartbeatCard() {
  const [latency, setLatency] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const { data, isError, refetch, isFetching } = useQuery<HeartbeatResponse>({
    queryKey: ['/api/heartbeat'],
    queryFn: async () => {
      const t0 = Date.now();
      const r = await fetch('/api/heartbeat', { headers: getAuthHeaders() });
      setLatency(Date.now() - t0);
      setLastChecked(new Date().toISOString());
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    refetchInterval: 30_000,
  });

  const online = !!data && !isError;

  return (
    <Card data-testid="card-heartbeat">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {online ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            <CardTitle className="text-base">API Heartbeat</CardTitle>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => refetch()}
            disabled={isFetching}
            data-testid="button-refresh-heartbeat"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription>Live connectivity check to the backend API</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <Badge
              variant={online ? 'default' : 'destructive'}
              className="mt-1"
              data-testid="status-heartbeat"
            >
              {online ? (
                <><CheckCircle2 className="h-3 w-3 mr-1" />Alive</>
              ) : (
                <><AlertCircle className="h-3 w-3 mr-1" />Unreachable</>
              )}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Latency</p>
            <p className="text-sm font-medium mt-1" data-testid="text-latency">
              {latency !== null ? `${latency} ms` : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Server Time</p>
            <p className="text-xs font-mono mt-1 text-muted-foreground" data-testid="text-server-time">
              {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString() : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Last Checked</p>
            <p className="text-xs mt-1 text-muted-foreground flex items-center gap-1" data-testid="text-last-checked">
              <Clock className="h-3 w-3" />
              {lastChecked ? timeAgo(lastChecked) : '—'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SystemInfoCard() {
  const { data } = useQuery<Record<string, unknown>>({
    queryKey: ['/api/health'],
    queryFn: async () => {
      const r = await fetch('/api/health', { headers: getAuthHeaders() });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    refetchInterval: 60_000,
  });

  const integrations = [
    { label: 'InfluxDB', key: 'influxdb' },
    { label: 'go2rtc', key: 'go2rtc' },
    { label: 'Supabase Auth', key: 'supabase' },
  ];

  return (
    <Card data-testid="card-system-info">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">System Status</CardTitle>
        </div>
        <CardDescription>Backend integration health</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {integrations.map(({ label, key }) => {
          const active = !!data?.[key];
          return (
            <div key={key} className="flex items-center justify-between" data-testid={`status-integration-${key}`}>
              <span className="text-sm text-muted-foreground">{label}</span>
              <Badge variant={active ? 'default' : 'secondary'} className="text-xs">
                {active ? 'Connected' : 'Not configured'}
              </Badge>
            </div>
          );
        })}
        <div className="flex items-center justify-between" data-testid="status-mock-mode">
          <span className="text-sm text-muted-foreground">Mode</span>
          <Badge variant={data?.mock_mode ? 'outline' : 'default'} className="text-xs">
            {data?.mock_mode ? 'Mock / Demo' : 'Live'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function LiveFeed() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io('/', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('sensor_update', (payload: Record<string, unknown>) => {
      const event: LiveEvent = {
        id: `${Date.now()}-${Math.random()}`,
        received_at: new Date().toISOString(),
        payload,
      };
      setEvents((prev) => [event, ...prev].slice(0, 50));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <Card data-testid="card-live-feed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className={`h-5 w-5 ${connected ? 'text-green-500 animate-pulse' : 'text-muted-foreground'}`} />
            <CardTitle className="text-base">Live Telemetry Feed</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={connected ? 'default' : 'secondary'}
              className="text-xs"
              data-testid="status-websocket"
            >
              {connected ? 'Connected' : 'Disconnected'}
            </Badge>
            {events.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEvents([])}
                className="h-7 text-xs"
                data-testid="button-clear-feed"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
        <CardDescription>Real-time events from devices via WebSocket</CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Radio className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Waiting for device data…</p>
            <p className="text-xs mt-1">Events appear here as IoT devices push readings</p>
          </div>
        ) : (
          <ScrollArea className="h-72">
            <div className="space-y-2 pr-2">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="bg-muted/50 rounded-lg p-3 text-xs font-mono border border-border/50"
                  data-testid={`event-live-${ev.id}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-green-600 dark:text-green-400 font-semibold">sensor_update</span>
                    <span className="text-muted-foreground">{timeAgo(ev.received_at)}</span>
                  </div>
                  <pre className="text-muted-foreground overflow-x-auto whitespace-pre-wrap break-all">
                    {JSON.stringify(ev.payload, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function AccessLogCard() {
  const { data: logs = [], isLoading, refetch, isFetching } = useQuery<AccessLogEntry[]>({
    queryKey: ['/api/network/logs'],
    queryFn: async () => {
      const r = await fetch('/api/network/logs', { headers: getAuthHeaders() });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    refetchInterval: 15_000,
  });

  return (
    <Card data-testid="card-access-log">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">API Access Log</CardTitle>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => refetch()}
            disabled={isFetching}
            data-testid="button-refresh-logs"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription>Recent API requests logged to api_access.log</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No log entries yet</p>
        ) : (
          <ScrollArea className="h-72">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b">
                  <th className="text-left pb-2 font-medium">Time</th>
                  <th className="text-left pb-2 font-medium">Method</th>
                  <th className="text-left pb-2 font-medium">Endpoint</th>
                  <th className="text-left pb-2 font-medium">Status</th>
                  <th className="text-right pb-2 font-medium">ms</th>
                  <th className="text-left pb-2 font-medium pl-2">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-border/30 hover:bg-muted/30" data-testid={`row-log-${log.id}`}>
                    <td className="py-1.5 pr-2 font-mono text-muted-foreground whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-1.5 pr-2 font-semibold">{log.method}</td>
                    <td className="py-1.5 pr-2 font-mono truncate max-w-[180px]">{log.endpoint}</td>
                    <td className={`py-1.5 pr-2 font-bold ${statusColor(log.status_code)}`}>
                      {log.status_code}
                    </td>
                    <td className="py-1.5 text-right text-muted-foreground">{log.duration_ms}</td>
                    <td className="py-1.5 pl-2 font-mono text-muted-foreground truncate max-w-[100px]">{log.client_ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

const apiBase = typeof window !== 'undefined' ? window.location.origin : 'https://your-app.replit.app';

const curlTelemetry = `# POST to /api/telemetry using X-API-Key (device key)
curl -X POST ${apiBase}/api/telemetry \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_DEVICE_KEY_HERE" \\
  -d '{
    "tank_id": "tank-1",
    "timestamp": "${new Date().toISOString()}",
    "water_quality": {
      "ph": 7.4,
      "do_mg_l": 7.1,
      "temp_c": 28.5,
      "salinity_ppt": 15.0
    },
    "filter": {
      "dp_kpa": 12.3,
      "status": "normal"
    },
    "system": {
      "demo_mode": false,
      "firmware_version": "1.2.0"
    }
  }'`;

const curlIngest = `# POST to /api/ingest using X-Device-Key (legacy flat format)
curl -X POST ${apiBase}/api/ingest \\
  -H "Content-Type: application/json" \\
  -H "X-Device-Key: YOUR_DEVICE_KEY_HERE" \\
  -d '{
    "pond_id": 1,
    "temperature": 79.5,
    "ph": 7.4,
    "dissolved_oxygen": 7.1,
    "ammonia": 0.02,
    "salinity": 15.0,
    "turbidity": 8.0
  }'`;

const curlHeartbeat = `# GET heartbeat — verify connectivity
curl ${apiBase}/api/heartbeat`;

const jsWebSocket = `// JavaScript — connect and listen for real-time sensor updates
import { io } from 'socket.io-client';

const socket = io('${apiBase}', {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
});

socket.on('connect', () => console.log('Connected:', socket.id));

// Subscribe to a specific tank channel
socket.emit('tank_join', 'tank-1');

// Listen for updates
socket.on('sensor_update', (data) => {
  console.log('New reading:', data);
});`;

export default function NetworkPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Network</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Connectivity status, live telemetry feed, API access logs, and integration examples
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <HeartbeatCard />
        <SystemInfoCard />
      </div>

      <LiveFeed />

      <AccessLogCard />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">API Integration Examples</CardTitle>
          </div>
          <CardDescription>
            Use your device key from the Settings → Devices tab to authenticate requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="telemetry">
            <TabsList className="h-8 text-xs">
              <TabsTrigger value="telemetry" className="text-xs">POST /telemetry</TabsTrigger>
              <TabsTrigger value="ingest" className="text-xs">POST /ingest</TabsTrigger>
              <TabsTrigger value="heartbeat" className="text-xs">GET /heartbeat</TabsTrigger>
              <TabsTrigger value="websocket" className="text-xs">WebSocket</TabsTrigger>
            </TabsList>
            <TabsContent value="telemetry" className="mt-3">
              <p className="text-xs text-muted-foreground mb-2">
                Structured telemetry with nested water quality, filter, and system fields.
                Uses <code className="bg-muted px-1 rounded">X-API-Key</code> header.
                Validates pH (0–14), DO (positive), temp (−10–50 °C).
              </p>
              <CodeBlock code={curlTelemetry} />
            </TabsContent>
            <TabsContent value="ingest" className="mt-3">
              <p className="text-xs text-muted-foreground mb-2">
                Legacy flat-field format for Arduino / ESP devices.
                Uses <code className="bg-muted px-1 rounded">X-Device-Key</code> header.
              </p>
              <CodeBlock code={curlIngest} />
            </TabsContent>
            <TabsContent value="heartbeat" className="mt-3">
              <p className="text-xs text-muted-foreground mb-2">
                Simple connectivity check — returns{' '}
                <code className="bg-muted px-1 rounded">{"{ status: 'alive', timestamp }"}</code>.
                No authentication required.
              </p>
              <CodeBlock code={curlHeartbeat} />
            </TabsContent>
            <TabsContent value="websocket" className="mt-3">
              <p className="text-xs text-muted-foreground mb-2">
                Connect via Socket.IO to receive real-time sensor updates.
                Join a tank channel with <code className="bg-muted px-1 rounded">tank_join</code> or
                listen globally on <code className="bg-muted px-1 rounded">sensor_update</code>.
              </p>
              <CodeBlock code={jsWebSocket} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
