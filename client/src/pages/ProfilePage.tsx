// src/pages/ProfilePage.tsx
import React from 'react';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { ProfileService } from '@/services/profile';
import { useToast } from '@/components/ui/use-toast';
import { ProfileFormData } from '@/interfaces/profile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { profile, loading, error } = useProfile();
  const { toast } = useToast();

  console.log('ProfilePage render:', { profile, loading, error }); // Add logging

  const handleSubmit = async (data: ProfileFormData) => {
    try {
      console.log('Submitting profile data:', data); // Add logging
      
      if (profile) {
        const updatedProfile = await ProfileService.updateProfile(data);
        console.log('Profile updated:', updatedProfile); // Add logging
        if (updatedProfile.id) {
          updateUser({ profileId: updatedProfile.id.toString() });
        }
      } else {
        const newProfile = await ProfileService.createProfile(data);
        console.log('New profile created:', newProfile); // Add logging
        if (newProfile.id) {
          updateUser({ profileId: newProfile.id.toString() });
        }
         navigate('/dashboard', { replace: true });
      }
      
      toast({
        title: "Success",
        description: "Profile saved successfully",
      });
    } catch (error: any) {
      console.error('Profile save error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save profile",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-500">Error loading profile: {error.message}</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="shadow-md">
        <CardHeader className="space-y-1 border-b border-gray-200">
          <CardTitle className="text-2xl font-bold text-gray-900">
            {profile ? 'Edit Profile' : 'Create Profile'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ProfileForm 
            initialData={profile || undefined}
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;