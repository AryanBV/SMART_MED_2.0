import axios from '@/config/axios';
import { LoginCredentials, RegisterCredentials, AuthResponse } from '@/interfaces/auth';

export const AuthService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const { confirmPassword, ...registrationData } = credentials;
    const response = await axios.post<AuthResponse>('/auth/register', registrationData);
    return response.data;
  },

  async logout(): Promise<void> {
    await axios.post('/auth/logout');
    localStorage.removeItem('token');
  },

  async validateToken(): Promise<AuthResponse> {
    const response = await axios.get<AuthResponse>('/auth/validate');
    return response.data;
  }
};