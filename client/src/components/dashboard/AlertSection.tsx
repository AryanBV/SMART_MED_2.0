// File: client/src/components/dashboard/AlertSection.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardAlert } from '@/interfaces/dashboard';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface AlertSectionProps {
  alerts: DashboardAlert[];
  onAcknowledge?: (alertId: number) => void;
}

export const AlertSection = ({ alerts, onAcknowledge }: AlertSectionProps) => {
  const getAlertIcon = (type: DashboardAlert['type']) => {
    switch (type) {
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`
                flex items-start gap-3 p-3 rounded-lg
                ${alert.type === 'critical' ? 'bg-destructive/10' : 
                  alert.type === 'warning' ? 'bg-yellow-50' : 'bg-blue-50'}
              `}
            >
              <div className="pt-1">{getAlertIcon(alert.type)}</div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{alert.memberName}</p>
                <p className="text-sm">{alert.message}</p>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                  {!alert.acknowledged && onAcknowledge && (
                    <button
                      onClick={() => onAcknowledge(alert.id)}
                      className="text-xs text-primary hover:underline"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};