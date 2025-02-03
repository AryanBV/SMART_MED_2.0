// Path: /client/src/hooks/useFamilyDocuments.ts

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DocumentService } from '@/services/documents';
import { FamilyMemberDocument } from '@/interfaces/documentTypes';
import { useToast } from '@/components/ui/use-toast';

export const useFamilyDocuments = (profileId: number | null) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: documents,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['documents', profileId],
    queryFn: () => profileId ? DocumentService.getDocuments(profileId) : Promise.resolve([]),
    enabled: !!profileId
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, profileId }: { file: File; profileId: number }) =>
      DocumentService.uploadDocument(file, profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', profileId] });
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to upload document",
        variant: "destructive",
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: DocumentService.deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', profileId] });
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete document",
        variant: "destructive",
      });
    }
  });

  const retryProcessingMutation = useMutation({
    mutationFn: DocumentService.retryProcessing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', profileId] });
      toast({
        title: "Success",
        description: "Document reprocessed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to reprocess document",
        variant: "destructive",
      });
    }
  });

  return {
    documents: documents || [],
    isLoading,
    error,
    uploadDocument: uploadMutation.mutateAsync,
    deleteDocument: deleteMutation.mutateAsync,
    retryProcessing: retryProcessingMutation.mutateAsync,
    refetch
  };
};