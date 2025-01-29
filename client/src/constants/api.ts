// src/constants/api.ts
export const API_ENDPOINTS = {
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      LOGOUT: '/api/auth/logout',
      VALIDATE: '/api/auth/validate'
    },
    PROFILE: {
      CREATE: '/api/profiles',
      GET: '/api/profiles/me',
      UPDATE: '/api/profiles',
      DELETE: '/api/profiles'
    }
  };