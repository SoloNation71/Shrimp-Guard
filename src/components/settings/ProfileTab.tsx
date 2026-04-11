import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const PROFILE_KEY = 'shrimpguard:profile';

export function ProfileTab() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Seed from persisted storage first, then fall back to user context
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PROFILE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setName(parsed.name ?? user?.name ?? '');
        setEmail(parsed.email ?? user?.email ?? '');
        return;
      }
    } catch {}
    setName(user?.name ?? '');
    setEmail(user?.email ?? '');
  }, [user?.name, user?.email]);

  const handleChange = (field: 'name' | 'email', val: string) => {
    if (field === 'name') setName(val);
    else setEmail(val);
    setDirty(true);
  };

  const save = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      toast.error('Valid email is required');
      return;
    }

    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));

    // Persist to localStorage
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ name: name.trim(), email: email.trim() }));

    // Update auth context so the header reflects the new name immediately
    updateUser({ name: name.trim(), email: email.trim() });

    setSaving(false);
    setDirty(false);
    toast.success('Profile saved');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your Profile</CardTitle>
        <CardDescription>Update your account information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="profile-name">Name</Label>
          <Input
            id="profile-name"
            data-testid="input-profile-name"
            value={name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="profile-email">Email</Label>
          <Input
            id="profile-email"
            data-testid="input-profile-email"
            type="email"
            value={email}
            onChange={(e) => handleChange('email', e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Role</Label>
          <Input value={user?.role ?? ''} disabled className="mt-1 capitalize" />
        </div>
        <Button
          onClick={save}
          className="gradient-ocean"
          disabled={saving || !dirty}
          data-testid="button-save-profile"
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
          ) : (
            'Save Changes'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
