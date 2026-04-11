import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PondSettingsTab } from '@/components/settings/PondSettingsTab';
import { NotificationsTab } from '@/components/settings/NotificationsTab';
import { UsersTab } from '@/components/settings/UsersTab';
import { ProfileTab } from '@/components/settings/ProfileTab';
import { DevicesTab } from '@/components/settings/DevicesTab';

export default function SettingsPage() {
  const { user } = useAuth();

  if (user?.role !== 'owner') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage ponds, IoT devices, notifications, and users
        </p>
      </div>

      <Tabs defaultValue="ponds" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 max-w-2xl">
          <TabsTrigger value="ponds" data-testid="tab-ponds">Ponds</TabsTrigger>
          <TabsTrigger value="devices" data-testid="tab-devices">Devices</TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">Alerts</TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
          <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="ponds">
          <PondSettingsTab />
        </TabsContent>
        <TabsContent value="devices">
          <DevicesTab />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>
        <TabsContent value="users">
          <UsersTab />
        </TabsContent>
        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
