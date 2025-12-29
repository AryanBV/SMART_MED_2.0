// src/utils/error.ts
import { isAxiosError } from 'axios';

export const handleApiError = (error: unknown): Error => {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    return new Error(message);
  }
  return error instanceof Error ? error : new Error('An unexpected error occurred');
};