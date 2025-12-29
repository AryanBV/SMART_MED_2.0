// File: /client/src/components/settings/sections/FamilySettings.tsx

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

const FamilySettings: React.FC = () => {
  const { toast } = useToast();
  const { familySettings, setFamilySettings } = useSettingsStore();

  const handleSave = () => {
    // Here you could add API call to save settings to backend
    toast({
      title: 'Settings Saved',
      description: 'Family settings have been updated successfully.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Family Settings</CardTitle>
        <CardDescription>
          Manage your family sharing preferences and access controls
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sharing Preferences */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Sharing Preferences</h3>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <div className="text-base">Automatic Document Sharing</div>
              <div className="text-sm text-muted-foreground">
                Automatically share new documents with family members
              </div>
            </div>
            <Switch
              checked={familySettings.autoShare}
              onCheckedChange={(checked) => 
                setFamilySettings({ autoShare: checked })
              }
            />
          </div>
        </div>

        {/* Access Control */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Access Control</h3>
          <div className="space-y-2">
            <label className="text-sm font-medium">Default Access Level</label>
            <Select
              value={familySettings.defaultAccess}
              onValueChange={(value) => 
                setFamilySettings({ 
                  defaultAccess: value as 'view' | 'edit' | 'admin' 
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select default access level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">View Only</SelectItem>
                <SelectItem value="edit">Edit Access</SelectItem>
                <SelectItem value="admin">Full Access</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Set the default access level for new family members
            </p>
          </div>
        </div>

        <Button onClick={handleSave}>Save Settings</Button>
      </CardContent>
    </Card>
  );
};

export default FamilySettings;