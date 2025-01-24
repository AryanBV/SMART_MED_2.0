import axios from '@/config/axios';
import { LoginCredentials, RegisterCredentials, AuthResponse } from '@/interfaces/auth';

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await axios.post<AuthResponse>('/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const response = await axios.post<AuthResponse>('/auth/register', credentials);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async logout(): Promise<void> {
    try {
      await axios.post('/auth/logout');
      localStorage.removeItem('token');
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async validateToken(): Promise<AuthResponse> {
    try {
      const response = await axios.get<AuthResponse>('/auth/validate');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private static handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || 'An error occurred';
      return new Error(message);
    }
    return error;
  }
}