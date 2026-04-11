import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { usePersistedState } from '@/hooks/usePersistedState';
import type { NotificationPreferences } from '@/types';

const DEFAULT_PREFS: NotificationPreferences = {
  emailAlerts: true,
  smsAlerts: false,
  criticalOnly: false,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '06:00',
};

export function NotificationsTab() {
  const [prefs, setPrefs] = usePersistedState<NotificationPreferences>(
    'shrimpguard:notifications',
    DEFAULT_PREFS
  );
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const update = <K extends keyof NotificationPreferences>(key: K, value: NotificationPreferences[K]) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    // usePersistedState already wrote to localStorage on each update.
    // In production this would also POST to /api/preferences.
    setSaving(false);
    setDirty(false);
    toast.success('Notification preferences saved');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Notification Preferences</CardTitle>
        <CardDescription>Configure how and when you receive alerts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <Label>Email Alerts</Label>
            <p className="text-xs text-muted-foreground">Receive alerts via email</p>
          </div>
          <Switch
            data-testid="switch-email-alerts"
            checked={prefs.emailAlerts}
            onCheckedChange={(v) => update('emailAlerts', v)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>SMS Alerts</Label>
            <p className="text-xs text-muted-foreground">Receive alerts via text message</p>
          </div>
          <Switch
            data-testid="switch-sms-alerts"
            checked={prefs.smsAlerts}
            onCheckedChange={(v) => update('smsAlerts', v)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Critical Only</Label>
            <p className="text-xs text-muted-foreground">Only notify for critical-level alerts</p>
          </div>
          <Switch
            data-testid="switch-critical-only"
            checked={prefs.criticalOnly}
            onCheckedChange={(v) => update('criticalOnly', v)}
          />
        </div>

        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Quiet Hours</Label>
              <p className="text-xs text-muted-foreground">Suppress non-critical alerts during these hours</p>
            </div>
            <Switch
              data-testid="switch-quiet-hours"
              checked={prefs.quietHoursEnabled}
              onCheckedChange={(v) => update('quietHoursEnabled', v)}
            />
          </div>
          {prefs.quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Start</Label>
                <Input
                  type="time"
                  data-testid="input-quiet-start"
                  value={prefs.quietHoursStart}
                  onChange={(e) => update('quietHoursStart', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">End</Label>
                <Input
                  type="time"
                  data-testid="input-quiet-end"
                  value={prefs.quietHoursEnd}
                  onChange={(e) => update('quietHoursEnd', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </div>

        <Button
          onClick={save}
          className="gradient-ocean"
          disabled={saving || !dirty}
          data-testid="button-save-notifications"
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
          ) : (
            'Save Preferences'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
