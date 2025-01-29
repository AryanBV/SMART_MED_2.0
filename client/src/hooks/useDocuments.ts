import { useState } from 'react';
import axios from '@/config/axios';

export const useDocuments = (profileId: string) => {
  const [isLoading, setIsLoading] = useState(false);

  const uploadDocument = async (file: File) => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('document', file);

      const response = await axios.post(
        `/api/documents/upload/${profileId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 100)
            );
            // You can use this to update a progress bar
            console.log(`Upload Progress: ${percentCompleted}%`);
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/documents/${profileId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    uploadDocument,
    getDocuments,
    isLoading,
  };
};