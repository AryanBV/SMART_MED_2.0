// src/services/auth.ts
import { api } from '@/config/axios';
import { isAxiosError } from 'axios';
import { 
  LoginCredentials, 
  RegisterCredentials, 
  AuthResponse
} from '@/interfaces/auth';

import { API_ENDPOINTS } from '@/constants/api';

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<{status: string, data: any}>(API_ENDPOINTS.AUTH.LOGIN, credentials);
      return {
        user: response.data.data.user,
        token: response.data.data.token,
        message: response.data.message
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<{status: string, data: any}>(API_ENDPOINTS.AUTH.REGISTER, credentials);
      return {
        user: response.data.data.user,
        token: response.data.data.token,
        message: response.data.message
      };
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
      console.log('Making token validation request...');
      const response = await api.get<{status: string, data: {user: any}}>('/api/auth/validate');
      console.log('Raw validation response:', response.data);
      
      if (!response.data || !response.data.data || !response.data.data.user) {
        console.log('Invalid response structure, clearing token and returning null');
        localStorage.removeItem('token');
        return null;
      }
      
      const user = response.data.data.user;
      if (!user.id || !user.email) {
        console.log('Invalid user data, clearing token and returning null');
        localStorage.removeItem('token');
        return null;
      }
      
      // Transform the server response to match our AuthResponse interface
      const authResponse = {
        user: response.data.data.user,
        token: '', // Token is already stored
        message: response.data.status
      } as AuthResponse;
      
      console.log('Transformed auth response:', authResponse);
      return authResponse;
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