// src/pages/ProfilePage.tsx
import React, { useEffect, useState } from 'react';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { ProfileService } from '@/services/profile';
import { useToast } from '@/components/ui/use-toast';
import { Profile, ProfileFormData } from '@/interfaces/profile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ProfilePage = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadProfile = async () => {
    try {
      console.log('Attempting to load profile...');
      const data = await ProfileService.getProfile();
      console.log('Profile data received:', data);
      setProfile(data);
    } catch (error: any) {
      console.error('Error loading profile:', error);
      if (error.response?.status === 404) {
        console.log('No profile found - new user');
      } else {
        toast({
          title: "Error",
          description: "Failed to load profile. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSubmit = async (data: ProfileFormData) => {
    try {
      console.log('Submitting profile data:', data);
      if (profile) {
        await ProfileService.updateProfile(data);
      } else {
        await ProfileService.createProfile({
          full_name: data.full_name,
          date_of_birth: data.date_of_birth,
          gender: data.gender,
          is_parent: data.is_parent || false
        });
      }
      toast({
        title: "Success",
        description: "Profile saved successfully",
      });
      await loadProfile();
    } catch (error: any) {
      console.error('Profile save error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save profile",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{profile ? 'Edit Profile' : 'Create Profile'}</CardTitle>
        </CardHeader>
        <CardContent>
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