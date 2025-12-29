// Path: C:\Project\SMART_MED_2.0\client\src\hooks\useFamilyProfiles.ts

import { useQuery } from '@tanstack/react-query';
import { ProfileService } from '@/services/profile';
import type { Profile } from '@/interfaces/profile';
import { useAuth } from '@/contexts/AuthContext';

export const useFamilyProfiles = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['familyProfiles'],
    queryFn: async () => {
      const profiles = await ProfileService.getFamilyProfiles();
      return profiles;
    },
    enabled: !!user,
  });
};