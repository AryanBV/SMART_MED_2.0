import { api } from '@/config/axios';
import { isAxiosError } from 'axios';
import { LoginCredentials, RegisterCredentials, AuthResponse } from './authTypes';

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/api/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/api/auth/register', credentials);
      return response.data;
    } catch (error) {
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

  static async validateToken(): Promise<AuthResponse> {
    try {
      const response = await api.get<AuthResponse>('/api/auth/validate');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private static handleError(error: any): Error {
    if (isAxiosError(error)) {
      const message = error.response?.data?.message || 'An error occurred';
      return new Error(message);
    }
    return error;
  }
}

export { LoginCredentials };