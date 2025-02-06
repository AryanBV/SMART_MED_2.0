// Path: C:\Project\SMART_MED_2.0\client\src\components\medical\DocumentProcessingStatus.tsx

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DocumentProcessingStatusProps {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  error?: string;
}

const DocumentProcessingStatus: React.FC<DocumentProcessingStatusProps> = ({
  status,
  progress = 0,
  error
}) => {
  const getStatusDisplay = () => {
    switch (status) {
      case 'pending':
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin text-blue-500" />,
          message: 'Waiting to process...',
          variant: 'default' as const
        };
      case 'processing':
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin text-blue-500" />,
          message: 'Processing document...',
          variant: 'default' as const
        };
      case 'completed':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
          message: 'Processing completed',
          variant: 'default' as const
        };
      case 'failed':
        return {
          icon: <AlertCircle className="w-4 h-4 text-red-500" />,
          message: error || 'Processing failed',
          variant: 'destructive' as const
        };
      default:
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          message: 'Unknown status',
          variant: 'default' as const
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="space-y-2">
      <Alert variant={statusDisplay.variant}>
        <div className="flex items-center gap-2">
          {statusDisplay.icon}
          <AlertDescription>{statusDisplay.message}</AlertDescription>
        </div>
      </Alert>
      {status === 'processing' && (
        <Progress 
          value={progress} 
          className="h-2"
          indicatorClassName={progress === 100 ? 'bg-green-500' : undefined}
        />
      )}
    </div>
  );
};

export default DocumentProcessingStatus;