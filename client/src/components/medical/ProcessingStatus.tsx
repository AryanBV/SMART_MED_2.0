// Path: /client/src/components/medical/ProcessingStatus.tsx


import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface ProcessingStatusProps {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  fileName?: string;
  error?: string;
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  status,
  progress,
  fileName,
  error
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">
              {fileName ? `Processing ${fileName}` : 'Processing Document'}
            </span>
          </div>
          <Badge variant={status}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>

        <Progress value={progress} className="w-full" />
        
        <div className="text-sm text-gray-500">
          {status === 'processing' && `${progress}% complete`}
          {status === 'completed' && 'Document processed successfully'}
          {status === 'failed' && (
            <div className="text-red-500">
              {error || 'Failed to process document'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProcessingStatus;