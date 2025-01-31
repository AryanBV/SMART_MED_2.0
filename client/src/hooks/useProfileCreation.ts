// File: /client/src/hooks/useProfileCreation.ts

import { useMutation } from '@tanstack/react-query';
import { CreateProfileSchema } from '@/validations/profileSchemas';
import { ProfileService } from '@/services/profile';
import { useToast } from '@/components/ui/use-toast';

export const useProfileCreation = () => {
  const { toast } = useToast();

  const { mutate: createProfile, isLoading } = useMutation({
    mutationFn: (data: CreateProfileSchema) => ProfileService.createProfile(data),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Profile created successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create profile',
        variant: 'destructive',
      });
    },
  });

  return {
    createProfile,
    isLoading,
  };
};

export default useProfileCreation;