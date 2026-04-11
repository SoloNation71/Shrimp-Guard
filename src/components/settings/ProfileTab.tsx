import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export function ProfileTab() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');

  const save = () => {
    if (!name.trim() || !email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    // In production this would call the API
    toast.success('Profile updated');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your Profile</CardTitle>
        <CardDescription>Update your account information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Name</Label>
          <Input value={name} onChange={e => setName(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Role</Label>
          <Input value={user?.role ?? ''} disabled className="mt-1 capitalize" />
        </div>
        <Button onClick={save} className="gradient-ocean">Save Changes</Button>
      </CardContent>
    </Card>
  );
}
