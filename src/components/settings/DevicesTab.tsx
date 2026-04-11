import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Trash2, Copy, Wifi, Bluetooth, CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { usePonds } from '@/context/PondsContext';
import { getAuthHeaders } from '@/lib/apiClient';
import type { Device } from '@/types';

// Public URL for device code snippets (what hardware devices will hit)
const API_BASE = typeof window !== 'undefined'
  ? window.location.origin
  : 'http://localhost:5000';

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="relative mt-2">
      <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 text-xs overflow-x-auto whitespace-pre leading-relaxed">
        {code}
      </pre>
      <Button
        size="icon"
        variant="ghost"
        onClick={copy}
        className="absolute top-2 right-2 h-7 w-7 text-slate-300 hover:text-white"
      >
        {copied ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}

function CollapsibleSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border rounded-lg">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-left hover:bg-muted/50 transition-colors"
        data-testid={`toggle-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        {title}
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function arduinoCode(apiBase: string, key: string, pondId: number): string {
  return `// ShrimpGuard — Arduino / ESP8266 / ESP32 WiFi Sensor Node
// Board: NodeMCU (ESP8266) or ESP32 DevKit
// Libraries: ESP8266HTTPClient or HTTPClient (ESP32), ArduinoJson

#include <Arduino.h>
#ifdef ESP8266
  #include <ESP8266WiFi.h>
  #include <ESP8266HTTPClient.h>
#else
  #include <WiFi.h>
  #include <HTTPClient.h>
#endif
#include <ArduinoJson.h>

// ─── CONFIGURE THESE ──────────────────────────────────────────
const char* WIFI_SSID     = "YourWiFiSSID";
const char* WIFI_PASS     = "YourWiFiPassword";
const char* INGEST_URL    = "${apiBase}/api/ingest";
const char* DEVICE_KEY    = "${key}";
const int   POND_ID       = ${pondId};
const long  INTERVAL_MS   = 30000; // Send every 30 seconds
// ──────────────────────────────────────────────────────────────

// Replace with your actual sensor read functions
float readTemperatureF() { return 79.5; } // °F
float readPH()            { return 7.4;  }
float readDO()            { return 7.1;  } // mg/L
float readAmmonia()       { return 0.02; } // ppm
float readSalinity()      { return 15.0; } // ppt
float readTurbidity()     { return 8.0;  } // NTU

unsigned long lastSend = 0;

void setup() {
  Serial.begin(115200);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println(" Connected!");
}

void loop() {
  if (millis() - lastSend < INTERVAL_MS) return;
  lastSend = millis();

  if (WiFi.status() != WL_CONNECTED) { WiFi.reconnect(); return; }

  StaticJsonDocument<256> doc;
  doc["pond_id"]           = POND_ID;
  doc["temperature"]       = readTemperatureF();
  doc["ph"]                = readPH();
  doc["dissolved_oxygen"]  = readDO();
  doc["ammonia"]           = readAmmonia();
  doc["salinity"]          = readSalinity();
  doc["turbidity"]         = readTurbidity();

  String payload;
  serializeJson(doc, payload);

  HTTPClient http;
  WiFiClient client;
  http.begin(client, INGEST_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Key", DEVICE_KEY);

  int code = http.POST(payload);
  Serial.printf("[ingest] HTTP %d\\n", code);
  http.end();
}`;
}

function rpiWifiCode(apiBase: string, key: string, pondId: number): string {
  return `#!/usr/bin/env python3
# ShrimpGuard — Raspberry Pi WiFi Sensor Node
# Install: pip install requests

import time
import requests

INGEST_URL = "${apiBase}/api/ingest"
DEVICE_KEY = "${key}"
POND_ID    = ${pondId}
INTERVAL   = 30  # seconds

# ─── Replace with your actual sensor reads ────────────────────
# Examples: Adafruit Atlas Scientific pH, DS18B20 temp, etc.
def read_sensors():
    return {
        "pond_id":          POND_ID,
        "temperature":      79.5,   # °F
        "ph":               7.4,
        "dissolved_oxygen": 7.1,    # mg/L
        "ammonia":          0.02,   # ppm
        "salinity":         15.0,   # ppt
        "turbidity":        8.0,    # NTU
    }
# ──────────────────────────────────────────────────────────────

headers = {
    "Content-Type": "application/json",
    "X-Device-Key":  DEVICE_KEY,
}

while True:
    try:
        data = read_sensors()
        resp = requests.post(INGEST_URL, json=data, headers=headers, timeout=10)
        print(f"[ingest] {resp.status_code} — {resp.json()}")
    except Exception as e:
        print(f"[ingest] error: {e}")
    time.sleep(INTERVAL)`;
}

function bleGatewayCode(apiBase: string, key: string, pondId: number): string {
  return `#!/usr/bin/env python3
# ShrimpGuard — Raspberry Pi as Bluetooth BLE Gateway
# Pi reads sensor values from a BLE Arduino, then forwards to the cloud.
# Install: pip install bleak requests

import asyncio, requests
from bleak import BleakClient

# ─── CONFIGURE THESE ──────────────────────────────────────────
BLE_ADDRESS   = "AA:BB:CC:DD:EE:FF"   # MAC address of your Arduino BLE device
# Nordic UART Service characteristics (common on Arduino Nano 33 BLE Sense)
TX_CHAR_UUID  = "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"
INGEST_URL    = "${apiBase}/api/ingest"
DEVICE_KEY    = "${key}"
POND_ID       = ${pondId}
INTERVAL      = 30  # seconds between readings
# ──────────────────────────────────────────────────────────────

latest_data = {}

def notification_handler(sender, data):
    """Arduino sends: temp,ph,do,ammonia,salinity,turbidity as CSV bytes"""
    global latest_data
    try:
        vals = data.decode().strip().split(",")
        keys = ["temperature","ph","dissolved_oxygen","ammonia","salinity","turbidity"]
        latest_data = {k: float(v) for k, v in zip(keys, vals)}
        latest_data["pond_id"] = POND_ID
    except Exception as e:
        print(f"[ble] parse error: {e}")

async def ble_loop():
    headers = {"Content-Type": "application/json", "X-Device-Key": DEVICE_KEY}
    async with BleakClient(BLE_ADDRESS) as client:
        print(f"[ble] Connected to {BLE_ADDRESS}")
        await client.start_notify(TX_CHAR_UUID, notification_handler)
        while True:
            await asyncio.sleep(INTERVAL)
            if latest_data:
                try:
                    r = requests.post(INGEST_URL, json=latest_data, headers=headers, timeout=10)
                    print(f"[ingest] {r.status_code} — {r.json()}")
                except Exception as e:
                    print(f"[ingest] error: {e}")

asyncio.run(ble_loop())

# ──── Arduino BLE sketch (sends CSV every 5 seconds) ──────────
# #include <ArduinoBLE.h>
# BLEService svc("6E400001-B5A3-F393-E0A9-E50E24DCCA9E");
# BLEStringCharacteristic txChar("6E400003-B5A3-F393-E0A9-E50E24DCCA9E",
#                                 BLERead | BLENotify, 64);
# void setup() { BLE.begin(); svc.addCharacteristic(txChar);
#   BLE.addService(svc); BLE.advertise(); }
# void loop() {
#   String csv = String(readTempF())+","+readPH()+","+readDO()+
#                ","+readAmmonia()+","+readSalinity()+","+readTurbidity();
#   txChar.writeValue(csv); delay(5000);
# }`;
}

export function DevicesTab() {
  const { ponds } = usePonds();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [newDevice, setNewDevice] = useState({ name: '', type: 'raspberry_pi' as Device['type'], pond_id: '' });
  const [newKey, setNewKey] = useState<{ id: string; key: string; name: string } | null>(null);
  const [expandedSnippet, setExpandedSnippet] = useState<string | null>(null);

  const { data: devices = [], isLoading } = useQuery<Omit<Device, 'key'>[]>({
    queryKey: ['/api/devices'],
    queryFn: async () => {
      const r = await fetch('/api/devices', { headers: getAuthHeaders() });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    refetchInterval: 15_000,
  });

  const addMutation = useMutation({
    mutationFn: async (body: { name: string; type: string; pond_id: number }) => {
      const r = await fetch('/api/devices', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `HTTP ${r.status}`);
      }
      return r.json() as Promise<Device>;
    },
    onSuccess: (device) => {
      qc.invalidateQueries({ queryKey: ['/api/devices'] });
      setNewKey({ id: device.id, key: device.key!, name: device.name });
      setShowAdd(false);
      setNewDevice({ name: '', type: 'raspberry_pi', pond_id: '' });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/devices/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/devices'] });
      toast.success('Device removed');
    },
    onError: () => toast.error('Failed to remove device'),
  });

  const handleAdd = () => {
    if (!newDevice.name.trim()) return toast.error('Device name required');
    const pondId = Number(newDevice.pond_id);
    if (!pondId) return toast.error('Select a pond');
    addMutation.mutate({ name: newDevice.name.trim(), type: newDevice.type, pond_id: pondId });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">IoT Devices</h2>
          <p className="text-sm text-muted-foreground">Connect Raspberry Pi or Arduino sensors via WiFi or Bluetooth</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)} data-testid="button-add-device">
          <Plus className="h-4 w-4 mr-1" /> Register Device
        </Button>
      </div>

      {/* New key banner — shown once after device creation */}
      {newKey && (
        <Card className="border-green-400 bg-green-50 dark:bg-green-950">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-green-800 dark:text-green-200">
                  Device "{newKey.name}" registered — copy your API key now
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mb-2">
                  This key won't be shown again. Paste it into your device code below.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white dark:bg-black/30 border rounded px-3 py-1.5 text-sm font-mono break-all">
                    {newKey.key}
                  </code>
                  <Button
                    size="icon"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(newKey.key);
                      toast.success('Key copied');
                    }}
                    data-testid="button-copy-new-key"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 text-green-700"
              onClick={() => {
                setExpandedSnippet(newKey.id);
                setNewKey(null);
              }}
            >
              View code snippet →
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add device form */}
      {showAdd && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Register New Device</CardTitle>
            <CardDescription>An API key will be generated for the device to authenticate with ShrimpGuard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>Device Name</Label>
                <Input
                  data-testid="input-device-name"
                  value={newDevice.name}
                  onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                  placeholder="Pond Alpha Node 1"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={newDevice.type}
                  onValueChange={(v) => setNewDevice({ ...newDevice, type: v as Device['type'] })}
                >
                  <SelectTrigger className="mt-1" data-testid="select-device-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="raspberry_pi">Raspberry Pi</SelectItem>
                    <SelectItem value="arduino">Arduino / ESP8266 / ESP32</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Assigned Pond</Label>
                <Select
                  value={newDevice.pond_id}
                  onValueChange={(v) => setNewDevice({ ...newDevice, pond_id: v })}
                >
                  <SelectTrigger className="mt-1" data-testid="select-device-pond">
                    <SelectValue placeholder="Select pond" />
                  </SelectTrigger>
                  <SelectContent>
                    {ponds.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={addMutation.isPending}
                data-testid="button-confirm-add-device"
              >
                {addMutation.isPending ? 'Creating…' : 'Create & Get Key'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Device list */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && devices.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-muted-foreground">
            <Wifi className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No devices registered yet.</p>
            <p className="text-xs mt-1">Register your first Raspberry Pi or Arduino above.</p>
          </CardContent>
        </Card>
      )}

      {devices.map((device) => {
        const pond = ponds.find((p) => p.id === device.pond_id);
        const online = device.last_seen
          ? Date.now() - new Date(device.last_seen).getTime() < 5 * 60_000
          : false;
        const isExpanded = expandedSnippet === device.id;

        return (
          <Card key={device.id} data-testid={`card-device-${device.id}`}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0 p-2 rounded-full bg-muted">
                    {device.type === 'raspberry_pi' ? (
                      <Wifi className="h-4 w-4 text-primary" />
                    ) : (
                      <Bluetooth className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{device.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {device.type === 'raspberry_pi' ? 'Raspberry Pi' : 'Arduino / ESP'} &middot;{' '}
                      {pond?.name ?? `Pond ${device.pond_id}`}
                    </p>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">
                      Key: {device.key_preview}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant={online ? 'default' : 'secondary'}
                    className="text-xs"
                    data-testid={`status-device-${device.id}`}
                  >
                    {online ? (
                      <><CheckCircle2 className="h-3 w-3 mr-1" /> Online</>
                    ) : device.last_seen ? (
                      <><Clock className="h-3 w-3 mr-1" />{timeAgo(device.last_seen)}</>
                    ) : (
                      <><AlertCircle className="h-3 w-3 mr-1" /> Never seen</>
                    )}
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setExpandedSnippet(isExpanded ? null : device.id)}
                    className="h-8 w-8"
                    data-testid={`button-snippet-${device.id}`}
                    title="View code snippets"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    onClick={() => deleteMutation.mutate(device.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-device-${device.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {device.last_reading && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {Object.entries(device.last_reading)
                    .filter(([k]) => k !== 'pond_id')
                    .map(([k, v]) => (
                      <span key={k} className="text-xs bg-muted rounded px-2 py-0.5">
                        {k.replace('_', ' ')}: <span className="font-medium">{v}</span>
                      </span>
                    ))}
                </div>
              )}

              {/* Code snippets */}
              {isExpanded && (
                <div className="mt-4 border-t pt-4">
                  <Tabs defaultValue={device.type === 'raspberry_pi' ? 'rpi-wifi' : 'arduino'}>
                    <TabsList className="h-8 text-xs">
                      <TabsTrigger value="arduino" className="text-xs">Arduino WiFi</TabsTrigger>
                      <TabsTrigger value="rpi-wifi" className="text-xs">Pi WiFi</TabsTrigger>
                      <TabsTrigger value="rpi-ble" className="text-xs">Pi + BLE Bridge</TabsTrigger>
                    </TabsList>

                    <TabsContent value="arduino">
                      <p className="text-xs text-muted-foreground mt-2 mb-1">
                        Flash to ESP8266 / ESP32 with Arduino IDE. Requires{' '}
                        <code className="bg-muted px-1 rounded">ArduinoJson</code> and{' '}
                        <code className="bg-muted px-1 rounded">ESP8266HTTPClient</code> libraries.
                      </p>
                      <CodeBlock
                        code={arduinoCode(
                          API_BASE,
                          '••••••••  (your key was shown once — re-register if lost)',
                          device.pond_id
                        )}
                      />
                    </TabsContent>

                    <TabsContent value="rpi-wifi">
                      <p className="text-xs text-muted-foreground mt-2 mb-1">
                        Run on any Raspberry Pi with WiFi. Reads real sensors in{' '}
                        <code className="bg-muted px-1 rounded">read_sensors()</code> and POSTs
                        every 30 seconds.
                      </p>
                      <CodeBlock
                        code={rpiWifiCode(
                          API_BASE,
                          '••••••••  (your key was shown once — re-register if lost)',
                          device.pond_id
                        )}
                      />
                    </TabsContent>

                    <TabsContent value="rpi-ble">
                      <p className="text-xs text-muted-foreground mt-2 mb-1">
                        <strong>Bluetooth bridge:</strong> Pi reads BLE notifications from an
                        Arduino Nano 33 BLE Sense (or similar), then forwards to ShrimpGuard
                        over WiFi. Requires{' '}
                        <code className="bg-muted px-1 rounded">pip install bleak requests</code>.
                      </p>
                      <CodeBlock
                        code={bleGatewayCode(
                          API_BASE,
                          '••••••••  (your key was shown once — re-register if lost)',
                          device.pond_id
                        )}
                      />
                    </TabsContent>
                  </Tabs>

                  <div className="mt-3 space-y-2">
                    <CollapsibleSection title="API endpoint reference">
                      <div className="text-xs text-muted-foreground space-y-2 pt-1">
                        <p><strong>POST</strong> <code className="bg-muted px-1 rounded">{API_BASE}/api/ingest</code></p>
                        <p>Header: <code className="bg-muted px-1 rounded">X-Device-Key: &lt;your key&gt;</code></p>
                        <p>Body (JSON, all fields optional except pond_id):</p>
                        <CodeBlock code={`{
  "pond_id": ${device.pond_id},
  "temperature": 79.5,
  "ph": 7.4,
  "dissolved_oxygen": 7.1,
  "ammonia": 0.02,
  "salinity": 15.0,
  "turbidity": 8.0
}`} />
                      </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Wiring guide — common sensors">
                      <div className="text-xs text-muted-foreground space-y-1 pt-1">
                        <p><strong>Temperature:</strong> DS18B20 (OneWire) or PT100/RTD → ADC</p>
                        <p><strong>pH:</strong> Atlas Scientific EZO-PH via I²C or UART</p>
                        <p><strong>Dissolved O₂:</strong> Atlas Scientific EZO-DO via I²C</p>
                        <p><strong>Ammonia:</strong> Atlas Scientific EZO-NH3 via I²C</p>
                        <p><strong>Salinity / EC:</strong> Atlas Scientific EZO-EC via I²C</p>
                        <p><strong>Turbidity:</strong> SEN0189 analog → ADC pin</p>
                        <p className="pt-1">All Atlas Scientific probes share a single I²C bus — assign unique addresses (0x61–0x6A).</p>
                      </div>
                    </CollapsibleSection>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
