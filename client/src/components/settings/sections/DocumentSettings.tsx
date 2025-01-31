// File: /client/src/components/settings/sections/DocumentSettings.tsx

import React from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const DocumentSettings: React.FC = () => {
  const { toast } = useToast();
  const { documentSettings, setDocumentSettings } = useSettingsStore();

  const handleSave = () => {
    // Here you could add API call to save settings to backend
    toast({
      title: 'Settings Saved',
      description: 'Document settings have been updated successfully.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Settings</CardTitle>
        <CardDescription>
          Configure your document processing and storage preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* OCR Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">OCR Settings</h3>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <div className="text-base">Automatic OCR Processing</div>
              <div className="text-sm text-muted-foreground">
                Automatically extract text from uploaded documents
              </div>
            </div>
            <Switch
              checked={documentSettings.autoOcr}
              onCheckedChange={(checked) => 
                setDocumentSettings({ autoOcr: checked })
              }
            />
          </div>
        </div>

        {/* Storage Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Storage Settings</h3>
          <div className="space-y-4">
            <div className="text-sm font-medium">Image Compression Level</div>
            <Slider
              value={[documentSettings.compressionLevel]}
              onValueChange={(value) => 
                setDocumentSettings({ compressionLevel: value[0] })
              }
              max={100}
              step={1}
            />
            <div className="text-sm text-muted-foreground">
              Current level: {documentSettings.compressionLevel}%
            </div>
          </div>
        </div>

        <Button onClick={handleSave}>Save Settings</Button>
      </CardContent>
    </Card>
  );
};

export default DocumentSettings;