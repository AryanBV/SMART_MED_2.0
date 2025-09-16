// Hook for profile creation functionality
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileService } from '@/services/profile';
import type { ProfileFormData } from '@/interfaces/types';

export const useProfileCreation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, updateUser } = useAuth();

  const createProfile = async (data: ProfileFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const profile = await ProfileService.createProfile(data);
      
      // Update the user context with the new profile information
      if (user && profile.id) {
        updateUser({
          ...user,
          profileId: profile.id
        });
      }
      
      toast({
        title: "Success",
        description: "Profile created successfully",
      });
      
      // Navigate to dashboard or appropriate page
      navigate('/dashboard');
      
      return profile;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create profile';
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createProfile,
    isLoading,
    error
  };
};