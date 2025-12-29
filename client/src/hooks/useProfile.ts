// src/hooks/useProfile.ts
import { useState, useEffect } from 'react';
import { Profile } from '@/interfaces/profile';
import { ProfileService } from '@/services/profile';
import { useAuth } from '@/contexts/AuthContext';

interface UseProfileReturn {
  profile: Profile | null;
  loading: boolean;
  error: Error | null;
  fetchProfile: () => Promise<Profile | null>;
}

export const useProfile = (): UseProfileReturn => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchProfile = async () => {
    if (!user) {
      setLoading(false);
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await ProfileService.getProfile();
      setProfile(data);
      return data;
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      setError(new Error(error.response?.data?.message || 'Failed to load profile'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  return {
    profile,
    loading,
    error,
    fetchProfile,
  };
};