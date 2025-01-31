// File: /client/src/pages/CreateProfilePage.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateProfileForm } from '@/components/profile/CreateProfileForm';
import { useProfileCreation } from '@/hooks/useProfileCreation';
import type { CreateProfileSchema } from '@/validations/profileSchemas';

const CreateProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { createProfile, isLoading } = useProfileCreation();

  const handleProfileCreation = async (data: CreateProfileSchema) => {
    createProfile(data, {
      onSuccess: () => {
        navigate('/dashboard');
      }
    });
  };

  return (
    <div className="container mx-auto py-8">
      <CreateProfileForm 
        onSubmit={handleProfileCreation}
        isLoading={isLoading}
      />
    </div>
  );
};

export default CreateProfilePage;