import { useAuth } from './useAuth';
import { api } from '@/services/api';

export function useApi() {
  const { user } = useAuth();
  
  const authenticatedApi = {
    ...api,
    defaults: {
      ...api.defaults,
      headers: {
        ...api.defaults.headers,
        Authorization: user ? `Bearer ${user.token}` : undefined,
      },
    },
  };

  return authenticatedApi;
}