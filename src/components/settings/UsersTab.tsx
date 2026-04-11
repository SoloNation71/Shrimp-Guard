import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePersistedState } from '@/hooks/usePersistedState';
import type { User, UserRole } from '@/types';

const INITIAL_USERS: User[] = [
  { id: '1', email: 'owner@shrimpguard.com', name: 'Jake Morrison', role: 'owner' },
  { id: '2', email: 'viewer@shrimpguard.com', name: 'Sarah Chen', role: 'viewer' },
];

export function UsersTab() {
  const [users, setUsers] = usePersistedState<User[]>('shrimpguard:users', INITIAL_USERS);
  const [showInvite, setShowInvite] = useState(false);
  const [invite, setInvite] = useState({ email: '', name: '', role: 'viewer' as UserRole });

  const addUser = () => {
    if (!invite.email.trim() || !invite.name.trim()) {
      toast.error('Name and email are required');
      return;
    }
    if (!invite.email.includes('@')) {
      toast.error('Enter a valid email address');
      return;
    }
    if (users.some((u) => u.email.toLowerCase() === invite.email.toLowerCase())) {
      toast.error('A user with that email already exists');
      return;
    }
    setUsers((prev) => [...prev, { id: String(Date.now()), ...invite }]);
    setInvite({ email: '', name: '', role: 'viewer' });
    setShowInvite(false);
    toast.success(`Invited ${invite.name} as ${invite.role}`);
  };

  const removeUser = (id: string) => {
    if (id === '1') {
      toast.error("Can't remove the primary owner");
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
    toast.success('User removed');
  };

  const updateRole = (id: string, role: UserRole) => {
    if (id === '1') {
      toast.error("Can't change the primary owner's role");
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
    toast.success('Role updated');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">User Management</h2>
        <Button size="sm" onClick={() => setShowInvite(!showInvite)} data-testid="button-invite-user">
          <UserPlus className="h-4 w-4 mr-1" /> Invite User
        </Button>
      </div>

      {showInvite && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Name</Label>
                <Input
                  data-testid="input-invite-name"
                  value={invite.name}
                  onChange={(e) => setInvite({ ...invite, name: e.target.value })}
                  placeholder="Full name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  data-testid="input-invite-email"
                  type="email"
                  value={invite.email}
                  onChange={(e) => setInvite({ ...invite, email: e.target.value })}
                  placeholder="user@example.com"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Role</Label>
              <Select
                value={invite.role}
                onValueChange={(v: UserRole) => setInvite({ ...invite, role: v })}
              >
                <SelectTrigger className="mt-1" data-testid="select-invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={addUser} data-testid="button-confirm-invite">
                Send Invite
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowInvite(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {users.map((user) => (
        <Card key={user.id}>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium text-sm text-foreground" data-testid={`text-user-name-${user.id}`}>
                {user.name}
              </p>
              <p className="text-xs text-muted-foreground" data-testid={`text-user-email-${user.id}`}>
                {user.email}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={user.role}
                onValueChange={(v: UserRole) => updateRole(user.id, v)}
              >
                <SelectTrigger className="w-24 h-8 text-xs" data-testid={`select-user-role-${user.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removeUser(user.id)}
                disabled={user.id === '1'}
                data-testid={`button-remove-user-${user.id}`}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
