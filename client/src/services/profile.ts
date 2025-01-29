// src/services/profile.ts
import { api } from '@/config/axios';
import { Profile, ProfileFormData } from '@/interfaces/profile';

export const ProfileService = {
  createProfile: async (profileData: ProfileFormData) => {
    try {
      // Format the date before sending
      const formattedData = {
        ...profileData,
        date_of_birth: new Date(profileData.date_of_birth).toISOString().split('T')[0]
      };

      console.log('Sending formatted profile data:', formattedData);
      const response = await api.post<Profile>('/api/profiles', formattedData);
      console.log('Create profile response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating profile:', error.response?.data);
      throw error;
    }
  },

  getProfile: async () => {
    try {
      console.log('Attempting to fetch profile...');
      const response = await api.get<Profile>('/api/profiles/me');  // Make sure path includes /api
      console.log('Profile response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching profile:', error.response?.data);
      throw error;
    }
  },

  updateProfile: async (profileData: Partial<ProfileFormData>) => {
    const response = await api.put<Profile>('/api/profiles', profileData);
    return response.data;
  },

  deleteProfile: async () => {
    await api.delete('/api/profiles');
  }
};