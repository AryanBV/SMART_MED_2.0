// src/services/auth.ts
import { api } from '@/config/axios';
import { isAxiosError } from 'axios';
import { 
  LoginCredentials, 
  RegisterCredentials, 
  AuthResponse, 
  AuthError
} from '@/interfaces/auth';

import { API_ENDPOINTS } from '@/constants/api';

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, credentials);
      return response.data;
    } catch (error) {
      console.error('Registration error details:', error);
      throw this.handleError(error);
    }
  }

  static async logout(): Promise<void> {
    try {
      await api.post('/api/auth/logout');
      localStorage.removeItem('token');
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async validateToken(): Promise<AuthResponse | null> {
    try {
      const response = await api.get<AuthResponse>('/api/auth/validate');
      return response.data;
    } catch (error) {
      console.error('Token validation failed:', error);
      localStorage.removeItem('token'); // Clear invalid token
      throw error; // Propagate error
    }
  }
  

  private static handleError(error: any): Error {
    if (isAxiosError(error)) {
        const errorData = error.response?.data;
        const message = errorData?.message || error.response?.data || error.message || 'An error occurred';
        console.error('Auth error details:', {
            status: error.response?.status,
            data: error.response?.data,
            message: message
        });
        return new Error(message);
    }
    console.error('Non-Axios error:', error);
    return error instanceof Error ? error : new Error('An unknown error occurred');
  }
}

export type { LoginCredentials, RegisterCredentials, AuthResponse };