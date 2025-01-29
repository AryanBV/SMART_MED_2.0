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
      const errorData = error.response?.data as AuthError;
      const message = errorData?.message || 'An error occurred';
      return new Error(message);
    }
    return error;
  }
}

export type { LoginCredentials, RegisterCredentials, AuthResponse };