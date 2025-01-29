import axios, { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AUTH_ERROR_EVENT = 'auth_error';

export const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Request Interceptor for Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;

    if (status === 401 && !error.config?.url?.includes('/auth/validate')) {
      if (isAuthenticated()) {
        console.warn('Unauthorized request, logging out...');
        localStorage.removeItem('token');
        window.dispatchEvent(new CustomEvent(AUTH_ERROR_EVENT));
        // Remove this line as it causes page reload:
        // window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    const tokenData = JSON.parse(atob(token.split('.')[1]));
    return tokenData.exp * 1000 > Date.now();
  } catch (error) {
    console.warn('Invalid token:', error);
    return false;
  }
};

export default api;