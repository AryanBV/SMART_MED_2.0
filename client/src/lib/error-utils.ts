import { AxiosError } from 'axios';

interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

export const handleApiError = (error: unknown) => {
  let errorMessage = 'An unexpected error occurred';

  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    
    if (data?.message) {
      errorMessage = data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    // You can add toast notification here once we set up the toast component
    console.error(errorMessage);
  } else if (error instanceof Error) {
    errorMessage = error.message;
    console.error(errorMessage);
  }

  return errorMessage;
};
