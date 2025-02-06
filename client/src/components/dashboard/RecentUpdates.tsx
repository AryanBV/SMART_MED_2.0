// File: client/src/components/dashboard/RecentUpdates.tsx

import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardUpdate } from '@/interfaces/dashboard';
import { FileText, Pill, Calendar, Activity } from 'lucide-react';

interface RecentUpdatesProps {
  updates: DashboardUpdate[];
}

export const RecentUpdates = ({ updates }: RecentUpdatesProps) => {
  const getUpdateIcon = (type: DashboardUpdate['type']) => {
    switch (type) {
      case 'document':
        return <FileText className="w-4 h-4" />;
      case 'medication':
        return <Pill className="w-4 h-4" />;
      case 'appointment':
        return <Calendar className="w-4 h-4" />;
      case 'metric':
        return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Updates</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {updates.map((update) => (
              <div 
                key={update.id} 
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5"
              >
                <div className="p-2 rounded-full bg-primary/10">
                  {getUpdateIcon(update.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{update.memberName}</p>
                  <p className="text-sm text-muted-foreground">
                    {update.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(update.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};