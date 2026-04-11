export interface SensorReading {
  id: string;
  pond_id: number;
  timestamp: string;
  temperature: number;      // °F
  ph: number;               // 0–14
  dissolved_oxygen: number;  // mg/L
  ammonia: number;           // ppm
  salinity: number;          // ppt
  turbidity: number;         // NTU
}

export interface PondThresholds {
  temperature: { min: number; max: number };
  ph: { min: number; max: number };
  dissolved_oxygen: { min: number; max: number };
  ammonia: { max: number };
  salinity: { min: number; max: number };
  turbidity: { max: number };
}

export interface Pond {
  id: number;
  name: string;
  location: string;
  status: 'healthy' | 'warning' | 'critical';
  camera_stream_url?: string;
  thresholds: PondThresholds;
}

export interface Alert {
  id: string;
  pond_id: number;
  type: 'warning' | 'critical';
  parameter: string;
  message: string;
  value: number;
  threshold: number;
  timestamp: string;
  acknowledged: boolean;
}

export interface ManualEntry {
  pond_id: number;
  temperature?: number;
  ph?: number;
  dissolved_oxygen?: number;
  ammonia?: number;
  salinity?: number;
  turbidity?: number;
  notes?: string;
  timestamp: string;
}

export type UserRole = 'owner' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface Device {
  id: string;
  name: string;
  type: 'arduino' | 'raspberry_pi';
  pond_id: number;
  key?: string;        // Only present immediately after creation
  key_preview: string;
  created_at: string;
  last_seen: string | null;
  last_reading: Record<string, number> | null;
}

export interface NotificationPreferences {
  emailAlerts: boolean;
  smsAlerts: boolean;
  criticalOnly: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}
