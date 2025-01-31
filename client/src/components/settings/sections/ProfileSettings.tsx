// File: /client/src/components/settings/sections/ProfileSettings.tsx

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useProfile } from '@/hooks/useProfile';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { CreateProfileSchema } from '@/validations/profileSchemas';
import { ProfileService } from '@/services/profile';
import { useToast } from '@/components/ui/use-toast';

const ProfileSettings: React.FC = () => {
  const { profile, loading, error, fetchProfile } = useProfile();
  const { toast } = useToast();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading profile: {error.message}</div>;
  }

  const handleSubmit = async (data: CreateProfileSchema) => {
    try {
      if (profile?.id) {
        await ProfileService.updateProfile(profile.id, data);
        await fetchProfile();
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>
          Manage your personal information and medical details
        </CardDescription>
      </CardHeader>
      <CardContent>
        {profile && (
          <ProfileForm 
            initialData={profile}
            onSubmit={handleSubmit}
            isLoading={loading}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileSettings;