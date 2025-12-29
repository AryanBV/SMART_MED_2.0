// Path: C:\Project\SMART_MED_2.0\client\src\hooks\useDocumentProcessing.ts

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DocumentProcessingService } from '@/services/documentProcessing';
import { useToast } from '@/components/ui/use-toast';
import type { 
  ProcessedDocument, 
  ProcessingStatus, 
  ExtractedMedicine,
  ExtractedDocumentData 
} from '@/interfaces/documentTypes';

interface ProcessingHistory {
  stage: string;
  status: string;
  timestamp: string;
  error?: string;
  processingTime?: number;
}

export const useDocumentProcessing = (documentId: number) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  // Query for document processing status
  const { data: processingStatus, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['documentProcessing', documentId, 'status'],
    queryFn: () => DocumentProcessingService.getProcessingStatus(documentId),
    enabled: !!documentId,
    refetchInterval: (data) => 
      data?.status === 'processing' ? 2000 : false,
  });

  // Query for processing history
  const { data: processingHistory } = useQuery({
    queryKey: ['documentProcessing', documentId, 'history'],
    queryFn: () => DocumentProcessingService.getProcessingHistory(documentId),
    enabled: !!documentId,
  });

  // Query for extracted data
  const { data: extractedData, isLoading: isLoadingData } = useQuery({
    queryKey: ['documentProcessing', documentId, 'data'],
    queryFn: () => DocumentProcessingService.getExtractedData(documentId),
    enabled: !!documentId && processingStatus?.status === 'completed',
  });

  // Process document mutation
  const processMutation = useMutation({
    mutationFn: async () => {
      setIsProcessing(true);
      try {
        // Process document
        const processedDoc = await DocumentProcessingService.processDocument(documentId);
        
        // Get extracted data
        const extractedData = await DocumentProcessingService.getExtractedData(documentId);
        
        // Update dashboard if we have profile ID
        if (processedDoc.profileId) {
          await DocumentProcessingService.updateDashboardData(
            processedDoc.profileId,
            extractedData as ExtractedDocumentData
          );
        }

        return { processedDoc, extractedData };
      } finally {
        setIsProcessing(false);
      }
    },
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['documentProcessing', documentId] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      toast({
        title: "Success",
        description: "Document processed and dashboard updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Processing Error",
        description: error.message || "Failed to process document",
        variant: "destructive",
      });
    }
  });

  // Verify medicines mutation
  const verifyMedicinesMutation = useMutation({
    mutationFn: (medicines: ExtractedMedicine[]) =>
      DocumentProcessingService.verifyMedicines(documentId, medicines),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentProcessing', documentId] });
      toast({
        title: "Success",
        description: "Medicines verified successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Verification Error",
        description: error.message || "Failed to verify medicines",
        variant: "destructive",
      });
    }
  });

  // Retry processing mutation
  const retryProcessingMutation = useMutation({
    mutationFn: () => DocumentProcessingService.retryProcessing(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentProcessing', documentId] });
      toast({
        title: "Success",
        description: "Processing retry initiated",
      });
    }
  });

  // Process document handler
  const processDocument = useCallback(async () => {
    if (isProcessing) return;
    await processMutation.mutateAsync();
  }, [isProcessing, processMutation]);

  // Verify medicines handler
  const verifyMedicines = useCallback(async (medicines: ExtractedMedicine[]) => {
    await verifyMedicinesMutation.mutateAsync(medicines);
  }, [verifyMedicinesMutation]);

  // Retry processing handler
  const retryProcessing = useCallback(async () => {
    await retryProcessingMutation.mutateAsync();
  }, [retryProcessingMutation]);

  return {
    // Status and data
    processingStatus,
    processingHistory,
    extractedData,
    
    // Loading states
    isProcessing: isProcessing || processMutation.isLoading,
    isLoading: isLoadingStatus || isLoadingData,
    
    // Error states
    isError: processMutation.isError,
    error: processMutation.error,
    
    // Actions
    processDocument,
    verifyMedicines,
    retryProcessing,
    
    // Additional states
    isVerifying: verifyMedicinesMutation.isLoading,
    isRetrying: retryProcessingMutation.isLoading,
    verificationError: verifyMedicinesMutation.error
  };
};

export default useDocumentProcessing;