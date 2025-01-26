// src/services/auth.ts
import { api } from '@/config/axios';  // Change this line to import api instead of axios
import { isAxiosError } from 'axios';
import { LoginCredentials, RegisterCredentials, AuthResponse } from '@/interfaces/auth';

export class AuthService {
  private static API_ROUTES = {
    LOGIN: '/api/auth/login',        // Add /api prefix
    REGISTER: '/api/auth/register',  // Add /api prefix
    LOGOUT: '/api/auth/logout',      // Add /api prefix
    VALIDATE: '/api/auth/validate'   // Add /api prefix
  };

  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>(this.API_ROUTES.LOGIN, credentials);
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw this.handleError(error);
    }
  }

  static async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...registrationData } = credentials;
      const response = await api.post<AuthResponse>(this.API_ROUTES.REGISTER, registrationData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw this.handleError(error);
    }
  }

  static async logout(): Promise<void> {
    try {
      await api.post(this.API_ROUTES.LOGOUT);
      localStorage.removeItem('token');
    } catch (error) {
      console.error('Logout error:', error);
      throw this.handleError(error);
    }
  }

  static async validateToken(): Promise<AuthResponse> {
    try {
      const response = await api.get<AuthResponse>(this.API_ROUTES.VALIDATE);
      return response.data;
    } catch (error) {
      console.error('Token validation error:', error);
      throw this.handleError(error);
    }
  }

  private static handleError(error: unknown): Error {
    if (isAxiosError(error)) {
      const message = error.response?.data?.message || error.message || 'An error occurred';
      return new Error(message);
    }
    return error instanceof Error ? error : new Error('An unexpected error occurred');
  }
}