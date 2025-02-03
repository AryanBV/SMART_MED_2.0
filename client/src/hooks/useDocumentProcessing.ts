// Path: /client/src/hooks/useDocumentProcessing.ts

import { useState } from 'react';
import { ExtractedMedicine } from '@/interfaces/documentTypes';
import { DocumentService } from '@/services/documents';
import { useToast } from '@/components/ui/use-toast';

export const useDocumentProcessing = () => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<{
    medicines: ExtractedMedicine[];
    rawText?: string;
  } | null>(null);

  const processDocument = async (documentId: number) => {
    try {
      setIsProcessing(true);
      setProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const response = await DocumentService.retryProcessing(documentId);
      
      clearInterval(progressInterval);
      setProgress(100);

      if (response.extractedData) {
        setExtractedData({
          medicines: response.extractedData.medicines,
          rawText: response.extractedData.rawText
        });
      }

      toast({
        title: "Success",
        description: "Document processed successfully",
      });

      return response;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to process document",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    progress,
    extractedData,
    processDocument,
    setExtractedData
  };
};