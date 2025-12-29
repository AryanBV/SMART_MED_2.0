// File: /client/src/components/settings/sections/AppSettings.tsx

import React from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const AppSettings: React.FC = () => {
    const { 
      theme, 
      language, 
      notifications, 
      setTheme, 
      setLanguage, 
      setNotifications 
    } = useSettingsStore();
    const { toast } = useToast();
  
    const handleSave = () => {
      toast({
        title: 'Settings Saved',
        description: 'Application settings have been updated successfully.',
      });
    };

  const handleExportData = () => {
    toast({
      title: 'Data Export',
      description: 'Your data export has been initiated. You will receive an email when it\'s ready.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>App Settings</CardTitle>
        <CardDescription>
          Customize your application preferences and export your data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Appearance */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Appearance</h3>
          <div className="space-y-2">
            <label className="text-sm font-medium">Theme</label>
            <Select
              value={theme}
              onValueChange={setTheme}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Language */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Language & Region</h3>
          <div className="space-y-2">
            <label className="text-sm font-medium">Language</label>
            <Select
              value={language}
              onValueChange={setLanguage}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Notifications</h3>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <div className="text-base">Push Notifications</div>
              <div className="text-sm text-muted-foreground">
                Receive notifications about important updates
              </div>
            </div>
            <Switch
                checked={notifications.push}
                onCheckedChange={(checked: boolean) => setNotifications('push', checked)}
            />
          </div>
        </div>

        {/* Data Management */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Data Management</h3>
          <div className="flex flex-col gap-4">
            <Button
              variant="outline"
              onClick={handleExportData}
            >
              Export All Data
            </Button>
            <p className="text-sm text-muted-foreground">
              Download a copy of all your data in JSON format
            </p>
          </div>
        </div>

        <div className="flex justify-between">
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppSettings;