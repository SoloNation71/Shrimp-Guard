import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import type { NotificationPreferences } from '@/types';

export function NotificationsTab() {
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    emailAlerts: true,
    smsAlerts: false,
    criticalOnly: false,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '06:00',
  });

  const update = (key: keyof NotificationPreferences, value: any) => {
    setPrefs(prev => ({ ...prev, [key]: value }));
  };

  const save = () => {
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
          <Switch checked={prefs.emailAlerts} onCheckedChange={v => update('emailAlerts', v)} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>SMS Alerts</Label>
            <p className="text-xs text-muted-foreground">Receive alerts via text message</p>
          </div>
          <Switch checked={prefs.smsAlerts} onCheckedChange={v => update('smsAlerts', v)} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Critical Only</Label>
            <p className="text-xs text-muted-foreground">Only notify for critical-level alerts</p>
          </div>
          <Switch checked={prefs.criticalOnly} onCheckedChange={v => update('criticalOnly', v)} />
        </div>

        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Quiet Hours</Label>
              <p className="text-xs text-muted-foreground">Suppress non-critical alerts during these hours</p>
            </div>
            <Switch checked={prefs.quietHoursEnabled} onCheckedChange={v => update('quietHoursEnabled', v)} />
          </div>
          {prefs.quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Start</Label>
                <Input type="time" value={prefs.quietHoursStart} onChange={e => update('quietHoursStart', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">End</Label>
                <Input type="time" value={prefs.quietHoursEnd} onChange={e => update('quietHoursEnd', e.target.value)} className="mt-1" />
              </div>
            </div>
          )}
        </div>

        <Button onClick={save} className="gradient-ocean">Save Preferences</Button>
      </CardContent>
    </Card>
  );
}
