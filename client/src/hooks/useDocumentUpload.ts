// Path: /client/src/hooks/useDocumentUpload.ts

import { useState } from 'react';
import { DocumentService } from '@/services/documents';
import { useToast } from '@/components/ui/use-toast';

interface UseDocumentUploadOptions {
  onSuccess?: (response: any) => void;
  onError?: (error: any) => void;
  onProgress?: (progress: number) => void;
}

export const useDocumentUpload = (options: UseDocumentUploadOptions = {}) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');

  const upload = async (file: File, profileId: number, documentType: string) => {
    try {
      setIsUploading(true);
      setStatus('uploading');
      setProgress(0);

      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const response = await DocumentService.uploadDocument(file, profileId, documentType);

      clearInterval(progressInterval);
      setProgress(100);
      setStatus('success');
      
      options.onSuccess?.(response);
      
      toast({
        title: 'Success',
        description: 'Document uploaded successfully',
      });

      return response;
    } catch (error: any) {
      setStatus('error');
      options.onError?.(error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to upload document',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    upload,
    isUploading,
    progress,
    status,
    setProgress
  };
};