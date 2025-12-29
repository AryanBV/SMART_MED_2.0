// Path: C:\Project\SMART_MED_2.0\client\src\hooks\useDocuments.ts

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DocumentService } from '@/services/documents';
import { useToast } from '@/components/ui/use-toast';
import type { DocumentFilter, FamilyMemberDocument } from '@/interfaces/documentTypes';

export const useDocuments = (profileId?: number) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<DocumentFilter>({});

  // Query for fetching documents
  const {
    data: documents,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['documents', profileId, filters],
    queryFn: () => DocumentService.getDocuments(profileId, filters),
    enabled: !!profileId
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: ({ 
      file, 
      documentType, 
      targetProfileId 
    }: { 
      file: File; 
      documentType: string; 
      targetProfileId: number 
    }) => DocumentService.uploadDocument(file, targetProfileId, documentType),
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

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: DocumentService.deleteDocument,
    onSuccess: (_, documentId) => {
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

  // Retry processing mutation
  const retryProcessingMutation = useMutation({
    mutationFn: DocumentService.retryProcessing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', profileId] });
      toast({
        title: "Success",
        description: "Document processing restarted",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to retry processing",
        variant: "destructive",
      });
    }
  });

  // Update access mutation
  const updateAccessMutation = useMutation({
    mutationFn: ({ id, access_level }: { id: number; access_level: string }) =>
      DocumentService.updateDocumentAccess(id, access_level),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', profileId] });
      toast({
        title: "Success",
        description: "Document access updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update access",
        variant: "destructive",
      });
    }
  });

  return {
    documents: documents || [],
    isLoading,
    error,
    filters,
    setFilters,
    uploadDocument: uploadMutation.mutateAsync,
    deleteDocument: deleteMutation.mutateAsync,
    retryProcessing: retryProcessingMutation.mutateAsync,
    updateAccess: updateAccessMutation.mutateAsync,
    refetch
  };
};