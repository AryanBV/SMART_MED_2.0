// src/components/family-tree/ValidationMessage.tsx
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ValidationMessageProps {
  message: string;
  isValid: boolean;
}

export function ValidationMessage({ message, isValid }: ValidationMessageProps) {
  if (!message) return null;

  return (
    <Alert variant={isValid ? "default" : "destructive"} className="absolute bottom-4 left-4 w-auto">
      <div className="flex items-center gap-2">
        {isValid ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <AlertCircle className="h-4 w-4" />
        )}
        <AlertDescription>{message}</AlertDescription>
      </div>
    </Alert>
  );
}