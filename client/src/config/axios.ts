// client/src/config/axios.ts
import axios, { AxiosError } from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AUTH_ERROR_EVENT = 'auth_error';

export const api = axios.create({
  baseURL,
  timeout: 30000, // Increased timeout
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Add this to handle CORS
});

// Request Interceptor with logging
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request details
    console.log('API Request:', {
      method: config.method,
      url: config.url,
      headers: {
        ...config.headers,
        Authorization: config.headers.Authorization ? 'Bearer [TOKEN]' : undefined
      },
      data: config.data
    });
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with enhanced error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  async (error: AxiosError) => {
    // Enhanced error logging
    console.error('API Error:', {
      name: error.name,
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL
      }
    });

    // Network error handling
    if (!error.response) {
      console.error('Network Error. Please check your connection.');
      return Promise.reject(new Error('Network Error. Please check your connection.'));
    }

    // Authentication error handling
    const status = error.response?.status;
    if (status === 401) {
      if (!error.config?.url?.includes('/auth/validate')) {
        localStorage.removeItem('token');
        window.dispatchEvent(new CustomEvent(AUTH_ERROR_EVENT));
      }
    }

    // Server error handling
    if (status >= 500) {
      console.error('Server Error:', error.response.data);
      return Promise.reject(new Error('Internal Server Error. Please try again later.'));
    }

    return Promise.reject(error);
  }
);

// Token validation helper
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    const tokenData = JSON.parse(atob(token.split('.')[1]));
    const isExpired = tokenData.exp * 1000 < Date.now();
    
    if (isExpired) {
      localStorage.removeItem('token');
      return false;
    }
    
    return true;
  } catch (error) {
    console.warn('Token validation error:', error);
    localStorage.removeItem('token');
    return false;
  }
};

// API health check
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    await api.get('/api/test');
    return true;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};

export default api;