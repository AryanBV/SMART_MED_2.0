// src/lib/error-utils.ts
import { AxiosError } from 'axios';
import { toast } from '@/components/ui/use-toast';

interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

export const handleApiError = (error: unknown) => {
  let errorMessage = 'An unexpected error occurred';
  let errorDetails: string[] = [];

  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    
    if (data?.message) {
      errorMessage = data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Handle validation errors if present
    if (data?.errors) {
      errorDetails = Object.values(data.errors).flat();
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  // Show toast notification
  toast({
    variant: "destructive",
    title: "Error",
    description: errorMessage,
    duration: 5000, // 5 seconds
  });

  // If there are validation errors, show them in separate toasts
  if (errorDetails.length > 0) {
    errorDetails.forEach(detail => {
      toast({
        variant: "destructive",
        description: detail,
        duration: 5000,
      });
    });
  }

  console.error('API Error:', errorMessage, error);
  return errorMessage;
};