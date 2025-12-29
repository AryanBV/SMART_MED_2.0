// Path: C:\Project\SMART_MED_2.0\client\src\hooks\useFamilyMembers.ts

import { useQuery } from '@tanstack/react-query';
import { FamilyService } from '@/services/family';
import type { FamilyMember } from '@/interfaces/family';

export const useFamilyMembers = () => {
  return useQuery<FamilyMember[]>({
    queryKey: ['familyMembers'],
    queryFn: FamilyService.getFamilyMembers,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};