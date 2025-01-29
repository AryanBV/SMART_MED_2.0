// src/lib/error-utils.ts
import { AxiosError } from 'axios';
import { toast } from '@/components/ui/use-toast';

interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

export const handleApiError = (error: unknown) => {
  let errorMessage = 'An unexpected error occurred';
  
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    console.log('Error response data:', data); // For debugging

    if (typeof data === 'object' && data !== null) {
      errorMessage = data.message || error.message;
      if (data.error) {
        console.error('Detailed error:', data.error);
      }
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  toast({
    variant: "destructive",
    title: "Error",
    description: errorMessage,
  });

  return errorMessage;
};