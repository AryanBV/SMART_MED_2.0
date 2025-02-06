// Path: C:\Project\SMART_MED_2.0\client\src\hooks\useFamilyDocuments.ts

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DocumentService } from '@/services/documents';
import { useToast } from '@/components/ui/use-toast';
import type { DocumentFilter, FamilyMemberDocument } from '@/interfaces/documentTypes';

export const useFamilyDocuments = (familyProfileId: number | null) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<DocumentFilter>({});

  // Query for fetching family documents
  const {
    data: documents,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['familyDocuments', familyProfileId, filters],
    queryFn: () => familyProfileId ? 
      DocumentService.getFamilyDocuments(familyProfileId) : 
      Promise.resolve([]),
    enabled: !!familyProfileId
  });

  // Share document mutation
  const shareMutation = useMutation({
    mutationFn: ({ documentId, profileIds }: { documentId: number; profileIds: number[] }) =>
      DocumentService.shareDocument(documentId, profileIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyDocuments', familyProfileId] });
      toast({
        title: "Success",
        description: "Document shared successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to share document",
        variant: "destructive",
      });
    }
  });

  // Get shared documents query
  const {
    data: sharedDocuments,
    isLoading: isLoadingShared,
    error: sharedError
  } = useQuery({
    queryKey: ['sharedDocuments'],
    queryFn: () => DocumentService.getSharedDocuments(),
  });

  const applyFilters = (documents: FamilyMemberDocument[]) => {
    return documents?.filter(doc => {
      if (filters.familyProfileId && doc.profileId !== Number(filters.familyProfileId)) return false;
      if (filters.documentType && filters.documentType !== 'all') {
        if (doc.document_type !== filters.documentType) return false;
      }
      if (filters.processingStatus && filters.processingStatus !== 'all') {
        if (doc.processed_status !== filters.processingStatus) return false;
      }
      // Add more filters as needed
      return true;
    });
  };

  return {
    documents: applyFilters(documents || []),
    sharedDocuments: applyFilters(sharedDocuments || []),
    isLoading: isLoading || isLoadingShared,
    error: error || sharedError,
    filters,
    setFilters,
    shareDocument: shareMutation.mutateAsync,
    refetch,
  };
};