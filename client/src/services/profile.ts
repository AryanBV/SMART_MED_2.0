// File: /client/src/services/profile.ts

import api from '@/config/axios';
import type { CreateProfileSchema } from '@/validations/profileSchemas';
import type { Profile } from '@/interfaces/profile';

const createProfile = async (data: CreateProfileSchema): Promise<Profile> => {
  const response = await api.post<Profile>('/api/profiles', data);
  return response.data;
};

const updateProfile = async (id: string, data: Partial<CreateProfileSchema>): Promise<Profile> => {
  const response = await api.put<Profile>(`/api/profiles/${id}`, data);
  return response.data;
};

const getProfile = async (): Promise<Profile> => {
  const response = await api.get<Profile>('/api/profiles/me');
  return response.data;
};

const getProfileById = async (id: string): Promise<Profile> => {
  const response = await api.get<Profile>(`/api/profiles/${id}`);
  return response.data;
};

const getFamilyProfiles = async (): Promise<Profile[]> => {
  const response = await api.get<Profile[]>('/api/profiles/family');
  return response.data;
};

const getFamilyMemberProfile = async (memberId: string): Promise<Profile> => {
  const response = await api.get<Profile>(`/api/profiles/family/${memberId}`);
  return response.data;
};

const linkFamilyMember = async (memberId: string, relationship: string): Promise<void> => {
  await api.post(`/api/profiles/family/link`, { memberId, relationship });
};

const unlinkFamilyMember = async (memberId: string): Promise<void> => {
  await api.post(`/api/profiles/family/unlink/${memberId}`);
};

export const ProfileService = {
  createProfile,
  updateProfile,
  getProfile,
  getProfileById,
  getFamilyProfiles,
  getFamilyMemberProfile,
  linkFamilyMember,
  unlinkFamilyMember
};