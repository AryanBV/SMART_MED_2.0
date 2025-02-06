// Path: C:\Project\SMART_MED_2.0\client\src\hooks\useMedicationUpdates.ts

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DocumentProcessingService } from '@/services/documentProcessing';
import { useToast } from '@/components/ui/use-toast';
import type { Medication, ExtractedDocumentData } from '@/interfaces/dashboard';

export const useMedicationUpdates = (profileId: number) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');

  // Query for current medications
  const { data: medications } = useQuery({
    queryKey: ['medications', profileId],
    queryFn: () => DocumentProcessingService.getMemberMedications(profileId),
    enabled: !!profileId,
  });

  // Mutation for updating medications
  const updateMedicationsMutation = useMutation({
    mutationFn: async (documentId: number) => {
      setProcessingStatus('processing');
      const extractedData = await DocumentProcessingService.processMedications(documentId);
      
      if (extractedData.medicines.length > 0) {
        const medications = extractedData.medicines.map(med => ({
          name: med.medicine_name,
          dosage: med.dosage || '',
          frequency: med.frequency || '',
          instructions: med.instructions,
          startDate: new Date().toISOString(),
          refills: med.refills
        }));

        await DocumentProcessingService.updateFamilyMemberMedications(
          profileId,
          medications
        );
      }
      
      setProcessingStatus('completed');
      return extractedData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['medications', profileId]);
      queryClient.invalidateQueries(['dashboard']);
      
      toast({
        title: "Success",
        description: `${data.medicines.length} medications updated successfully`,
      });
    },
    onError: (error: any) => {
      setProcessingStatus('error');
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update medications",
        variant: "destructive",
      });
    }
  });

  // Cleanup processing status
  useEffect(() => {
    if (processingStatus === 'completed') {
      const timer = setTimeout(() => setProcessingStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [processingStatus]);

  return {
    medications,
    updateMedications: updateMedicationsMutation.mutateAsync,
    isProcessing: processingStatus === 'processing',
    processingStatus,
    isError: processingStatus === 'error'
  };
};