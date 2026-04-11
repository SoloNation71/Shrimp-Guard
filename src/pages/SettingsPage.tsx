import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PondSettingsTab } from '@/components/settings/PondSettingsTab';
import { NotificationsTab } from '@/components/settings/NotificationsTab';
import { UsersTab } from '@/components/settings/UsersTab';
import { ProfileTab } from '@/components/settings/ProfileTab';

export default function SettingsPage() {
  const { user } = useAuth();

  if (user?.role !== 'owner') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage ponds, thresholds, notifications, and users</p>
      </div>

      <Tabs defaultValue="ponds" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="ponds">Ponds</TabsTrigger>
          <TabsTrigger value="notifications">Alerts</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="ponds">
          <PondSettingsTab />
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
