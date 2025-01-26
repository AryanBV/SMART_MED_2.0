// src/config/axios.ts
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

console.log('API Base URL:', baseURL); // For debugging

export const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('Making request to:', config.url); // For debugging
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.status);
    return response;
  },
  async (error) => {
    console.error('Response error:', error.response?.status, error.response?.data);
    
    if (error.response?.status === 404) {
      console.error('API endpoint not found:', error.config.url);
    }

    return Promise.reject(error);
  }
);

export default api; // Keep default export for backward compatibility